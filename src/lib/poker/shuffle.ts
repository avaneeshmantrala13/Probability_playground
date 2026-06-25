import type { Card } from "./types";
import { makeDeck } from "./deck";

/**
 * UNBIASED randomness for shuffling.
 *
 * Why this approach:
 *  - We pull entropy from `crypto.getRandomValues` (a CSPRNG) instead of
 *    `Math.random`, which is not guaranteed to be high quality.
 *  - We use REJECTION SAMPLING to map raw 32-bit values into `[0, n)` so there
 *    is NO modulo bias (the common `value % n` trick skews toward small indices
 *    whenever 2^32 is not a multiple of n).
 *  - We NEVER use `array.sort(() => Math.random() - 0.5)`, which produces a
 *    provably non-uniform distribution.
 */

/** Uniform integer in [0, n) with no modulo bias (rejection sampling). */
export function randomInt(n: number): number {
  if (n <= 0) throw new Error("randomInt requires n > 0");
  if (n === 1) return 0;
  // Largest multiple of n that fits in 32 bits; reject anything above it.
  const limit = Math.floor(0x1_0000_0000 / n) * n;
  const buf = new Uint32Array(1);
  let x = 0;
  do {
    crypto.getRandomValues(buf);
    x = buf[0];
  } while (x >= limit);
  return x % n;
}

/**
 * In-place, unbiased Fisher–Yates shuffle. Iterating from the end and swapping
 * each element with a uniformly chosen earlier (or equal) index yields a
 * perfectly uniform permutation when `randomInt` is unbiased.
 */
export function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

/** Return a freshly shuffled 52-card deck. */
export function shuffledDeck(): Card[] {
  const deck = makeDeck();
  shuffleInPlace(deck);
  // DEV SELF-CHECK: a shuffled deck must still be exactly the 52 unique cards.
  if (import.meta.env?.DEV) {
    assertFullDeck(deck);
  }
  return deck;
}

/**
 * Self-check used in dev builds (and unit sanity scripts): verifies the deck is
 * a permutation of all 52 cards with no missing cards and no duplicates.
 */
export function assertFullDeck(deck: Card[]): void {
  const unique = new Set(deck);
  if (deck.length !== 52 || unique.size !== 52) {
    throw new Error(
      `Shuffle integrity check failed: length=${deck.length}, unique=${unique.size} (expected 52/52)`,
    );
  }
  for (const card of makeDeck()) {
    if (!unique.has(card)) {
      throw new Error(`Shuffle integrity check failed: missing ${card}`);
    }
  }
}
