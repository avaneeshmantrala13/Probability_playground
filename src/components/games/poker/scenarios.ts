import { A, c, J, K, Q, T, type Card, type CardPredicate } from "./deck";

export interface Scenario {
  id: string;
  /** Short label shown above the question. */
  title: string;
  /** The probability question about the NEXT card. */
  question: string;
  /** The player's two hole cards (visible). */
  hole: [Card, Card];
  /** Optional community cards on the felt (visible). */
  community: Card[];
  /** Deterministic target event over the next drawn card. */
  predicate: CardPredicate;
  /** Exactly four multiple-choice options (whole-percent strings). */
  options: [string, string, string, string];
  /** Zero-based index of the correct option. */
  correct: number;
}

/**
 * Authored scenario bank. Every "correct" index has been hand-verified against
 * the exact single-draw probability (favorable remaining cards / remaining deck)
 * and is the option closest to that exact value:
 *
 *   1. heart, no hearts known -> 13/50 = 26.0%
 *   2. flush draw, 4 hearts known -> 9/48 = 18.75% (~19%)
 *   3. trip kings, 2 kings known -> 2/50 = 4.0%
 *   4. pair a hole card (Q or 7) -> 6/50 = 12.0%
 *   5. an Ace, no aces known -> 4/50 = 8.0%
 *   6. open-ended straight (7 or Q) -> 8/48 = 16.67% (~17%)
 *   7. a red card, 2 blacks known -> 26/50 = 52.0%
 *   8. a face card (J/Q/K) -> 12/50 = 24.0%
 *   9. a club, 2 clubs known -> 11/48 = 22.92% (~23%)
 *  10. ten-or-higher (broadway) -> 20/50 = 40.0%
 */
export const SCENARIOS: Scenario[] = [
  {
    id: "next-heart",
    title: "Reading the board",
    question:
      "You hold A\u2660 and K\u2666. What's the probability the next community card is a heart?",
    hole: [c(A, "S"), c(K, "D")],
    community: [],
    predicate: (d) => d.suit === "H",
    options: ["20%", "25%", "26%", "33%"],
    correct: 2,
  },
  {
    id: "flush-draw",
    title: "Flush draw",
    question:
      "You hold A\u2665 K\u2665 and the board shows 7\u2665 2\u2665. What's the probability the next card completes your flush (another heart)?",
    hole: [c(A, "H"), c(K, "H")],
    community: [c(7, "H"), c(2, "H")],
    predicate: (d) => d.suit === "H",
    options: ["15%", "19%", "25%", "33%"],
    correct: 1,
  },
  {
    id: "trip-kings",
    title: "Pocket kings",
    question:
      "You hold K\u2665 K\u2660 (pocket kings). What's the probability the next card is a King, giving you trips?",
    hole: [c(K, "H"), c(K, "S")],
    community: [],
    predicate: (d) => d.rank === K,
    options: ["2%", "4%", "6%", "8%"],
    correct: 1,
  },
  {
    id: "pair-hole",
    title: "Hitting a pair",
    question:
      "You hold Q\u2663 7\u2666. What's the probability the next card pairs one of your hole cards (a Queen or a Seven)?",
    hole: [c(Q, "C"), c(7, "D")],
    community: [],
    predicate: (d) => d.rank === Q || d.rank === 7,
    options: ["8%", "12%", "15%", "24%"],
    correct: 1,
  },
  {
    id: "next-ace",
    title: "Chasing an Ace",
    question:
      "You hold J\u2665 J\u2663 and no Aces are showing. What's the probability the next card is an Ace?",
    hole: [c(J, "H"), c(J, "C")],
    community: [],
    predicate: (d) => d.rank === A,
    options: ["4%", "6%", "8%", "10%"],
    correct: 2,
  },
  {
    id: "straight-draw",
    title: "Open-ended straight",
    question:
      "You hold 8\u2665 9\u2660 and the board shows 10\u2666 J\u2663. A 7 or a Queen makes your straight. What's the probability the next card completes it?",
    hole: [c(8, "H"), c(9, "S")],
    community: [c(T, "D"), c(J, "C")],
    predicate: (d) => d.rank === 7 || d.rank === Q,
    options: ["13%", "17%", "25%", "33%"],
    correct: 1,
  },
  {
    id: "next-red",
    title: "Red or black",
    question:
      "You hold 2\u2663 5\u2663 (both black). What's the probability the next card is red (a heart or diamond)?",
    hole: [c(2, "C"), c(5, "C")],
    community: [],
    predicate: (d) => d.suit === "H" || d.suit === "D",
    options: ["48%", "50%", "52%", "54%"],
    correct: 2,
  },
  {
    id: "face-card",
    title: "Face card",
    question:
      "You hold 4\u2666 9\u2660. What's the probability the next card is a face card (Jack, Queen, or King)?",
    hole: [c(4, "D"), c(9, "S")],
    community: [],
    predicate: (d) => d.rank >= J && d.rank <= K,
    options: ["18%", "24%", "30%", "36%"],
    correct: 1,
  },
  {
    id: "next-club",
    title: "Counting clubs",
    question:
      "You hold 7\u2665 7\u2666 and the board shows 9\u2663 4\u2663. What's the probability the next card is a club?",
    hole: [c(7, "H"), c(7, "D")],
    community: [c(9, "C"), c(4, "C")],
    predicate: (d) => d.suit === "C",
    options: ["19%", "23%", "25%", "27%"],
    correct: 1,
  },
  {
    id: "broadway",
    title: "Broadway card",
    question:
      "You hold 6\u2663 3\u2666. What's the probability the next card is a Ten or higher (10, J, Q, K, or A)?",
    hole: [c(6, "C"), c(3, "D")],
    community: [],
    predicate: (d) => d.rank >= T,
    options: ["32%", "36%", "40%", "44%"],
    correct: 2,
  },
];
