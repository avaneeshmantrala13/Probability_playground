import type { Lesson } from "../types";

/**
 * Eagerly imports every Market Making lesson JSON in this folder. Adding a new
 * file automatically registers it; lessons are ordered by their `order` field.
 */
const modules = import.meta.glob<{ default: Lesson }>("./*.json", {
  eager: true,
});

export const MARKET_MAKING_LESSONS: Lesson[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.order - b.order);

const LESSON_BY_ID = new Map(MARKET_MAKING_LESSONS.map((l) => [l.lessonId, l]));

export function getMarketMakingLesson(lessonId: string): Lesson | undefined {
  return LESSON_BY_ID.get(lessonId);
}

export function getMarketMakingLessonIndex(lessonId: string): number {
  return MARKET_MAKING_LESSONS.findIndex((l) => l.lessonId === lessonId);
}

export function getNextMarketMakingLesson(lessonId: string): Lesson | undefined {
  const idx = getMarketMakingLessonIndex(lessonId);
  if (idx === -1) return undefined;
  return MARKET_MAKING_LESSONS[idx + 1];
}

export const TOTAL_MARKET_MAKING_LESSONS = MARKET_MAKING_LESSONS.length;
