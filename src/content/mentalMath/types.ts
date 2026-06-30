import type { MentalMathDifficulty } from "../../lib/mentalMath/types";

export type MentalQuizMode = "brainteaser" | "estimation";

/**
 * A single multiple-choice item in the brainteaser / estimation banks.
 *
 * Brainteasers are untimed, points-based logic & probability puzzles.
 * Estimation items are Fermi / market-sizing questions scored "mc_closest":
 * every option is numeric and `correctAnswer` is the option whose value is
 * closest to `trueValue`. `optionValues` carries the parsed numeric value of
 * each option so the UI can award partial credit by closeness.
 */
export interface MentalQuizQuestion {
  id: string;
  mode: MentalQuizMode;
  difficulty: MentalMathDifficulty;
  topic: string;
  question: string;
  options: string[];
  /** Zero-based index into `options`. */
  correctAnswer: number;
  explanation: string;
  /** Estimation only: numeric value of each option, aligned with `options`. */
  optionValues?: number[];
  /** Estimation only: the estimated true value the closest option approximates. */
  trueValue?: number;
}

export interface MentalQuizBank {
  mode: MentalQuizMode;
  generatedAt: string;
  questions: MentalQuizQuestion[];
}
