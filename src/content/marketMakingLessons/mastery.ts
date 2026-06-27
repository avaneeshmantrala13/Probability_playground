import { OPTION_LETTERS } from "../types";
import type {
  Explanations,
  Lesson,
  Question,
  RemediationVariant,
  RenderableQuestion,
} from "../types";
import {
  getMarketMakingLessonIndex,
  MARKET_MAKING_LESSONS,
} from "./index";
import type { CourseProgress } from "../../lib/progress";

export { PASS_THRESHOLD, REMEDIATION_VARIANTS, isPassing, scoreToPercent } from "../../lib/mastery";

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

export function isMarketMakingLessonUnlocked(
  lessonId: string,
  progress: CourseProgress,
): boolean {
  const idx = getMarketMakingLessonIndex(lessonId);
  if (idx <= 0) return true;
  const prev = MARKET_MAKING_LESSONS[idx - 1];
  return Boolean(progress.lessonMastery[prev.lessonId]?.passed);
}

export function roundForMarketMakingLesson(
  lessonId: string,
  progress: CourseProgress,
): number {
  const mastery = progress.lessonMastery[lessonId];
  if (!mastery || mastery.passed) return 0;
  return mastery.attempts;
}

export function buildMarketMakingAttemptQuestions(
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

  const variantIndex = (round - 1) % 2;
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
