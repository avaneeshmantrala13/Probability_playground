import type { ProblemInstance } from "./math/problems/types";
import {
  brierScore,
  logLoss,
  winklerScore,
  isCovered,
  clamp,
} from "./math/scoring";

export interface ForecastSubmission {
  // proposition mode
  forecastProb?: number; // P(proposition true), 0..1
  // numeric mode
  intervalLo?: number;
  intervalHi?: number;
  confidence?: number; // 0..1
}

export interface ScoredForecast {
  mode: "proposition" | "numeric";
  brier: number | null;
  logLoss: number | null;
  winkler: number | null;
  covered: boolean | null;
  outcome: 0 | 1 | null;
}

/** Score a submission against a fully-built instance (with ground truth). */
export function scoreInstance(
  inst: ProblemInstance,
  sub: ForecastSubmission,
): ScoredForecast {
  if (inst.mode === "proposition") {
    const outcome: 0 | 1 = inst.resolvesTrue ? 1 : 0;
    const p = clamp(sub.forecastProb ?? 0.5, 0, 1);
    return {
      mode: "proposition",
      brier: brierScore(p, outcome),
      logLoss: logLoss(p, outcome),
      winkler: null,
      covered: null,
      outcome,
    };
  }
  const lo = sub.intervalLo ?? 0;
  const hi = sub.intervalHi ?? 0;
  const conf = clamp(sub.confidence ?? 0.9, 0.01, 0.999);
  const x = inst.truthDecimal;
  return {
    mode: "numeric",
    brier: null,
    logLoss: null,
    winkler: winklerScore(lo, hi, x, conf),
    covered: isCovered(lo, hi, x),
    outcome: null,
  };
}
