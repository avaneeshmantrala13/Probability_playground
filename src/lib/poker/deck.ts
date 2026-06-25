import type { Card, Rank, Suit } from "./types";

export const RANKS: Rank[] = [
  "A",
  "K",
  "Q",
  "J",
  "T",
  "9",
  "8",
  "7",
  "6",
  "5",
  "4",
  "3",
  "2",
];

export const SUITS: Suit[] = ["s", "h", "d", "c"];

/** Build a fresh, ordered 52-card deck of `RANK+SUIT` strings. */
export function makeDeck(): Card[] {
  const deck: Card[] = [];
  for (const r of RANKS) {
    for (const s of SUITS) {
      deck.push(`${r}${s}`);
    }
  }
  return deck;
}

/** All 52 cards (handy for computing the "remaining" deck in equity sims). */
export const FULL_DECK: Card[] = makeDeck();

const SUIT_SYMBOL: Record<Suit, string> = { s: "♠", h: "♥", d: "♦", c: "♣" };

/** Pretty rank for display ("T" → "10"). */
export function displayRank(card: Card): string {
  const r = card[0];
  return r === "T" ? "10" : r;
}

export function cardSuit(card: Card): Suit {
  return card[1] as Suit;
}

export function suitSymbol(card: Card): string {
  return SUIT_SYMBOL[cardSuit(card)];
}

export function isRedCard(card: Card): boolean {
  const s = cardSuit(card);
  return s === "h" || s === "d";
}
