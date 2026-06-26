import { COMEBACK_QUESTIONS, type ComebackQuestion } from "../comeback";

/** Difficulty tier for poker quiz-gate questions (before hole/flop/turn/river). */
export type QuizDifficulty = "easy" | "medium" | "hard";

export const DEFAULT_QUIZ_DIFFICULTY: QuizDifficulty = "easy";

export const QUIZ_DIFFICULTY_LABELS: Record<
  QuizDifficulty,
  { label: string; hint: string }
> = {
  easy: {
    label: "Easy",
    hint: "Coins, dice, and basic fractions — no poker hand math",
  },
  medium: {
    label: "Medium",
    hint: "Sample spaces, complements, and simple card draws",
  },
  hard: {
    label: "Hard",
    hint: "Poker odds, pot math, and tougher probability",
  },
};

/**
 * Per-question difficulty for the quiz-gate pool (sourced from comeback bank).
 * Easy & medium exclude poker combo odds and heavy multi-step hand math.
 */
const QUIZ_QUESTION_DIFFICULTY: Record<string, QuizDifficulty> = {
  // ── Easy: coins, dice, basic fractions, independent events ─────────────
  "cb-exp-coin-200": "easy",
  "cb-exp-spinner-50": "easy",
  "cb-law-large-numbers": "easy",
  "cb-theo-die-prime": "easy",
  "cb-sample-three-coins": "easy",
  "cb-sample-coin-die": "easy",
  "cb-complement-027": "easy",
  "cb-indep-two-events": "easy",
  "cb-indep-coin-die": "easy",
  "cb-indep-three-spins": "easy",
  "cb-add-die-2or5": "easy",
  "cb-die-not-3": "easy",
  "cb-die-greater-4": "easy",
  "cb-card-ace": "easy",
  "cb-card-red": "easy",
  "cb-dice-both-even": "easy",
  "cb-binomial-mean-flips": "easy",
  "cb-spinner-uniform-quarter": "easy",
  "cb-geometric-second-trial": "easy",
  "cb-coin-hth-sequence": "easy",
  "cb-complement-head-4flips": "easy",
  "cb-expected-defects": "easy",
  "cb-coin-game-ev": "easy",
  "cb-complement-at-least-one-tail-3": "easy",
  "cb-exp-vs-theo-die": "easy",
  "cb-dice-sum-7": "easy",
  "cb-dice-sum-2": "easy",
  "cb-dice-doubles": "easy",
  "cb-coin-2-of-3": "easy",
  "cb-marble-one-red": "easy",

  // ── Hard: poker hand math, heavy combinatorics, multi-step ─────────────
  "cb-set-on-flop": "hard",
  "cb-flush-draw-river": "hard",
  "cb-pot-odds": "hard",
  "cb-aa-vs-kk": "hard",
  "cb-combos": "hard",
  "cb-pocket-pair-dealt": "hard",
  "cb-oesd-river": "hard",
  "cb-one-card-equity": "hard",
  "cb-both-aces": "hard",
  "cb-ev-bet": "hard",
  "cb-flop-pair-AK": "hard",
  "cb-suited-flop-flush": "hard",
  "cb-suited-flop-flushdraw": "hard",
  "cb-turn-card-outs": "hard",
  "cb-implied-odds-call": "hard",
  "cb-gutshot-river": "hard",
  "cb-comb-poker-hands": "hard",
  "cb-comb-choose-8-3": "hard",
  "cb-comb-arrange-5-books": "hard",
  "cb-comb-perm-7-3": "hard",
  "cb-comb-lottery": "hard",
  "cb-comb-binary-8": "hard",
  "cb-comb-pizza": "hard",
  "cb-comb-anagram-level": "hard",
  "cb-comb-seat-circle": "hard",
  "cb-card-king-then-queen": "hard",
  "cb-cond-formula": "hard",
  "cb-cond-defective": "hard",
  "cb-bayes-medical": "hard",
  "cb-birthday-23": "hard",
  "cb-ev-die-roll": "hard",
  "cb-ev-lottery": "hard",
  "cb-ev-roulette-red": "hard",
  "cb-ev-two-prize": "hard",
  "cb-ev-insurance": "hard",
  "cb-ev-two-dice-sum": "hard",
  "cb-dice-sum-11": "hard",
  "cb-dice-sum-over-9": "hard",
  "cb-dice-product-even": "hard",
  "cb-geo-number-line": "hard",
  "cb-geo-circle-in-square": "hard",
  "cb-odds-against-3to1": "hard",
  "cb-coin-six-tails": "hard",
  "cb-marble-two-red": "hard",
  "cb-marble-red-then-blue": "hard",
  "cb-marble-replacement": "hard",
  "cb-comb-license-plate": "hard",
};

export function getQuestionDifficulty(id: string): QuizDifficulty {
  return QUIZ_QUESTION_DIFFICULTY[id] ?? "medium";
}

/** Questions eligible for a quiz-gate at the given difficulty setting. */
export function getQuizQuestionPool(difficulty: QuizDifficulty): ComebackQuestion[] {
  return COMEBACK_QUESTIONS.filter((q) => {
    const tier = getQuestionDifficulty(q.id);
    if (difficulty === "easy") return tier === "easy";
    if (difficulty === "medium") return tier === "easy" || tier === "medium";
    return true;
  });
}

/** Exported for tests / diagnostics. */
export const POKER_QUIZ_QUESTIONS = COMEBACK_QUESTIONS.map((q) => ({
  ...q,
  difficulty: getQuestionDifficulty(q.id),
}));
