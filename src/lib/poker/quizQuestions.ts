import {
  POKER_QUIZ_BANK,
  type PokerQuizQuestion,
  type PokerQuizTier,
} from "../quant/pokerQuizBank";

/** Difficulty tier for poker quiz-gate questions (before hole/flop/turn/river). */
export type QuizDifficulty = PokerQuizTier;

export type { PokerQuizQuestion };

export const DEFAULT_QUIZ_DIFFICULTY: QuizDifficulty = "easy";

export const QUIZ_DIFFICULTY_LABELS: Record<
  QuizDifficulty,
  { label: string; hint: string }
> = {
  easy: {
    label: "Easy",
    hint: "Quick mental math, coins, dice, and basic fractions",
  },
  medium: {
    label: "Medium",
    hint: "Expected value, complements, and card-draw speed problems",
  },
  hard: {
    label: "Hard",
    hint: "Pot odds, order-of-magnitude estimates, and interview-speed EV",
  },
};

export function getQuestionDifficulty(id: string): QuizDifficulty {
  return POKER_QUIZ_BANK.find((q) => q.id === id)?.difficulty ?? "medium";
}

/** Questions eligible for a quiz-gate at the given difficulty setting. */
export function getQuizQuestionPool(
  difficulty: QuizDifficulty,
): PokerQuizQuestion[] {
  return POKER_QUIZ_BANK.filter((q) => {
    if (difficulty === "easy") return q.difficulty === "easy";
    if (difficulty === "medium")
      return q.difficulty === "easy" || q.difficulty === "medium";
    return true;
  });
}

/** Exported for tests / diagnostics. */
export const POKER_QUIZ_QUESTIONS = POKER_QUIZ_BANK.map((q) => ({
  id: q.id,
  prompt: q.prompt,
  options: q.options,
  correctIndex: q.correctIndex,
  explanation: q.explanation,
  difficulty: q.difficulty,
}));
