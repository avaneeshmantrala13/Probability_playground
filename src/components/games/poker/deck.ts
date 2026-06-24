import { randomInt } from "../../simulations/random";

export type Suit = "H" | "D" | "C" | "S";

/** A single playing card. Rank is numeric: 2-10, J=11, Q=12, K=13, A=14. */
export interface Card {
  rank: number;
  suit: Suit;
}

/**
 * A target event defined as a deterministic predicate over a single drawn card
 * (with access to the already-visible cards). The SAME predicate is used for
 * both the exact combinatorial probability and the Monte-Carlo simulation.
 */
export type CardPredicate = (drawn: Card, known: Card[]) => boolean;

export const SUITS: Suit[] = ["S", "H", "D", "C"];
export const RANKS: number[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

/** Convenience rank constants for authoring scenarios. */
export const T = 10;
export const J = 11;
export const Q = 12;
export const K = 13;
export const A = 14;

/** Compact card constructor used by the scenario bank. */
export function c(rank: number, suit: Suit): Card {
  return { rank, suit };
}

/** A fresh, ordered 52-card deck. */
export function fullDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

/** Stable id like "A-H" so cards can be compared / used as keys. */
export function cardId(card: Card): string {
  return `${rankLabel(card.rank)}-${card.suit}`;
}

export function sameCard(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit;
}

export function isRed(card: Card): boolean {
  return card.suit === "H" || card.suit === "D";
}

/** Short rank label: "2".."10","J","Q","K","A". */
export function rankLabel(rank: number): string {
  switch (rank) {
    case 11:
      return "J";
    case 12:
      return "Q";
    case 13:
      return "K";
    case 14:
      return "A";
    default:
      return String(rank);
  }
}

const SUIT_SYMBOL: Record<Suit, string> = {
  H: "\u2665",
  D: "\u2666",
  C: "\u2663",
  S: "\u2660",
};

export function suitSymbol(suit: Suit): string {
  return SUIT_SYMBOL[suit];
}

const SUIT_NAME: Record<Suit, string> = {
  H: "hearts",
  D: "diamonds",
  C: "clubs",
  S: "spades",
};

/** Accessible card name, e.g. "Ace of hearts". */
export function cardName(card: Card): string {
  const r = card.rank;
  const word =
    r === 11
      ? "Jack"
      : r === 12
        ? "Queen"
        : r === 13
          ? "King"
          : r === 14
            ? "Ace"
            : String(r);
  return `${word} of ${SUIT_NAME[card.suit]}`;
}

/** The cards left in the deck once the visible cards are removed. */
export function remainingDeck(known: Card[]): Card[] {
  return fullDeck().filter((d) => !known.some((k) => sameCard(k, d)));
}

/**
 * Exact probability that the next single card drawn from the remaining deck
 * satisfies the predicate. Computed by direct enumeration of the remaining
 * cards (combinatorics over a single draw).
 */
export function exactProbability(
  known: Card[],
  predicate: CardPredicate,
): { probability: number; favorable: number; total: number } {
  const remaining = remainingDeck(known);
  const favorable = remaining.filter((d) => predicate(d, known)).length;
  const total = remaining.length;
  return { probability: total === 0 ? 0 : favorable / total, total, favorable };
}

export interface MonteCarloResult {
  /** Final empirical proportion over all draws. */
  empirical: number;
  draws: number;
  hits: number;
  /** Sampled running proportion for plotting convergence. */
  running: { trial: number; value: number }[];
}

/**
 * Monte-Carlo estimate: repeatedly draw one random card from the remaining
 * deck and test the SAME predicate, tracking the running proportion so the
 * caller can show experimental probability converging to the exact value.
 */
export function monteCarlo(
  known: Card[],
  predicate: CardPredicate,
  draws: number,
): MonteCarloResult {
  const remaining = remainingDeck(known);
  const n = remaining.length;
  const running: { trial: number; value: number }[] = [];
  const sampleStep = Math.max(1, Math.floor(draws / 120));
  let hits = 0;

  for (let i = 1; i <= draws; i++) {
    const card = remaining[randomInt(0, n - 1)];
    if (predicate(card, known)) hits++;
    if (i % sampleStep === 0 || i === draws) {
      running.push({ trial: i, value: hits / i });
    }
  }

  return { empirical: draws === 0 ? 0 : hits / draws, draws, hits, running };
}

/** Format a probability in [0,1] as a percentage string with one decimal. */
export function formatPct(p: number, decimals = 1): string {
  return `${(p * 100).toFixed(decimals)}%`;
}
