import Fraction from "fraction.js";

// Re-export the Fraction class so the rest of the codebase has a single source.
export { Fraction };

/** Convenience constructor. */
export function F(n: number | string, d?: number): Fraction {
  return d === undefined ? new Fraction(n) : new Fraction(n, d);
}

/** Exact "a/b" (or "a" for integers) string representation. */
export function fracStr(f: Fraction): string {
  return f.toFraction();
}

/** Percentage string with fixed precision for display, e.g. 0.6667 -> "66.67%". */
export function pct(x: number, digits = 2): string {
  return `${(x * 100).toFixed(digits)}%`;
}

// ---------------------------------------------------------------------------
// Exact BigInt combinatorics -> Fraction, so intermediate products never lose
// precision even when binomials get moderately large.
// ---------------------------------------------------------------------------

function absBig(a: bigint): bigint {
  return a < 0n ? -a : a;
}

export function bigGcd(a: bigint, b: bigint): bigint {
  a = absBig(a);
  b = absBig(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

const MAX_SAFE = 9007199254740991n; // Number.MAX_SAFE_INTEGER

/**
 * Build an exact Fraction from BigInt numerator/denominator. Reduces first;
 * throws if the reduced terms exceed IEEE-754 safe integers (guarding against
 * silent precision loss — generators keep parameters small enough to avoid it).
 */
export function fracFromBig(num: bigint, den: bigint): Fraction {
  if (den === 0n) throw new Error("fracFromBig: zero denominator");
  if (den < 0n) {
    den = -den;
    num = -num;
  }
  const g = bigGcd(num, den) || 1n;
  num /= g;
  den /= g;
  if (absBig(num) > MAX_SAFE || den > MAX_SAFE) {
    throw new Error("fracFromBig: value exceeds safe-integer range");
  }
  return new Fraction(Number(num), Number(den));
}

/** Exact binomial coefficient C(n, k) as a BigInt. */
export function binomBig(n: number, k: number): bigint {
  if (k < 0 || k > n || n < 0) return 0n;
  k = Math.min(k, n - k);
  let result = 1n;
  for (let i = 0; i < k; i++) {
    result = (result * BigInt(n - i)) / BigInt(i + 1);
  }
  return result;
}

/** Exact integer power base^exp (exp >= 0) as a BigInt. */
export function powBig(base: bigint, exp: number): bigint {
  let result = 1n;
  for (let i = 0; i < exp; i++) result *= base;
  return result;
}
