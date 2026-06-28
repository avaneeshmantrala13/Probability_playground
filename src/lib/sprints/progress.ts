/**
 * Maps the user's real CourseProgress onto curriculum tasks so the dashboard
 * can show honest, signal-backed completion — no extra storage required.
 *
 * Only lesson-style tasks have a clean "done" signal (lessonMastery / passed),
 * so those drive the headline progress number. Practice, mental-math, mock, and
 * review tasks are open-ended reps and are reported as untrackable rather than
 * being faked complete. Pure + deterministic.
 */

import type { CourseProgress } from "../progress";
import type { SprintCurriculum, SprintTask } from "./types";

/** Task kinds whose completion we can read from progress. */
const TRACKABLE_KINDS: ReadonlySet<SprintTask["kind"]> = new Set([
  "lesson",
  "pokerTheory",
  "marketMaking",
]);

/** True when a task has a completion signal we can read from progress. */
export function isTaskTrackable(task: SprintTask): boolean {
  return TRACKABLE_KINDS.has(task.kind) && !!task.lessonId;
}

/** True when a trackable task has been mastered (passed). */
export function isTaskComplete(task: SprintTask, progress: CourseProgress): boolean {
  if (!isTaskTrackable(task) || !task.lessonId) return false;
  if (progress.completedLessons.includes(task.lessonId)) return true;
  return progress.lessonMastery[task.lessonId]?.passed === true;
}

export interface SprintProgressSummary {
  /** Trackable lesson tasks in the whole program. */
  totalTrackable: number;
  /** Of those, how many are mastered. */
  completedTrackable: number;
  /** 0–100, rounded. 0 when nothing is trackable. */
  percent: number;
}

/** Overall curriculum progress from mastered lessons across all days. */
export function computeSprintProgress(
  curriculum: SprintCurriculum,
  progress: CourseProgress,
): SprintProgressSummary {
  let totalTrackable = 0;
  let completedTrackable = 0;
  // A lesson can appear on multiple days (taught then re-drilled); count each
  // unique lesson once so progress reflects distinct mastery, not repetition.
  const seen = new Set<string>();
  for (const day of curriculum.days) {
    for (const task of day.tasks) {
      if (!isTaskTrackable(task) || !task.lessonId) continue;
      if (seen.has(task.lessonId)) continue;
      seen.add(task.lessonId);
      totalTrackable += 1;
      if (isTaskComplete(task, progress)) completedTrackable += 1;
    }
  }
  const percent =
    totalTrackable > 0
      ? Math.round((completedTrackable / totalTrackable) * 100)
      : 0;
  return { totalTrackable, completedTrackable, percent };
}

/** Every distinct mock-interview task across the program, in schedule order. */
export function collectMockTasks(curriculum: SprintCurriculum): {
  day: number;
  task: SprintTask;
}[] {
  const out: { day: number; task: SprintTask }[] = [];
  for (const day of curriculum.days) {
    for (const task of day.tasks) {
      if (task.kind === "mockInterview") out.push({ day: day.day, task });
    }
  }
  return out;
}
