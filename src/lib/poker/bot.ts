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
 *
 * Personality quips are attached purely for flavor (`action.meta.quip`) and can
 * never change which action the math selects. Everything is client-side.
 */

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

export function decideBotAction(state: GameState, seatIndex: number): BotDecision {
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

  const aggro = clamp01(
    knobs.aggression * (0.65 + 0.7 * state.config.botSkill) * (0.85 + 0.3 * positionFactor),
  );
  const bluff = clamp01(
    knobs.bluffFreq * (0.4 + 0.9 * state.config.botSkill) * (0.55 + 0.9 * positionFactor),
  );
  const tight = knobs.tightness;

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

  // --------------------------- no bet to call ---------------------------
  if (!facingBet) {
    if (eq >= 0.8) {
      if (Math.random() < 0.15 * (1 - aggro)) return finalize("check"); // trap
      return finalize("bet", betTo(0.7 + 0.3 * aggro));
    }
    if (eq >= 0.62) {
      if (Math.random() < 0.25 + 0.55 * aggro) return finalize("bet", betTo(0.5 + 0.25 * aggro));
      return finalize("check");
    }
    if (eq >= 0.5) {
      if (Math.random() < 0.4 * aggro) return finalize("bet", betTo(0.45));
      return finalize("check");
    }
    // Weak — bluff occasionally, otherwise take the free card.
    if (la.canBet && Math.random() < bluff) return finalize("bet", betTo(0.45 + 0.2 * aggro));
    return finalize("check");
  }

  // --------------------------- facing a bet ---------------------------
  // Value raise zones.
  if (eq >= 0.82) {
    if (la.canRaise && Math.random() >= 0.18 * (1 - aggro)) {
      return finalize("raise", betTo(0.8 + 0.2 * aggro));
    }
    return finalize("call");
  }
  if (eq >= 0.66) {
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

  // Marginally profitable — tighter bots fold more of these.
  if (eq >= potOdds) {
    if (Math.random() < (1 - tight) * 0.75 + 0.2) return finalize("call");
    return finalize("fold");
  }

  // Not priced in. Mostly fold; sometimes bluff-raise when cheap and in position.
  const cheap = pot > 0 && callAmount <= pot * 0.5;
  if (la.canRaise && cheap && Math.random() < bluff * 0.5) {
    return finalize("raise", betTo(0.6));
  }
  return finalize("fold");
}
