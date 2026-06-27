import {
  cardValue,
  coinFlipsFairValue,
  diePlusFixed,
  singleCardFairValue,
  singleDieFairValue,
  twoDiceFairValue,
} from "./fairValue";
import type { Scenario, ScenarioKind } from "./types";

let counter = 0;
function uid(prefix: string): string {
  counter += 1;
  return `${prefix}_${counter}`;
}

export function buildScenario(kind: ScenarioKind): Scenario {
  switch (kind) {
    case "single_die":
      return {
        id: uid("die1"),
        kind,
        title: "Single fair die",
        description: "A standard six-sided die is rolled once. Quote a market on the face value.",
        clues: ["One fair six-sided die will be rolled.", "Each face 1–6 is equally likely."],
        params: {},
        fairValue: singleDieFairValue(),
      };

    case "two_dice":
      return {
        id: uid("die2"),
        kind,
        title: "Sum of two dice",
        description: "Two fair dice are rolled. Quote on the sum of the two faces.",
        clues: [
          "Two independent fair six-sided dice are rolled.",
          "Sum ranges from 2 to 12; 7 is the most likely total.",
        ],
        params: {},
        fairValue: twoDiceFairValue(),
      };

    case "die_plus_fixed": {
      const fixed = 1 + Math.floor(Math.random() * 6);
      return {
        id: uid("die_fix"),
        kind,
        title: "Die plus known value",
        description: "One die is rolled and added to a known constant.",
        clues: [
          `A fair die is rolled and added to ${fixed}.`,
          "The constant is known; the die is random.",
        ],
        params: { fixed },
        fairValue: diePlusFixed(fixed),
      };
    }

    case "coin_flips": {
      const n = 2 + Math.floor(Math.random() * 5);
      return {
        id: uid("coins"),
        kind,
        title: "Heads count",
        description: "Fair coins are flipped; quote on the number of heads.",
        clues: [
          `${n} fair coins will be flipped.`,
          "Each coin has a 50% chance of heads.",
        ],
        params: { count: n },
        fairValue: coinFlipsFairValue(n),
      };
    }

    case "card_draw": {
      const revealed = pickRevealedCards(Math.floor(Math.random() * 3));
      const fv = singleCardFairValue(revealed);
      return {
        id: uid("card"),
        kind,
        title: "Single card draw",
        description: "One card is drawn from a standard 52-card deck.",
        clues: buildCardClues(revealed),
        params: { revealed },
        fairValue: fv,
      };
    }

    case "cards_with_reveal": {
      const drawCount = 2 + Math.floor(Math.random() * 2);
      const revealed = pickRevealedCards(1 + Math.floor(Math.random() * 2));
      const fv = cardsSumFair(drawCount, revealed);
      return {
        id: uid("cards"),
        kind,
        title: "Multi-card sum",
        description: "Several cards are drawn without replacement; some may be revealed.",
        clues: [
          `${drawCount} cards drawn without replacement from a standard deck.`,
          ...buildCardClues(revealed),
        ],
        params: { drawCount, revealed },
        fairValue: fv,
      };
    }
  }
}

function cardsSumFair(drawCount: number, revealed: string[]): number {
  const deck = buildDeck();
  const removed = new Set(revealed);
  const remaining = deck.filter((c) => !removed.has(c));
  const take = Math.min(drawCount, remaining.length);
  const avg = remaining.reduce((s, c) => s + cardValue(c), 0) / remaining.length;
  return avg * take;
}

function buildDeck(): string[] {
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const deck: string[] = [];
  for (const r of ranks) {
    for (let i = 0; i < 4; i++) deck.push(r);
  }
  return deck;
}

function pickRevealedCards(n: number): string[] {
  const deck = buildDeck();
  const out: string[] = [];
  for (let i = 0; i < n && deck.length > 0; i++) {
    const idx = Math.floor(Math.random() * deck.length);
    out.push(deck.splice(idx, 1)[0]);
  }
  return out;
}

function buildCardClues(revealed: string[]): string[] {
  if (revealed.length === 0) {
    return ["No cards have been revealed yet.", "Ace = 1, Jack = 11, Queen = 12, King = 13."];
  }
  const list = revealed.map((c) => `${c} (${cardValue(c)})`).join(", ");
  return [
    `These cards are removed from the deck: ${list}.`,
    "Ace = 1, Jack = 11, Queen = 12, King = 13.",
  ];
}

export function pickScenarioForPool(pool: ScenarioKind[]): Scenario {
  const kind = pool[Math.floor(Math.random() * pool.length)];
  return buildScenario(kind);
}
