import { LESSONS } from "../../content";
import type { CourseProgress } from "../progress";

/** True when every lesson has been passed (full mastery). */
export function hasFullMastery(progress: CourseProgress): boolean {
  return LESSONS.every((l) => Boolean(progress.lessonMastery[l.lessonId]?.passed));
}

/** Multiplayer unlock stored after entering the daily password. */
export interface MultiplayerAccess {
  /** ISO timestamp when the password unlock expires. */
  expiresAt: string;
  /** UTC date key (YYYY-MM-DD) for which password was used. */
  dateKey: string;
}

export function isMultiplayerAccessValid(
  access: MultiplayerAccess | undefined | null,
  now = new Date(),
): boolean {
  if (!access?.expiresAt) return false;
  return new Date(access.expiresAt).getTime() > now.getTime();
}

/**
 * Multiplayer is available when the user mastered all lessons OR has a valid
 * daily-password unlock for today.
 */
export function isMultiplayerUnlocked(
  progress: CourseProgress,
  now = new Date(),
): boolean {
  if (hasFullMastery(progress)) return true;
  return isMultiplayerAccessValid(progress.multiplayerAccess, now);
}

/** Reason shown in the gate UI. */
export function multiplayerGateReason(progress: CourseProgress): "mastery" | "password" | "locked" {
  if (hasFullMastery(progress)) return "mastery";
  if (isMultiplayerAccessValid(progress.multiplayerAccess)) return "password";
  return "locked";
}
