/**
 * Derives a user's live Sprint state from their billing entitlement.
 *
 * STORAGE REALITY: today only `plan` + `planExpiresAt` are written (by the
 * Stripe webhook). That is enough to know a sprint is active and how much time
 * is left, but NOT, on its own, the program length or its start instant. So:
 *
 *   • If the orchestrator later writes `sprintId` (and ideally `sprintStartedAt`)
 *     we use them directly — exact day derivation.
 *   • Otherwise we INFER: the smallest standard sprint length (7/14/28) whose
 *     window still covers the days remaining, with start = expiry − length.
 *     This is exact at purchase time and degrades gracefully mid-sprint (a
 *     longer sprint nearing its end reads as a shorter one). `inferred: true`
 *     flags this so the UI can stay honest, and writing sprintId removes it.
 *
 * Pure + deterministic: `now` is injected (defaults to Date.now()).
 */

import { getSprint, type SprintId, type SprintProduct } from "../billing/plans";
import type { SprintLength, SprintProgressLike, SprintState } from "./types";

const DAY_MS = 86_400_000;

/** Standard sprint lengths, ascending. */
const STANDARD_LENGTHS: SprintLength[] = [7, 14, 28];

/** Longest standard sprint window — used to reject subscription-style grants. */
const MAX_SPRINT_DAYS = 28;

function isSprintLength(value: number): value is SprintLength {
  return value === 7 || value === 14 || value === 28;
}

function lengthForSprint(sprint: SprintProduct): SprintLength {
  return isSprintLength(sprint.durationDays) ? sprint.durationDays : 28;
}

/** Smallest standard length whose window still covers `daysRemaining`. */
function inferLength(daysRemaining: number): SprintLength {
  for (const len of STANDARD_LENGTHS) {
    if (daysRemaining <= len) return len;
  }
  return 28;
}

/**
 * Returns the active (or just-finished) sprint state, or null when the user is
 * not on a sprint. A sprint is recognized when the raw plan is `interview_prep`
 * with an expiry set; an explicit `sprintId` makes this unambiguous, and absent
 * that we avoid misreading a long subscription by requiring the remaining
 * window to fit within the longest sprint.
 */
export function deriveSprintState(
  progress: SprintProgressLike | null | undefined,
  now: number = Date.now(),
): SprintState | null {
  if (!progress) return null;
  if (progress.plan !== "interview_prep") return null;
  const expiresAt = progress.planExpiresAt;
  if (expiresAt == null) return null;

  const explicitSprint = progress.sprintId ? getSprint(progress.sprintId) : undefined;

  const msRemaining = Math.max(0, expiresAt - now);
  const daysRemaining = Math.ceil(msRemaining / DAY_MS);

  let sprintId: SprintId;
  let length: SprintLength;
  let firmId: string | undefined;
  let inferred: boolean;

  if (explicitSprint) {
    sprintId = explicitSprint.id;
    length = lengthForSprint(explicitSprint);
    firmId = explicitSprint.firmTargeted
      ? progress.sprintTargetFirmId ?? undefined
      : undefined;
    inferred = false;
  } else {
    // No stored sprint id. Only treat as a sprint when the window is short
    // enough to plausibly be one (otherwise it's likely a subscription).
    if (msRemaining > 0 && daysRemaining > MAX_SPRINT_DAYS) return null;
    length = inferLength(daysRemaining);
    sprintId =
      length === 7 ? "sprint_1wk" : length === 14 ? "sprint_2wk" : "sprint_4wk";
    firmId = progress.sprintTargetFirmId ?? undefined;
    inferred = true;
  }

  const startedAt =
    progress.sprintStartedAt != null
      ? progress.sprintStartedAt
      : expiresAt - length * DAY_MS;

  const totalDays = length;
  const elapsedDays = Math.floor((now - startedAt) / DAY_MS);
  const currentDay = Math.min(Math.max(elapsedDays + 1, 1), totalDays);
  const isComplete = now >= expiresAt;

  return {
    sprintId,
    length,
    startedAt,
    expiresAt,
    now,
    currentDay,
    totalDays,
    daysRemaining,
    msRemaining,
    isComplete,
    firmId,
    inferred,
  };
}

/** Convenience: is the user on a sprint right now (active or finished window)? */
export function hasSprint(
  progress: SprintProgressLike | null | undefined,
  now: number = Date.now(),
): boolean {
  return deriveSprintState(progress, now) !== null;
}
