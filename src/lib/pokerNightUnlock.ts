import { POKER_THEORY_LESSONS } from "../content/pokerTheory";
import type { CourseProgress } from "./progress";
import { todayKey } from "./progress";

/** TEMP: set false to enforce the poker-theory daily gate on /poker. */
export const BYPASS_POKER_NIGHT_GATE = false;

export function allPokerTheoryLessonsPassed(progress: CourseProgress): boolean {
  return POKER_THEORY_LESSONS.every((l) =>
    Boolean(progress.lessonMastery[l.lessonId]?.passed),
  );
}

/** True if the user passed at least one poker theory lesson today (UTC date). */
export function completedPokerTheoryToday(progress: CourseProgress): boolean {
  return progress.pokerTheoryLastPassDate === todayKey();
}

/**
 * Poker Night unlock:
 * - All poker theory lessons mastered → play anytime
 * - Otherwise → complete ≥1 poker theory lesson today
 */
export function isPokerNightUnlocked(progress: CourseProgress): boolean {
  if (BYPASS_POKER_NIGHT_GATE) return true;
  if (allPokerTheoryLessonsPassed(progress)) return true;
  return completedPokerTheoryToday(progress);
}

/** User-facing hint for the locked screen. */
export function pokerNightLockMessage(progress: CourseProgress): {
  headline: string;
  detail: string;
} {
  if (allPokerTheoryLessonsPassed(progress)) {
    return { headline: "Poker Night is locked", detail: "Unexpected lock state." };
  }
  return {
    headline: "Complete a Poker Theory lesson today",
    detail:
      "Pass any Poker Theory lesson today to unlock Poker Night for the rest of the day. Master all Poker Theory lessons to play anytime.",
  };
}
