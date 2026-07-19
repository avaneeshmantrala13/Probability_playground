import {
  Fraction,
  F,
  fracStr,
  pct,
  binomBig,
  powBig,
  fracFromBig,
} from "../frac";
import { type RNG, randInt, choice } from "../../rng";
import type { ProblemTemplate } from "./types";
import { makeProposition } from "./proposition";

// A biased coin's heads-probability, sampled as a small reduced fraction.
function sampleCoin(rng: RNG): { a: number; b: number } {
  const b = choice(rng, [2, 3, 4, 5, 6]);
  const a = randInt(rng, 1, b - 1);
  const f = F(a, b); // reduce
  return { a: f.n, b: f.d };
}

function coinLabel(a: number, b: number): string {
  return `${a}/${b} (\u2248${pct(a / b, 1)})`;
}

// Grammar helper: "1 head" vs "2 heads" (and any other count).
function headsPhrase(k: number): string {
  return `${k} ${k === 1 ? "head" : "heads"}`;
}

// P(exactly k heads in n flips) = C(n,k) a^k (b-a)^(n-k) / b^n, computed exactly.
function exactlyK(a: number, b: number, n: number, k: number): Fraction {
  const num =
    binomBig(n, k) *
    powBig(BigInt(a), k) *
    powBig(BigInt(b - a), n - k);
  const den = powBig(BigInt(b), n);
  return fracFromBig(num, den);
}

function atLeastK(a: number, b: number, n: number, k: number): Fraction {
  let num = 0n;
  for (let j = k; j <= n; j++) {
    num += binomBig(n, j) * powBig(BigInt(a), j) * powBig(BigInt(b - a), n - j);
  }
  const den = powBig(BigInt(b), n);
  return fracFromBig(num, den);
}

// ---------------------------------------------------------------------------
// Template: exactly k heads (proposition)
// ---------------------------------------------------------------------------
interface ExactlyKParams {
  a: number;
  b: number;
  n: number;
  k: number;
}

export const coinExactlyK: ProblemTemplate<ExactlyKParams> = {
  type: "coin-exactly-k",
  family: "coin-flip",
  mode: "proposition",
  label: "Exactly k heads in n flips",
  sample(rng) {
    const { a, b } = sampleCoin(rng);
    const n = randInt(rng, 4, 9);
    const k = randInt(rng, 1, n - 1);
    return { a, b, n, k };
  },
  build(params) {
    const { a, b, n, k } = params;
    const value = exactlyK(a, b, n, k);
    const rng = seedRngFor("coin-exactly-k", params);
    const prop = makeProposition(value, rng);
    const quantity = `the probability of getting exactly ${headsPhrase(k)}`;
    return {
      family: "coin-flip",
      problemType: "coin-exactly-k",
      mode: "proposition",
      title: "Exactly k heads",
      prompt: `A biased coin lands heads with probability ${coinLabel(
        a,
        b,
      )}. It is flipped ${n} times independently. Consider the probability of getting exactly ${headsPhrase(
        k,
      )}.`,
      proposition: prop.text(`The probability of getting exactly ${headsPhrase(k)}`),
      threshold: fracStr(prop.threshold),
      resolvesTrue: prop.resolvesTrue,
      truthValue: fracStr(value),
      truthDecimal: value.valueOf(),
      explanation: `P(exactly ${k} of ${n}) = C(${n},${k})\u00b7(${a}/${b})^${k}\u00b7(${
        b - a
      }/${b})^${n - k} = ${fracStr(value)} \u2248 ${pct(
        value.valueOf(),
        2,
      )}. The claim about ${quantity} therefore resolves ${
        prop.resolvesTrue ? "TRUE" : "FALSE"
      }.`,
      seed: JSON.stringify({ type: "coin-exactly-k", params }),
    };
  },
};

// ---------------------------------------------------------------------------
// Template: at least k heads (proposition)
// ---------------------------------------------------------------------------
interface AtLeastKParams {
  a: number;
  b: number;
  n: number;
  k: number;
}

export const coinAtLeastK: ProblemTemplate<AtLeastKParams> = {
  type: "coin-at-least-k",
  family: "coin-flip",
  mode: "proposition",
  label: "At least k heads in n flips",
  sample(rng) {
    const { a, b } = sampleCoin(rng);
    const n = randInt(rng, 4, 9);
    const k = randInt(rng, 1, n);
    return { a, b, n, k };
  },
  build(params) {
    const { a, b, n, k } = params;
    const value = atLeastK(a, b, n, k);
    const rng = seedRngFor("coin-at-least-k", params);
    const prop = makeProposition(value, rng);
    return {
      family: "coin-flip",
      problemType: "coin-at-least-k",
      mode: "proposition",
      title: "At least k heads",
      prompt: `A biased coin lands heads with probability ${coinLabel(
        a,
        b,
      )}. It is flipped ${n} times independently. Consider the probability of getting at least ${headsPhrase(
        k,
      )}.`,
      proposition: prop.text(`The probability of getting at least ${headsPhrase(k)}`),
      threshold: fracStr(prop.threshold),
      resolvesTrue: prop.resolvesTrue,
      truthValue: fracStr(value),
      truthDecimal: value.valueOf(),
      explanation: `P(\u2265 ${k} of ${n}) = \u03a3_{j=${k}}^{${n}} C(${n},j)\u00b7(${a}/${b})^j\u00b7(${
        b - a
      }/${b})^(${n}\u2212j) = ${fracStr(value)} \u2248 ${pct(
        value.valueOf(),
        2,
      )}. The claim resolves ${prop.resolvesTrue ? "TRUE" : "FALSE"}.`,
      seed: JSON.stringify({ type: "coin-at-least-k", params }),
    };
  },
};

// ---------------------------------------------------------------------------
// Template: expected flips to first head (numeric)
// ---------------------------------------------------------------------------
interface FirstSuccessParams {
  a: number;
  b: number;
}

export const coinFirstSuccess: ProblemTemplate<FirstSuccessParams> = {
  type: "coin-first-success",
  family: "coin-flip",
  mode: "numeric",
  label: "Expected flips to first head",
  sample(rng) {
    return sampleCoin(rng);
  },
  build(params) {
    const { a, b } = params;
    const value = F(b, a); // E = 1/p = b/a
    return {
      family: "coin-flip",
      problemType: "coin-first-success",
      mode: "numeric",
      title: "Expected flips to first head",
      prompt: `A biased coin lands heads with probability ${coinLabel(
        a,
        b,
      )}. You flip it repeatedly until the first head appears. How many flips do you expect to make (counting the flip that shows the first head)?`,
      unit: "flips",
      suggestedMax: Math.ceil(value.valueOf() * 3) + 2,
      truthValue: fracStr(value),
      truthDecimal: value.valueOf(),
      explanation: `The number of flips until the first head is Geometric(p) with p = ${a}/${b}, so E = 1/p = ${b}/${a} = ${fracStr(
        value,
      )} \u2248 ${value.valueOf().toFixed(3)} flips.`,
      seed: JSON.stringify({ type: "coin-first-success", params }),
    };
  },
};

// ---------------------------------------------------------------------------
// Template: expected flips to first run of r heads (numeric)
// E = sum_{i=1}^{r} (b/a)^i   (validated against the state recursion)
// ---------------------------------------------------------------------------
interface RunParams {
  a: number;
  b: number;
  r: number;
}

export const coinRun: ProblemTemplate<RunParams> = {
  type: "coin-run",
  family: "coin-flip",
  mode: "numeric",
  label: "Expected flips to a run of r heads",
  sample(rng) {
    const { a, b } = sampleCoin(rng);
    const r = randInt(rng, 2, 4);
    return { a, b, r };
  },
  build(params) {
    const { a, b, r } = params;
    let value = F(0);
    for (let i = 1; i <= r; i++) {
      value = value.add(F(b, a).pow(i));
    }
    return {
      family: "coin-flip",
      problemType: "coin-run",
      mode: "numeric",
      title: "Expected flips to a run of heads",
      prompt: `A biased coin lands heads with probability ${coinLabel(
        a,
        b,
      )}. You flip it repeatedly until you first see ${r} heads in a row. How many flips do you expect to make?`,
      unit: "flips",
      suggestedMax: Math.ceil(value.valueOf() * 2.5) + 3,
      truthValue: fracStr(value),
      truthDecimal: value.valueOf(),
      explanation: `Expected waiting time for a run of ${r} heads with p = ${a}/${b} is E = \u03a3_{i=1}^{${r}} (1/p)^i = \u03a3_{i=1}^{${r}} (${b}/${a})^i = ${fracStr(
        value,
      )} \u2248 ${value.valueOf().toFixed(3)} flips.`,
      seed: JSON.stringify({ type: "coin-run", params }),
    };
  },
};

// A deterministic RNG derived from the problem params so proposition thresholds
// are stable for a given instance (same seed -> same proposition).
import { mulberry32, hashString } from "../../rng";
function seedRngFor(type: string, params: unknown): RNG {
  return mulberry32(hashString(type + JSON.stringify(params)));
}

export const coinTemplates = [
  coinExactlyK,
  coinAtLeastK,
  coinFirstSuccess,
  coinRun,
];
