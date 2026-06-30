/**
 * Aggregates lessons across all three tracks into a single "Learn" library so
 * primers can be browsed independently of taking the quiz.
 */
import { LESSONS } from "./index";
import { MARKET_MAKING_LESSONS } from "./marketMakingLessons";
import { POKER_THEORY_LESSONS } from "./pokerTheory";
import type { Lesson } from "./types";

export type LearnTrack = "quant" | "poker-theory" | "market-making";

export interface LearnEntry {
  lesson: Lesson;
  track: LearnTrack;
  trackLabel: string;
  /** Route to the lesson player for this lesson. */
  playerPath: string;
}

const TRACKS: { track: LearnTrack; label: string; lessons: Lesson[]; path: (id: string) => string }[] = [
  {
    track: "quant",
    label: "Quant",
    lessons: LESSONS,
    path: (id) => `/lessons/${id}`,
  },
  {
    track: "poker-theory",
    label: "Poker Theory",
    lessons: POKER_THEORY_LESSONS,
    path: (id) => `/poker-theory/${id}`,
  },
  {
    track: "market-making",
    label: "Market Making",
    lessons: MARKET_MAKING_LESSONS,
    path: (id) => `/market-making/lessons/${id}`,
  },
];

/** All lessons across every track, in track then course order. */
export const LEARN_ENTRIES: LearnEntry[] = TRACKS.flatMap((t) =>
  t.lessons.map((lesson) => ({
    lesson,
    track: t.track,
    trackLabel: t.label,
    playerPath: t.path(lesson.lessonId),
  })),
);

const ENTRY_BY_ID = new Map(LEARN_ENTRIES.map((e) => [e.lesson.lessonId, e]));

export function getLearnEntry(lessonId: string): LearnEntry | undefined {
  return ENTRY_BY_ID.get(lessonId);
}

/** True when a lesson has any browsable primer content (rich primer or intro). */
export function hasLearnContent(lesson: Lesson): boolean {
  return (
    (lesson.primer?.length ?? 0) > 0 ||
    (lesson.primerNarration?.length ?? 0) > 0 ||
    (lesson.intro?.length ?? 0) > 0
  );
}

export interface LearnGroup {
  track: LearnTrack;
  trackLabel: string;
  entries: LearnEntry[];
}

/** Learn entries grouped by track, only including lessons with content. */
export function learnGroups(): LearnGroup[] {
  return TRACKS.map((t) => ({
    track: t.track,
    trackLabel: t.label,
    entries: LEARN_ENTRIES.filter(
      (e) => e.track === t.track && hasLearnContent(e.lesson),
    ),
  })).filter((g) => g.entries.length > 0);
}
