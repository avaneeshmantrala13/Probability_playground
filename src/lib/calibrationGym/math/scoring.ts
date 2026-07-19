// Proper scoring rules + calibration aggregation. Pure functions, unit-tested.

export function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

/**
 * Brier score for a binary outcome. forecast p in [0,1] is P(outcome=1);
 * outcome is 0 or 1. Returns (p - outcome)^2 in [0,1]; lower is better.
 */
export function brierScore(forecast: number, outcome: 0 | 1): number {
  const p = clamp(forecast, 0, 1);
  return (p - outcome) ** 2;
}

/**
 * Logarithmic loss (negative log score) for a binary outcome. Clamped away
 * from 0/1 to keep it finite. Lower is better.
 */
export function logLoss(forecast: number, outcome: 0 | 1, eps = 1e-9): number {
  const p = clamp(forecast, eps, 1 - eps);
  return outcome === 1 ? -Math.log(p) : -Math.log(1 - p);
}

/**
 * Winkler / interval score for a central (1 - alpha) prediction interval
 * [lo, hi] against observed value x, where confidence = 1 - alpha.
 * score = width + (2/alpha) * (shortfall outside the interval). Lower is better.
 */
export function winklerScore(
  lo: number,
  hi: number,
  x: number,
  confidence: number,
): number {
  const alpha = clamp(1 - confidence, 1e-6, 1 - 1e-6);
  const width = hi - lo;
  let penalty = 0;
  if (x < lo) penalty = (2 / alpha) * (lo - x);
  else if (x > hi) penalty = (2 / alpha) * (x - hi);
  return width + penalty;
}

export function isCovered(lo: number, hi: number, x: number): boolean {
  return x >= lo && x <= hi;
}

// ---------------------------------------------------------------------------
// Aggregation for the calibration dashboard.
// ---------------------------------------------------------------------------

export interface PropObs {
  forecast: number; // P(true) in [0,1]
  outcome: 0 | 1;
}

export interface ReliabilityBin {
  bin: number; // 0..nbins-1
  label: string; // e.g. "50-60%"
  meanForecast: number | null; // avg forecast in bin (null if empty)
  observedFreq: number | null; // fraction of outcomes = 1
  count: number;
}

/** Bin forecasts into equal-width probability bins for a reliability diagram. */
export function reliabilityBins(obs: PropObs[], nbins = 10): ReliabilityBin[] {
  const bins: { sumF: number; sumO: number; count: number }[] = Array.from(
    { length: nbins },
    () => ({ sumF: 0, sumO: 0, count: 0 }),
  );
  for (const o of obs) {
    const p = clamp(o.forecast, 0, 1);
    let idx = Math.floor(p * nbins);
    if (idx >= nbins) idx = nbins - 1;
    bins[idx].sumF += p;
    bins[idx].sumO += o.outcome;
    bins[idx].count += 1;
  }
  return bins.map((b, i) => ({
    bin: i,
    label: `${Math.round((i / nbins) * 100)}-${Math.round(((i + 1) / nbins) * 100)}%`,
    meanForecast: b.count ? b.sumF / b.count : null,
    observedFreq: b.count ? b.sumO / b.count : null,
    count: b.count,
  }));
}

export function meanBrier(obs: PropObs[]): number | null {
  if (!obs.length) return null;
  return obs.reduce((s, o) => s + brierScore(o.forecast, o.outcome), 0) / obs.length;
}

export function meanLogLoss(obs: PropObs[]): number | null {
  if (!obs.length) return null;
  return obs.reduce((s, o) => s + logLoss(o.forecast, o.outcome), 0) / obs.length;
}

/**
 * Expected Calibration Error: weighted average gap between mean forecast and
 * observed frequency across non-empty bins. Lower is better.
 */
export function expectedCalibrationError(obs: PropObs[], nbins = 10): number | null {
  if (!obs.length) return null;
  const bins = reliabilityBins(obs, nbins);
  let total = 0;
  for (const b of bins) {
    if (b.count && b.meanForecast !== null && b.observedFreq !== null) {
      total += (b.count / obs.length) * Math.abs(b.meanForecast - b.observedFreq);
    }
  }
  return total;
}
