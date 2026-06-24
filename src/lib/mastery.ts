import { LESSONS, getLessonIndex } from "../content";
import { OPTION_LETTERS } from "../content/types";
import type {
  Explanations,
  Lesson,
  Question,
  RemediationVariant,
  RenderableQuestion,
} from "../content/types";
import type { CourseProgress } from "./progress";

/** Mastery threshold to pass a lesson and unlock the next one. */
export const PASS_THRESHOLD = 0.8;

/** Number of authored remediation variants per question. */
export const REMEDIATION_VARIANTS = 2;

export function scoreToPercent(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export function isPassing(correct: number, total: number): boolean {
  return total > 0 && correct / total >= PASS_THRESHOLD;
}

/**
 * A lesson is unlocked when it is the first lesson, or the immediately previous
 * lesson has been passed. This enforces mastery-based progression.
 */
export function isLessonUnlocked(
  lessonId: string,
  progress: CourseProgress,
): boolean {
  const idx = getLessonIndex(lessonId);
  if (idx <= 0) return true;
  const prev = LESSONS[idx - 1];
  return Boolean(progress.lessonMastery[prev.lessonId]?.passed);
}

/**
 * Which round to serve when (re)entering a lesson:
 * 0 = primary questions, 1+ = remediation rounds (one per prior failed attempt).
 */
export function roundForLesson(
  lessonId: string,
  progress: CourseProgress,
): number {
  const mastery = progress.lessonMastery[lessonId];
  if (!mastery || mastery.passed) return 0;
  return mastery.attempts; // each failed attempt advances the remediation round
}

/**
 * Lets an authored explanation persist across remediation variants. A variant
 * inherits the parent question's CORRECT-answer explanation onto its own correct
 * option whenever the variant doesn't already provide one. This is semantically
 * safe because a variant tests the same concept with the same correct idea, and
 * it guarantees a once-authored explanation never disappears in later rounds.
 * Incorrect-option explanations are NOT auto-mapped (the variant's options
 * differ), so those remain per-variant authored.
 */
function inheritExplanations(
  parent: Question,
  variant: RemediationVariant,
): Explanations {
  const merged: Explanations = { ...variant.explanations };

  const parentCorrect = OPTION_LETTERS[parent.correctAnswer];
  const variantCorrect = OPTION_LETTERS[variant.correctAnswer];
  const parentCorrectText = parent.explanations[parentCorrect]?.trim() ?? "";

  if (!merged[variantCorrect]?.trim() && parentCorrectText) {
    merged[variantCorrect] = parent.explanations[parentCorrect];
  }
  return merged;
}

/**
 * Builds the questions to render for a given round. Round 0 returns the primary
 * questions; higher rounds substitute authored remediation variants (cycling
 * through the available variants). Authored explanations are preserved: a
 * variant inherits the parent's correct-answer explanation if it has none of
 * its own, so product-owner explanations persist across every round.
 */
export function buildAttemptQuestions(
  lesson: Lesson,
  round: number,
): RenderableQuestion[] {
  if (round <= 0) {
    return lesson.questions.map((q) => ({
      id: q.id,
      simulation: q.simulation,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanations: q.explanations,
    }));
  }

  const variantIndex = (round - 1) % REMEDIATION_VARIANTS;
  return lesson.questions.map((q) => {
    const variant = q.remediation?.[variantIndex];
    if (!variant) {
      return {
        id: q.id,
        simulation: q.simulation,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanations: q.explanations,
      };
    }
    return {
      id: variant.id,
      simulation: variant.simulation ?? q.simulation,
      question: variant.question,
      options: variant.options,
      correctAnswer: variant.correctAnswer,
      explanations: inheritExplanations(q, variant),
    };
  });
}
