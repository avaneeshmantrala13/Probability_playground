// Beta-Binomial posterior over per-topic correctness.
//
// The diagnostic serves only a few items per topic, so a raw accuracy like
// "2/2 correct = 100% mastery" massively over-trusts the estimate. We instead
// model correctness as Binomial with a Beta(alpha0, beta0) prior; the posterior
// is Beta(alpha0 + successes, beta0 + failures). We report the posterior MEAN
// (which shrinks toward the prior mean when data is scarce) and a central
// credible interval so the UI can show how uncertain a few-item estimate is.
//
// All functions are pure and unit-tested against hand-checked values.

export interface BetaPosterior {
  alpha: number; // posterior alpha = prior.alpha + successes
  beta: number; // posterior beta  = prior.beta  + failures
  mean: number; // alpha / (alpha + beta)
  lo: number; // lower endpoint of the central credible interval
  hi: number; // upper endpoint of the central credible interval
  credibleMass: number; // e.g. 0.9 for a 90% central interval
}

// --- Log-gamma (Lanczos approximation) -------------------------------------
const LANCZOS = [
  76.18009172947146, -86.50532032941677, 24.01409824083091,
  -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5,
];

export function gammaln(x: number): number {
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) {
    y += 1;
    ser += LANCZOS[j] / y;
  }
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

// --- Regularized incomplete beta I_x(a,b) ----------------------------------
// Continued-fraction evaluation (Numerical Recipes, betacf/betai).
function betacf(a: number, b: number, x: number): number {
  const FPMIN = 1e-300;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 200; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-14) break;
  }
  return h;
}

/** Regularized incomplete beta function I_x(a,b) = P(X <= x) for X~Beta(a,b). */
export function regularizedIncompleteBeta(
  x: number,
  a: number,
  b: number,
): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const lnBeta =
    gammaln(a + b) - gammaln(a) - gammaln(b) + a * Math.log(x) + b * Math.log(1 - x);
  const front = Math.exp(lnBeta);
  if (x < (a + 1) / (a + b + 2)) {
    return (front * betacf(a, b, x)) / a;
  }
  return 1 - (front * betacf(b, a, 1 - x)) / b;
}

/** Inverse CDF (quantile) for Beta(a,b): smallest x with I_x(a,b) >= p. */
export function betaQuantile(p: number, a: number, b: number): number {
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  let lo = 0;
  let hi = 1;
  // Bisection is robust and plenty precise for our display needs.
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (regularizedIncompleteBeta(mid, a, b) < p) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Beta-Binomial posterior over P(correct) for a topic.
 * @param successes number of correct items
 * @param n         number of items answered
 * @param prior     Beta prior (default uniform Beta(1,1))
 * @param credibleMass central credible interval mass (default 0.9)
 */
export function betaBinomialPosterior(
  successes: number,
  n: number,
  prior: { alpha: number; beta: number } = { alpha: 1, beta: 1 },
  credibleMass = 0.9,
): BetaPosterior {
  const failures = n - successes;
  const alpha = prior.alpha + successes;
  const beta = prior.beta + failures;
  const mean = alpha / (alpha + beta);
  const tail = (1 - credibleMass) / 2;
  const lo = betaQuantile(tail, alpha, beta);
  const hi = betaQuantile(1 - tail, alpha, beta);
  return { alpha, beta, mean, lo, hi, credibleMass };
}
