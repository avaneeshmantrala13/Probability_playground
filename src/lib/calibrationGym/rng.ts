// Small, dependency-free deterministic RNG so problem generation is fully
// reproducible from a numeric seed (used by the generator, the "simulate"
// dev helper, and the LLM leaderboard batch).

export type RNG = () => number;

/** mulberry32 - fast, decent-quality 32-bit seeded PRNG returning [0, 1). */
export function mulberry32(seed: number): RNG {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Inclusive integer in [lo, hi]. */
export function randInt(rng: RNG, lo: number, hi: number): number {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

export function choice<T>(rng: RNG, arr: readonly T[]): T {
  return arr[randInt(rng, 0, arr.length - 1)];
}

/** Deterministic 32-bit hash of a string (FNV-1a style), used to seed the mock LLM. */
export function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
