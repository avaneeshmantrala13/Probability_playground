/** Expected-value helpers for classic interview scenarios. */

const CARD_VALUES: Record<string, number> = {
  A: 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  J: 11,
  Q: 12,
  K: 13,
};

export function singleDieFairValue(): number {
  return 3.5;
}

export function twoDiceFairValue(): number {
  return 7;
}

export function diePlusFixed(fixed: number): number {
  return fixed + 3.5;
}

export function coinFlipsFairValue(count: number): number {
  return count * 0.5;
}

export function cardValue(label: string): number {
  return CARD_VALUES[label] ?? 0;
}

/** Expected sum of n draws without replacement from a standard deck. */
export function cardsDrawFairValue(drawCount: number, revealed: string[] = []): number {
  const deck = buildDeck();
  const remaining = deck.filter((c) => !revealed.includes(c));
  if (remaining.length === 0 || drawCount <= 0) return 0;

  const take = Math.min(drawCount, remaining.length);
  const sum = remaining.reduce((s, c) => s + cardValue(c), 0);
  return sum / remaining.length * take;
}

/** One card drawn; some cards removed from deck (revealed not in draw). */
export function singleCardFairValue(revealed: string[] = []): number {
  return cardsDrawFairValue(1, revealed);
}

function buildDeck(): string[] {
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const deck: string[] = [];
  for (const r of ranks) {
    for (let i = 0; i < 4; i++) deck.push(r);
  }
  return deck;
}

export function formatFair(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
