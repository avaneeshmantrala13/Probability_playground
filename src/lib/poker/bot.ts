import type { Action, GameState, Persona } from "./types";
import { estimateEquity } from "./equity";
import { legalActions, liveOpponents } from "./engine";
import { pickLine } from "./personalities";

/**
 * Math-driven bot policy.
 *
 * The decision is anchored on REAL poker math, never on personality:
 *   1. EQUITY — a Monte-Carlo estimate (equity.ts) of P(win/tie) against the
 *      current number of live opponents, given the bot's hole cards + board.
 *   2. POT ODDS — the break-even equity to call, callCost / (pot + callCost).
 *      A call is +EV when equity > pot odds.
 *   3. POSITION — acting later (fewer players behind) widens the betting range.
 *   4. AGGRESSION / BLUFF — per-persona knobs, scaled by the table `botSkill`,
 *      that decide bet/raise SIZING and how often to fire bluffs/semi-bluffs.
 *   5. OPPONENT READ — an optional, evolving model of the human's tendencies
 *      (fold-to-bet, aggression, looseness). Bots EXPLOIT it the way real
 *      players do: bluff more into folders, value-bet thinner into stations,
 *      and call down lighter against maniacs. The strength of the adjustment
 *      scales with the table `botSkill` and how much data we've gathered, so
 *      the Beginner's Table barely adapts while the Whale Room reads you hard.
 *
 * Personality quips are attached purely for flavor (`action.meta.quip`) and can
 * never change which action the math selects. Everything is client-side.
 */

/**
 * A live, session-local read on a single opponent (the human). All fields are
 * 0..1 and optional until enough hands have been observed.
 */
export interface OpponentModel {
  /** Fraction of faced bets the opponent folds (higher = more bluffable). */
  foldToBet?: number;
  /** How often the opponent bets/raises vs calls (higher = maniac). */
  aggression?: number;
  /** How often the opponent voluntarily puts money in (higher = looser). */
  looseness?: number;
  /** Decisions observed — used to scale how confidently bots exploit. */
  samples: number;
}

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

const NEUTRAL: Pick<Persona, "aggression" | "bluffFreq" | "tightness"> = {
  aggression: 0.5,
  bluffFreq: 0.15,
  tightness: 0.5,
};

/** How many active opponents still have to act behind this seat this round. */
function playersBehind(s: GameState, seatIndex: number): number {
  let count = 0;
  for (const seat of s.seats) {
    if (seat.index === seatIndex) continue;
    if (seat.status !== "active") continue;
    if (!seat.hasActed || seat.roundBet < s.currentBet) count++;
  }
  return count;
}

function monteCarloIterations(botSkill: number, opponents: number): number {
  // Sharper tables think harder; trim a little when the field is large to stay
  // responsive. Capped to the 600–1500 budget.
  const base = 600 + botSkill * 900;
  const adjusted = base - Math.max(0, opponents - 1) * 90;
  return Math.round(clamp(adjusted, 600, 1500));
}

export interface BotDecision extends Action {
  /** Estimated equity at decision time (for UI / debugging). */
  equity: number;
}

export function decideBotAction(
  state: GameState,
  seatIndex: number,
  model?: OpponentModel,
): BotDecision {
  const seat = state.seats[seatIndex];
  const la = legalActions(state);
  const persona = seat.persona;
  const knobs = persona ?? NEUTRAL;

  const opp = Math.max(1, liveOpponents(state, seatIndex));
  const iterations = monteCarloIterations(state.config.botSkill, opp);
  const raw = estimateEquity(seat.holeCards, state.board, opp, iterations).equity;

  // Lower-skill bots mis-estimate their equity (random read error); high-skill
  // bots see it almost perfectly.
  const noiseScale = (1 - state.config.botSkill) * 0.22;
  const eq = clamp01(raw + (Math.random() - 0.5) * 2 * noiseScale);

  const totalActive = state.seats.filter((x) => x.status === "active").length;
  const behind = playersBehind(state, seatIndex);
  const positionFactor = totalActive > 1 ? 1 - behind / totalActive : 1;

  // -------------------- opponent read (exploit strength) --------------------
  // How hard this seat exploits the human: sharper tables exploit more, and
  // only once we have a meaningful sample. Beginners (skill .45) top out around
  // a third-strength read; the Whale Room (skill .92) reads you almost fully.
  const confidence = model ? clamp01(model.samples / 12) : 0;
  const exploit = clamp01(state.config.botSkill * confidence);
  // Bluffs scale UP into a folder, DOWN into a calling station.
  const foldRead = model?.foldToBet;
  const bluffMult =
    foldRead != null ? clamp(1 + exploit * (foldRead - 0.5) * 1.8, 0.35, 1.9) : 1;
  // Against a station (low fold-to-bet) we value-bet & call thinner; against a
  // nit (high fold-to-bet) we tighten our own value range a touch.
  const valueShift = foldRead != null ? exploit * (0.5 - foldRead) * 0.14 : 0;
  // Against a maniac (high aggression) we fold less to their pressure.
  const aggroRead = model?.aggression;
  const callBias = aggroRead != null ? exploit * (aggroRead - 0.5) * 0.6 : 0;

  const aggro = clamp01(
    knobs.aggression * (0.65 + 0.7 * state.config.botSkill) * (0.85 + 0.3 * positionFactor),
  );
  const bluff = clamp01(
    knobs.bluffFreq *
      (0.4 + 0.9 * state.config.botSkill) *
      (0.55 + 0.9 * positionFactor) *
      bluffMult,
  );
  // A nit reads tighter (we respect their range); a maniac reads looser.
  const tight = clamp01(knobs.tightness - callBias * 0.5);

  const pot = state.pot;
  const callAmount = la.callAmount;
  const facingBet = !la.canCheck && (la.canCall || callAmount > 0);
  const potOdds = callAmount > 0 ? callAmount / (pot + callAmount) : 0;

  const betTo = (fraction: number): number => {
    const incFromPot = Math.round(pot * fraction);
    let target: number;
    if (state.currentBet > 0) {
      target = state.currentBet + Math.max(state.minRaise, incFromPot);
    } else {
      target = seat.roundBet + Math.max(state.config.bigBlind, incFromPot);
    }
    return Math.round(clamp(target, la.minRaiseTo, la.maxRaiseTo));
  };

  const finalize = (type: Action["type"], amount?: number): BotDecision => {
    let chosen: Action["type"] = type;
    // Map intent onto what is actually legal.
    if (chosen === "raise" && !la.canRaise) chosen = la.canCall ? "call" : "check";
    if (chosen === "bet" && !la.canBet) chosen = la.canCheck ? "check" : "fold";
    if (chosen === "call" && !la.canCall) chosen = la.canCheck ? "check" : "fold";
    if (chosen === "check" && !la.canCheck) chosen = "fold";
    const lineKey: keyof Persona["lines"] =
      chosen === "raise" ? "raise"
      : chosen === "bet" ? "bet"
      : chosen === "call" ? "call"
      : chosen === "check" ? "check"
      : "fold";
    const quip = persona ? pickLine(persona.lines[lineKey]) : undefined;
    const out: BotDecision = { type: chosen, equity: eq, meta: { equity: eq, quip } };
    if (chosen === "bet" || chosen === "raise") out.amount = amount;
    return out;
  };

  // Value thresholds slide down vs. a calling station (valueShift > 0) so the
  // bot bets/raises a wider range for thin value; they slide up vs. a nit.
  const tVeryStrong = 0.8 - valueShift;
  const tStrong = 0.62 - valueShift;
  const tMedium = 0.5 - valueShift;
  const tRaiseBig = 0.82 - valueShift;
  const tRaiseMed = 0.66 - valueShift;

  // --------------------------- no bet to call ---------------------------
  if (!facingBet) {
    if (eq >= tVeryStrong) {
      if (Math.random() < 0.15 * (1 - aggro)) return finalize("check"); // trap
      return finalize("bet", betTo(0.7 + 0.3 * aggro));
    }
    if (eq >= tStrong) {
      if (Math.random() < 0.25 + 0.55 * aggro) return finalize("bet", betTo(0.5 + 0.25 * aggro));
      return finalize("check");
    }
    if (eq >= tMedium) {
      if (Math.random() < 0.4 * aggro) return finalize("bet", betTo(0.45));
      return finalize("check");
    }
    // Weak — bluff occasionally, otherwise take the free card.
    if (la.canBet && Math.random() < bluff) return finalize("bet", betTo(0.45 + 0.2 * aggro));
    return finalize("check");
  }

  // --------------------------- facing a bet ---------------------------
  // Value raise zones.
  if (eq >= tRaiseBig) {
    if (la.canRaise && Math.random() >= 0.18 * (1 - aggro)) {
      return finalize("raise", betTo(0.8 + 0.2 * aggro));
    }
    return finalize("call");
  }
  if (eq >= tRaiseMed) {
    if (la.canRaise && Math.random() < 0.45 + 0.4 * aggro) {
      return finalize("raise", betTo(0.55 + 0.15 * aggro));
    }
    return finalize("call");
  }

  // Clearly profitable call (equity beats the price with room to spare).
  if (eq >= potOdds + 0.05) {
    if (la.canRaise && Math.random() < bluff * 0.6) {
      return finalize("raise", betTo(0.55)); // semi-bluff / thin value
    }
    return finalize("call");
  }

  // Marginally profitable — tighter bots fold more of these, but we call down
  // lighter against an aggressive human (callBias > 0) since their bets bluff
  // more often than their range warrants.
  if (eq >= potOdds - Math.max(0, callBias) * 0.04) {
    if (Math.random() < clamp01((1 - tight) * 0.75 + 0.2 + callBias * 0.5))
      return finalize("call");
    return finalize("fold");
  }

  // Not priced in. Mostly fold; sometimes bluff-raise when cheap and in position.
  const cheap = pot > 0 && callAmount <= pot * 0.5;
  if (la.canRaise && cheap && Math.random() < bluff * 0.5) {
    return finalize("raise", betTo(0.6));
  }
  return finalize("fold");
}
