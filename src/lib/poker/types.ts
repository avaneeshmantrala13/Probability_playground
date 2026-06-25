/**
 * Core Texas Hold'em types. Cards are plain `RANK+SUIT` strings (e.g. "Ad",
 * "Th") so they can be fed directly to `pokersolver` for evaluation.
 *
 * Design notes (see also shuffle.ts / equity.ts):
 *  - Hand EVALUATION is delegated to `pokersolver` (battle-tested, handles all
 *    showdown edge cases incl. ties), wrapped thinly in `evaluator.ts`.
 *  - DECK SHUFFLING uses an unbiased Fisher–Yates seeded by
 *    `crypto.getRandomValues` with rejection sampling (see `shuffle.ts`).
 *  - All chip amounts are INTEGERS (token chips); never use floats for money.
 */

export type Suit = "s" | "h" | "d" | "c";

/** Rank chars as required by pokersolver — note TEN is "T". */
export type Rank =
  | "A"
  | "K"
  | "Q"
  | "J"
  | "T"
  | "9"
  | "8"
  | "7"
  | "6"
  | "5"
  | "4"
  | "3"
  | "2";

/** A single card, e.g. "As", "Td", "2c". */
export type Card = string;

/** Which betting street the hand is on. */
export type Stage = "preflop" | "flop" | "turn" | "river" | "showdown" | "complete";

/** Whether a seat can still act / win this hand. */
export type SeatStatus = "active" | "folded" | "allin" | "out";

export type ActionType = "fold" | "check" | "call" | "bet" | "raise" | "allin";

/** A player action. `amount` is the TOTAL the seat's round bet becomes (a
 *  "raise to" / "bet to" amount), not the increment, for bet/raise/call. */
export interface Action {
  type: ActionType;
  /** Target round-bet total for bet/raise (and the matched total for call). */
  amount?: number;
  /** Optional UI flavor — never affects engine logic. */
  meta?: { equity?: number; quip?: string };
}

/** A bot personality (canned, client-only — NO network/LLM calls). */
export interface Persona {
  id: string;
  name: string;
  avatar: string;
  /** 0..1 baseline willingness to bet/raise rather than call/check. */
  aggression: number;
  /** 0..1 how often it fires bluffs with weak holdings. */
  bluffFreq: number;
  /** 0..1 how strong a hand it needs to continue (higher = folds more). */
  tightness: number;
  /** The one friendly host that greets/explains; still plays by the math. */
  isHost?: boolean;
  /** Templated quips keyed by situation (see personalities.ts). */
  lines: PersonaLines;
}

export interface PersonaLines {
  raise: string[];
  bet: string[];
  call: string[];
  check: string[];
  fold: string[];
  win: string[];
  bluffCaught: string[];
  greet: string[];
}

export interface Seat {
  index: number;
  name: string;
  isHuman: boolean;
  /** undefined for the human seat. */
  persona?: Persona;
  /** Chips in front of the player (their table stack). */
  stack: number;
  holeCards: Card[];
  /** Chips committed in the CURRENT betting round. */
  roundBet: number;
  /** Total chips committed across the WHOLE hand (drives side pots). */
  committed: number;
  status: SeatStatus;
  /** Whether the seat has had a turn in the current betting round. */
  hasActed: boolean;
  /** Last action label this hand, for the UI bubble. */
  lastAction?: string;
  /** Optional table-talk bubble text (cleared as play moves on). */
  quip?: string;
}

/** A (side) pot and the seat indices eligible to win it. */
export interface Pot {
  amount: number;
  eligible: number[];
}

export interface PotResult {
  amount: number;
  /** Seats that won (split) this pot. */
  winners: number[];
  /** Human-readable winning hand description (from pokersolver). */
  descr: string;
}

export interface HandResult {
  pots: PotResult[];
  /** Net chip delta per seat for this hand (for stats/animations). */
  netBySeat: Record<number, number>;
  /** True when the pot was won uncontested (everyone else folded). */
  uncontested: boolean;
  /** Total pot size that was awarded. */
  totalPot: number;
}

export interface GameConfig {
  smallBlind: number;
  bigBlind: number;
  /** 0..1 difficulty knob scaling bot accuracy/aggression. */
  botSkill: number;
  /** The buy-in bots rebuy to when they bust (cash-game ring stays full). */
  botStack: number;
}

export interface GameState {
  seats: Seat[];
  config: GameConfig;
  /** Dealer button seat index. */
  button: number;
  board: Card[];
  /** Remaining undealt cards (we pop from the end). */
  deck: Card[];
  stage: Stage;
  /** Highest round-bet anyone has made this street. */
  currentBet: number;
  /** Minimum legal raise INCREMENT for the next raise. */
  minRaise: number;
  /** Seat whose turn it is, or null between hands / at showdown. */
  toAct: number | null;
  /** Last seat to bet/raise this street (drives round completion). */
  lastAggressor: number | null;
  pot: number;
  handNumber: number;
  result: HandResult | null;
  /** Append-only log of notable events for the UI feed. */
  log: string[];
}

/** Bounds describing what the seat-to-act may legally do right now. */
export interface LegalActions {
  canFold: boolean;
  canCheck: boolean;
  canCall: boolean;
  /** Chips the seat must add to call (0 if can check). */
  callAmount: number;
  canBet: boolean;
  canRaise: boolean;
  /** Smallest legal "raise/bet to" total (round-bet target). */
  minRaiseTo: number;
  /** Largest legal "raise/bet to" total (all-in). */
  maxRaiseTo: number;
}
