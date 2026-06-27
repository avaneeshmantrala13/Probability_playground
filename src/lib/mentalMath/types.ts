export type MentalMathDifficulty = "easy" | "medium" | "hard";

export type MentalMathOp = "+" | "-" | "×" | "÷";

export interface MentalMathProblem {
  prompt: string;
  answer: number;
  op: MentalMathOp;
}

export interface MentalMathBestScores {
  easy: number;
  medium: number;
  hard: number;
}

export const MENTAL_MATH_DURATION_SEC = 120;

export const DIFFICULTY_LABELS: Record<MentalMathDifficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export const DIFFICULTY_HINTS: Record<MentalMathDifficulty, string> = {
  easy: "Zetamac-style: add/subtract up to 100, multiply & divide with 1–12 tables.",
  medium: "2-digit × 1-digit, tougher division, larger add/subtract.",
  hard: "3-digit × 2-digit multiplication, multi-digit whole-number division.",
};

export function emptyMentalMathScores(): MentalMathBestScores {
  return { easy: 0, medium: 0, hard: 0 };
}
