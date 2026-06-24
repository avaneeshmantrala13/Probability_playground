import type { Lesson } from "./types";

/**
 * Eagerly imports every lesson JSON file in ./lessons. Adding a new lesson file
 * automatically registers it; lessons are ordered by their `order` field.
 */
const modules = import.meta.glob<{ default: Lesson }>("./lessons/*.json", {
  eager: true,
});

export const LESSONS: Lesson[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.order - b.order);

const LESSON_BY_ID = new Map(LESSONS.map((l) => [l.lessonId, l]));

export function getLesson(lessonId: string): Lesson | undefined {
  return LESSON_BY_ID.get(lessonId);
}

export function getLessonIndex(lessonId: string): number {
  return LESSONS.findIndex((l) => l.lessonId === lessonId);
}

export function getNextLesson(lessonId: string): Lesson | undefined {
  const idx = getLessonIndex(lessonId);
  if (idx === -1) return undefined;
  return LESSONS[idx + 1];
}

export const TOTAL_LESSONS = LESSONS.length;
