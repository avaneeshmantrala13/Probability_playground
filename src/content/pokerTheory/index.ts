import type { Lesson } from "./types";

/**
 * Eagerly imports every Poker Theory lesson JSON in this folder. Adding a new
 * file automatically registers it; lessons are ordered by their `order` field.
 */
const modules = import.meta.glob<{ default: Lesson }>("./*.json", {
  eager: true,
});

export const POKER_THEORY_LESSONS: Lesson[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.order - b.order);

const LESSON_BY_ID = new Map(POKER_THEORY_LESSONS.map((l) => [l.lessonId, l]));

export function getPokerTheoryLesson(lessonId: string): Lesson | undefined {
  return LESSON_BY_ID.get(lessonId);
}

export function getPokerTheoryLessonIndex(lessonId: string): number {
  return POKER_THEORY_LESSONS.findIndex((l) => l.lessonId === lessonId);
}

export function getNextPokerTheoryLesson(lessonId: string): Lesson | undefined {
  const idx = getPokerTheoryLessonIndex(lessonId);
  if (idx === -1) return undefined;
  return POKER_THEORY_LESSONS[idx + 1];
}

export const TOTAL_POKER_THEORY_LESSONS = POKER_THEORY_LESSONS.length;
