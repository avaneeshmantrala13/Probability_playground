import type {
  Action,
  GameConfig,
  GameState,
  HandResult,
  LegalActions,
  Persona,
  Pot,
  PotResult,
  Seat,
} from "./types";
import { shuffledDeck } from "./shuffle";
import { findWinners } from "./evaluator";

/**
 * A correct multi-player Texas Hold'em cash-game engine (pure logic). State is
 * advanced immutably: `applyAction` returns a NEW `GameState` so React can
 * diff it cheaply. All chip amounts are integers.
 */

// ----------------------------- construction -----------------------------

export interface CreateGameOpts {
  config: GameConfig;
  humanName: string;
  humanStack: number;
  /** One persona per bot seat (the host should be among them). */
  personas: Persona[];
}

export function createGame(opts: CreateGameOpts): GameState {
  const { config, humanName, humanStack, personas } = opts;
  const seats: Seat[] = [];
  seats.push(makeSeat(0, humanName, true, humanStack, undefined));
  personas.forEach((persona, i) => {
    seats.push(makeSeat(i + 1, persona.name, false, config.botStack, persona));
  });
  return {
    seats,
    config,
    button: 0,
    board: [],
    deck: [],
    stage: "complete",
    currentBet: 0,
    minRaise: config.bigBlind,
    toAct: null,
    lastAggressor: null,
    pot: 0,
    handNumber: 0,
    result: null,
    log: [],
  };
}

function makeSeat(
  index: number,
  name: string,
  isHuman: boolean,
  stack: number,
  persona?: Persona,
): Seat {
  return {
    index,
    name,
    isHuman,
    ...(persona !== undefined ? { persona } : {}),
    stack,
    holeCards: [],
    roundBet: 0,
    committed: 0,
    status: stack > 0 ? "active" : "out",
    hasActed: false,
  };
}

function cloneState(s: GameState): GameState {
  return {
    ...s,
    seats: s.seats.map((seat) => ({ ...seat, holeCards: [...seat.holeCards] })),
    board: [...s.board],
    deck: [...s.deck],
    log: [...s.log],
    result: s.result,
  };
}

// ----------------------------- helpers -----------------------------

/** Seats still in the hand (can win): active OR all-in. */
export function inHandSeats(s: GameState): Seat[] {
  return s.seats.filter((x) => x.status === "active" || x.status === "allin");
}

/** Seats that can still take a betting action. */
function actionableSeats(s: GameState): Seat[] {
  return s.seats.filter((x) => x.status === "active");
}

function recomputePot(s: GameState): void {
  s.pot = s.seats.reduce((sum, x) => sum + x.committed, 0);
}

/** Number of non-folded opponents for a given seat (used by the bot/equity). */
export function liveOpponents(s: GameState, seatIndex: number): number {
  return s.seats.filter(
    (x) =>
      x.index !== seatIndex &&
      (x.status === "active" || x.status === "allin"),
  ).length;
}

function nextOccupiedSeat(s: GameState, from: number): number {
  const n = s.seats.length;
  for (let step = 1; step <= n; step++) {
    const idx = (from + step) % n;
    if (s.seats[idx].status !== "out") return idx;
  }
  return from;
}

function firstActiveAfter(s: GameState, from: number): number | null {
  const n = s.seats.length;
  for (let step = 1; step <= n; step++) {
    const idx = (from + step) % n;
    if (s.seats[idx].status === "active") return idx;
  }
  return null;
}

// ----------------------------- hand setup -----------------------------

/**
 * Begin a new hand: rebuy busted bots, rotate the button, shuffle, deal hole
 * cards, post blinds, and set the first actor. Returns a fresh state.
 */
export function startHand(prev: GameState): GameState {
  const s = cloneState(prev);
  s.result = null;
  s.board = [];
  s.handNumber = prev.handNumber + 1;

  // Reset seats; bots auto-rebuy so the ring stays full (cash-game style).
  for (const seat of s.seats) {
    seat.holeCards = [];
    seat.roundBet = 0;
    seat.committed = 0;
    seat.hasActed = false;
    delete seat.lastAction;
    delete seat.quip;
    if (!seat.isHuman && seat.stack <= 0) {
      seat.stack = s.config.botStack;
    }
    seat.status = seat.stack > 0 ? "active" : "out";
  }

  const occupied = s.seats.filter((x) => x.status === "active");
  if (occupied.length < 2) {
    // Not enough players to deal — leave the table idle.
    s.stage = "complete";
    s.toAct = null;
    return s;
  }

  // Rotate the button to the next occupied seat.
  s.button = nextOccupiedSeat(s, prev.button);

  s.deck = shuffledDeck();

  // Blind positions. Heads-up: button is the small blind and acts first preflop.
  let sbSeat: number;
  let bbSeat: number;
  if (occupied.length === 2) {
    sbSeat = s.button;
    bbSeat = nextOccupiedSeat(s, s.button);
  } else {
    sbSeat = nextOccupiedSeat(s, s.button);
    bbSeat = nextOccupiedSeat(s, sbSeat);
  }

  // Deal 2 hole cards to each active seat, starting left of the button.
  for (let round = 0; round < 2; round++) {
    let idx = s.button;
    for (let i = 0; i < s.seats.length; i++) {
      idx = nextOccupiedSeat(s, idx);
      const seat = s.seats[idx];
      if (seat.status === "active") {
        seat.holeCards.push(s.deck.pop() as string);
      }
      if (idx === s.button) break;
    }
  }

  postBlind(s, sbSeat, s.config.smallBlind);
  postBlind(s, bbSeat, s.config.bigBlind);

  s.currentBet = Math.max(s.seats[sbSeat].roundBet, s.seats[bbSeat].roundBet);
  s.minRaise = s.config.bigBlind;
  s.lastAggressor = bbSeat;
  s.stage = "preflop";

  // First to act preflop: left of the big blind (or the SB/button heads-up).
  s.toAct = firstActiveAfter(s, bbSeat);
  // Blinds shouldn't count as "having acted" — they still get their option.
  for (const seat of s.seats) {
    if (seat.status === "active") seat.hasActed = false;
  }

  recomputePot(s);
  s.log.push(`Hand #${s.handNumber} dealt. Blinds ${s.config.smallBlind}/${s.config.bigBlind}.`);
  s.result = null;
  return s;
}

function postBlind(s: GameState, seatIndex: number, blind: number): void {
  const seat = s.seats[seatIndex];
  const amt = Math.min(blind, seat.stack);
  seat.stack -= amt;
  seat.roundBet += amt;
  seat.committed += amt;
  if (seat.stack === 0) seat.status = "allin";
  seat.lastAction = blind === s.config.smallBlind ? "SB" : "BB";
}

// ----------------------------- legal actions -----------------------------

export function legalActions(s: GameState): LegalActions {
  const none: LegalActions = {
    canFold: false,
    canCheck: false,
    canCall: false,
    callAmount: 0,
    canBet: false,
    canRaise: false,
    minRaiseTo: 0,
    maxRaiseTo: 0,
  };
  if (s.toAct == null) return none;
  const seat = s.seats[s.toAct];
  if (seat.status !== "active") return none;

  const toCall = Math.max(0, s.currentBet - seat.roundBet);
  const callAmount = Math.min(toCall, seat.stack);
  const maxRaiseTo = seat.roundBet + seat.stack; // all-in total
  const facingBet = toCall > 0;

  // A full bet/raise must reach at least currentBet + minRaise; if the seat
  // can't cover that, it may still move all-in for less.
  const fullRaiseTo = s.currentBet + s.minRaise;
  const canCoverFullRaise = maxRaiseTo >= fullRaiseTo;
  const hasChipsBeyondCall = seat.stack > toCall;

  return {
    canFold: true,
    canCheck: !facingBet,
    canCall: facingBet && callAmount > 0,
    callAmount,
    canBet: !facingBet && seat.stack > 0,
    canRaise: facingBet && hasChipsBeyondCall,
    minRaiseTo: Math.min(canCoverFullRaise ? fullRaiseTo : maxRaiseTo, maxRaiseTo),
    maxRaiseTo,
  };
}

// ----------------------------- apply action -----------------------------

export function applyAction(prev: GameState, action: Action): GameState {
  const s = cloneState(prev);
  if (s.toAct == null) return s;
  const seat = s.seats[s.toAct];
  if (seat.status !== "active") return s;

  const toCall = Math.max(0, s.currentBet - seat.roundBet);

  if (action.meta?.quip) seat.quip = action.meta.quip;

  switch (action.type) {
    case "fold": {
      seat.status = "folded";
      seat.hasActed = true;
      seat.lastAction = "Fold";
      break;
    }
    case "check": {
      seat.hasActed = true;
      seat.lastAction = "Check";
      break;
    }
    case "call": {
      const amt = Math.min(toCall, seat.stack);
      commit(seat, amt);
      seat.hasActed = true;
      seat.lastAction = "Call";
      if (seat.stack === 0) seat.status = "allin";
      break;
    }
    case "bet":
    case "raise":
    case "allin": {
      const maxTo = seat.roundBet + seat.stack;
      let target = action.amount ?? maxTo;
      target = Math.min(target, maxTo);
      // Never let a "raise" be below a call; floor it at the current bet.
      if (target < s.currentBet) target = Math.min(s.currentBet, maxTo);
      const add = target - seat.roundBet;
      commit(seat, add);
      const raiseIncrement = target - s.currentBet;
      const wasBet = s.currentBet === 0;
      seat.hasActed = true;
      seat.lastAction = wasBet ? "Bet" : "Raise";
      if (target > s.currentBet) {
        const fullRaise = raiseIncrement >= s.minRaise;
        s.currentBet = target;
        if (fullRaise) {
          // A full raise reopens the betting for everyone still active.
          s.minRaise = raiseIncrement;
          s.lastAggressor = seat.index;
          for (const o of s.seats) {
            if (o.status === "active" && o.index !== seat.index) o.hasActed = false;
          }
        } else {
          // All-in for less than a full raise: does NOT reopen action for
          // players who already acted, but updates the amount to call.
          s.lastAggressor = seat.index;
        }
      }
      if (seat.stack === 0) seat.status = "allin";
      break;
    }
  }

  recomputePot(s);

  // End conditions.
  const notFolded = s.seats.filter(
    (x) => x.status === "active" || x.status === "allin",
  );
  if (notFolded.length === 1) {
    awardUncontested(s, notFolded[0].index);
    return s;
  }

  if (roundComplete(s)) {
    advanceStreet(s);
  } else {
    const nxt = firstActiveAfter(s, seat.index);
    s.toAct = nxt;
    if (nxt == null) advanceStreet(s);
  }
  return s;
}

function commit(seat: Seat, amount: number): void {
  const amt = Math.max(0, Math.min(amount, seat.stack));
  seat.stack -= amt;
  seat.roundBet += amt;
  seat.committed += amt;
}

function roundComplete(s: GameState): boolean {
  const active = actionableSeats(s);
  // Everyone who can still act has acted and matched the current bet.
  return active.every((x) => x.hasActed && x.roundBet === s.currentBet);
}

// ----------------------------- street advance -----------------------------

function resetRound(s: GameState): void {
  for (const seat of s.seats) {
    seat.roundBet = 0;
    if (seat.status === "active") seat.hasActed = false;
    seat.lastAction = seat.status === "folded" ? "Fold" : undefined;
  }
  s.currentBet = 0;
  s.minRaise = s.config.bigBlind;
  s.lastAggressor = null;
}

function dealBoard(s: GameState, n: number): void {
  for (let i = 0; i < n; i++) s.board.push(s.deck.pop() as string);
}

function beginBettingOrAdvance(s: GameState): void {
  const canAct = actionableSeats(s).length;
  if (canAct >= 2) {
    s.toAct = firstActiveAfter(s, s.button);
    if (s.toAct == null) advanceStreet(s);
    return;
  }
  // Fewer than two players can act — run the board out to showdown.
  advanceStreet(s);
}

function advanceStreet(s: GameState): void {
  resetRound(s);
  switch (s.stage) {
    case "preflop":
      s.stage = "flop";
      dealBoard(s, 3);
      s.log.push(`Flop: ${s.board.join(" ")}`);
      beginBettingOrAdvance(s);
      break;
    case "flop":
      s.stage = "turn";
      dealBoard(s, 1);
      s.log.push(`Turn: ${s.board[3]}`);
      beginBettingOrAdvance(s);
      break;
    case "turn":
      s.stage = "river";
      dealBoard(s, 1);
      s.log.push(`River: ${s.board[4]}`);
      beginBettingOrAdvance(s);
      break;
    case "river":
      goToShowdown(s);
      break;
    default:
      break;
  }
}

// ----------------------------- showdown / payouts -----------------------------

/**
 * Build (side) pots from each seat's total committed chips. Standard layered
 * algorithm: peel off the smallest remaining contribution as a level, every
 * contributor pays that level into a pot, and only non-folded contributors at
 * that level are eligible to win it.
 */
export function buildSidePots(seats: Seat[]): Pot[] {
  const remaining = seats
    .filter((x) => x.committed > 0)
    .map((x) => ({ index: x.index, amt: x.committed, folded: x.status === "folded" }));
  const pots: Pot[] = [];

  while (true) {
    const positive = remaining.filter((r) => r.amt > 0);
    if (positive.length === 0) break;
    const level = Math.min(...positive.map((r) => r.amt));
    let potAmt = 0;
    const eligible: number[] = [];
    for (const r of remaining) {
      if (r.amt > 0) {
        potAmt += level;
        r.amt -= level;
        if (!r.folded) eligible.push(r.index);
      }
    }
    if (potAmt > 0) {
      // Merge consecutive pots that share the same eligibility set.
      const last = pots[pots.length - 1];
      if (last && sameSet(last.eligible, eligible)) {
        last.amount += potAmt;
      } else {
        pots.push({ amount: potAmt, eligible });
      }
    }
  }
  return pots;
}

function sameSet(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every((x) => setA.has(x));
}

function goToShowdown(s: GameState): void {
  s.stage = "showdown";
  s.toAct = null;

  const pots = buildSidePots(s.seats);
  const potResults: PotResult[] = [];
  const net: Record<number, number> = {};
  for (const seat of s.seats) net[seat.index] = -seat.committed;

  for (const pot of pots) {
    const contenders = pot.eligible.map((idx) => ({
      seat: idx,
      holeCards: s.seats[idx].holeCards,
    }));
    if (contenders.length === 0) continue;
    const { winners, descr } = findWinners(contenders, s.board);
    distribute(s, pot.amount, winners, net);
    potResults.push({ amount: pot.amount, winners, descr });
  }

  recomputePot(s);
  const result: HandResult = {
    pots: potResults,
    netBySeat: net,
    uncontested: false,
    totalPot: pots.reduce((sum, p) => sum + p.amount, 0),
  };
  s.result = result;
  s.stage = "complete";
  const summary = potResults
    .map((p) => `${p.winners.map((w) => s.seats[w].name).join(", ")} wins ${p.amount}`)
    .join("; ");
  if (summary) s.log.push(`Showdown — ${summary}.`);
}

/** Split `amount` among winners; odd chips go to seats earliest after button. */
function distribute(
  s: GameState,
  amount: number,
  winners: number[],
  net: Record<number, number>,
): void {
  if (winners.length === 0) return;
  const share = Math.floor(amount / winners.length);
  let remainder = amount - share * winners.length;

  // Order winners starting from the first seat left of the button for odd chips.
  const ordered = [...winners].sort((a, b) => {
    const ra = (a - s.button + s.seats.length) % s.seats.length;
    const rb = (b - s.button + s.seats.length) % s.seats.length;
    return ra - rb;
  });

  for (const w of ordered) {
    let amt = share;
    if (remainder > 0) {
      amt += 1;
      remainder--;
    }
    s.seats[w].stack += amt;
    net[w] += amt;
  }
}

function awardUncontested(s: GameState, winnerSeat: number): void {
  const total = s.seats.reduce((sum, x) => sum + x.committed, 0);
  const net: Record<number, number> = {};
  for (const seat of s.seats) net[seat.index] = -seat.committed;
  s.seats[winnerSeat].stack += total;
  net[winnerSeat] += total;
  s.stage = "complete";
  s.toAct = null;
  s.result = {
    pots: [{ amount: total, winners: [winnerSeat], descr: "" }],
    netBySeat: net,
    uncontested: true,
    totalPot: total,
  };
  recomputePot(s);
  s.log.push(`${s.seats[winnerSeat].name} wins ${total} uncontested.`);
}
