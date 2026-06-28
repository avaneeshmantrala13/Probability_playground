import type { Explanations } from "../types";

/** Which course track a practice bank belongs to. */
export type PracticeTrack = "quant" | "poker-theory" | "market-making";

/**
 * A standalone practice question. Unlike lesson `Question`s these are NOT
 * pass-gated and carry no remediation variants — they feed the ungated
 * "endless practice" pool. The shape is render-compatible with
 * `RenderableQuestion` so the existing QuestionCard/FeedbackPanel can show them.
 */
export interface PracticeQuestion {
  id: string;
  /** Concept tag (mirrors the lesson concepts) for future filtering. */
  concept: string;
  question: string;
  options: string[];
  /** Zero-based index into `options`. */
  correctAnswer: number;
  explanations: Explanations;
}

/** A per-lesson pool of practice questions. */
export interface PracticeBank {
  lessonId: string;
  track: PracticeTrack;
  title: string;
  questions: PracticeQuestion[];
}
