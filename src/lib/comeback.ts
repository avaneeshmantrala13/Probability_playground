import { TABLE_TIERS, tokenBalance } from "./tokens";
import type { CourseProgress } from "./progress";

/**
 * The Comeback Challenge: when a player busts their stack they can earn a
 * rebuy by answering a short set of *extra-hard*, hand-authored probability and
 * poker-math questions. The bank below is intentionally tough — exact equities,
 * combinatorics, conditional probability, expected value, and pot-odds calls.
 */
export interface ComebackQuestion {
  id: string;
  prompt: string;
  options: string[];
  /** Index into `options` of the correct answer. */
  correctIndex: number;
  explanation: string;
}

export const COMEBACK_QUESTIONS: ComebackQuestion[] = [
  {
    id: "cb-set-on-flop",
    prompt:
      "You're dealt a pocket pair. What is the probability you flop at least a set (three of a kind or better) on the flop?",
    options: ["4.2%", "7.5%", "11.8%", "19.0%"],
    correctIndex: 2,
    explanation:
      "P(no set) = C(48,3)/C(50,3) = (47·46)/(50·49) ≈ 0.882, so flopping a set is about 1 − 0.882 ≈ 11.8% (roughly 1 in 8.5).",
  },
  {
    id: "cb-flush-draw-river",
    prompt:
      "You flop a flush draw (9 outs). With both the turn and river to come, what is the probability you complete the flush by the river?",
    options: ["19.6%", "31.5%", "35.0%", "41.7%"],
    correctIndex: 2,
    explanation:
      "P(miss both) = (38/47)·(37/46) ≈ 0.650, so you complete it about 1 − 0.650 ≈ 35.0%.",
  },
  {
    id: "cb-pot-odds",
    prompt:
      "The pot is $100 and your opponent bets $50. To call profitably, what is the minimum pot equity (chance to win) you need?",
    options: ["20%", "25%", "33%", "50%"],
    correctIndex: 1,
    explanation:
      "You risk $50 to win the $150 already out there. Required equity = 50 / (150 + 50) = 50/200 = 25%.",
  },
  {
    id: "cb-aa-vs-kk",
    prompt:
      "Two players are all-in preflop with pocket Aces against pocket Kings. Approximately how often do the Aces win?",
    options: ["65%", "72%", "82%", "91%"],
    correctIndex: 2,
    explanation:
      "AA is roughly an 82-to-18 favorite over KK (about 81.9% to win, ~0.5% to tie) — the classic 'cooler' matchup.",
  },
  {
    id: "cb-combos",
    prompt:
      "Ignoring order, how many distinct two-card starting hands (specific card combinations) exist in a 52-card deck?",
    options: ["169", "1,326", "2,652", "2,652,000"],
    correctIndex: 1,
    explanation:
      "C(52,2) = (52·51)/2 = 1,326 combinations. (169 is the count of strategically distinct hand types; 2,652 counts ordered pairs.)",
  },
  {
    id: "cb-pocket-pair-dealt",
    prompt: "What is the probability your two hole cards are a pocket pair?",
    options: ["0.45%", "1.2%", "5.9%", "11.8%"],
    correctIndex: 2,
    explanation:
      "After your first card, 3 of the remaining 51 cards pair it: 3/51 ≈ 5.9% (≈ 1 in 17). Equivalently 13·C(4,2)/C(52,2) = 78/1326.",
  },
  {
    id: "cb-ev-bet",
    prompt:
      "A side bet pays you +$30 with probability 0.2 and costs you $10 with probability 0.8. What is its expected value?",
    options: ["−$4", "−$2", "+$2", "+$4"],
    correctIndex: 1,
    explanation: "EV = (0.2 × +30) + (0.8 × −10) = 6 − 8 = −$2, so the bet is unprofitable.",
  },
  {
    id: "cb-both-aces",
    prompt:
      "Off the top of a freshly shuffled deck, what is the probability the first two cards are both Aces?",
    options: ["0.45%", "0.90%", "1.2%", "5.9%"],
    correctIndex: 0,
    explanation: "(4/52)·(3/51) = 12/2652 = 1/221 ≈ 0.45%.",
  },
  {
    id: "cb-oesd-river",
    prompt:
      "You flop an open-ended straight draw (8 outs). With the turn and river to come, what is the probability you make the straight by the river?",
    options: ["8.5%", "17.0%", "31.5%", "44.0%"],
    correctIndex: 2,
    explanation:
      "P(miss both) = (39/47)·(38/46) ≈ 0.685, so you hit about 1 − 0.685 ≈ 31.5%.",
  },
  {
    id: "cb-one-card-equity",
    prompt:
      "You have a flush draw (9 outs) on the turn with only the river to come. What is your approximate equity?",
    options: ["9.0%", "19.6%", "35.0%", "38.0%"],
    correctIndex: 1,
    explanation:
      "With one card to come there are 46 unseen cards: 9/46 ≈ 19.6%. (The 'rule of 2' estimate 9×2 = 18% is close.)",
  },
  {
    id: "cb-bayes-cards",
    prompt:
      "Three cards: one red on both sides, one black on both sides, one red/black. You draw one at random and the face you see is red. What is the probability the other side is also red?",
    options: ["1/3", "1/2", "2/3", "3/4"],
    correctIndex: 2,
    explanation:
      "There are 3 equally likely red faces; 2 of them belong to the all-red card. So P(other side red | this side red) = 2/3, not 1/2.",
  },
];

/** Lowest table tier's min buy-in — the line below which a player is 'broke'. */
export const REBUY_THRESHOLD =
  TABLE_TIERS.reduce(
    (min, t) => Math.min(min, t.minBuyIn),
    TABLE_TIERS[0]?.minBuyIn ?? 200,
  ) || 200;

/** How many questions to serve per comeback attempt. */
export const COMEBACK_QUESTION_COUNT = 5;

/** Tokens granted on a passing attempt — enough to rebuy the Beginner's Table. */
export const COMEBACK_REWARD = 500;

/** Number of correct answers required to pass (all but one). */
export function passingScore(total: number): number {
  return Math.max(1, total - 1);
}

/** True when the player is broke enough to deserve a comeback reward. */
export function isBroke(progress: CourseProgress): boolean {
  return tokenBalance(progress) < REBUY_THRESHOLD;
}

/** A question whose options have been shuffled for a single attempt. */
export interface ServedQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

/** Fisher–Yates shuffle returning a new array (does not mutate the input). */
export function shuffle<T>(input: readonly T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Shuffle a question's options and recompute the correct index. */
function shuffleOptions(q: ComebackQuestion): ServedQuestion {
  const correctValue = q.options[q.correctIndex];
  const options = shuffle(q.options);
  return {
    id: q.id,
    prompt: q.prompt,
    options,
    correctIndex: options.indexOf(correctValue),
    explanation: q.explanation,
  };
}

/**
 * Draw a random subset of `count` questions for one attempt, with both the
 * question order and each question's options shuffled.
 */
export function drawComebackQuestions(
  count: number = COMEBACK_QUESTION_COUNT,
): ServedQuestion[] {
  const n = Math.min(count, COMEBACK_QUESTIONS.length);
  return shuffle(COMEBACK_QUESTIONS).slice(0, n).map(shuffleOptions);
}
