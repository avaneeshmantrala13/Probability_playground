/**
 * Pure helpers for reading a user's effective plan.
 *
 * STORAGE MODEL:
 * The Stripe webhook (`api/stripe-webhook.ts`) is the SOLE writer of `plan` and
 * `planExpiresAt` on `courseProgress/{uid}`. The client treats them as
 * read-only (enforced by Firestore rules). Everything here is pure and
 * side-effect free so it is safe to call from both client and server.
 */

import {
  type EntitlementLevel,
  type PlanId,
  type Feature,
  FEATURE_MIN_PLAN,
  meetsEntitlement,
} from "./plans";

/** The subset of CourseProgress this module reads. */
export interface PlanProgressLike {
  /** Access level granted by billing. Absent/legacy docs ⇒ free. */
  plan?: string | null;
  /** Epoch ms when a time-boxed grant (sprint / subscription period) lapses. */
  planExpiresAt?: number | null;
}

function coerceLevel(value: unknown): EntitlementLevel {
  return value === "pro" || value === "interview_prep" ? value : "free";
}

/**
 * Resolve the *effective* plan right now, accounting for expiry. An expired
 * sprint/subscription falls back to `free`.
 */
export function effectivePlan(
  progress: PlanProgressLike | null | undefined,
  now: number = Date.now(),
): EntitlementLevel {
  if (!progress) return "free";
  const level = coerceLevel(progress.plan);
  if (level === "free") return "free";
  if (progress.planExpiresAt != null && progress.planExpiresAt <= now) return "free";
  return level;
}

/** True when `current` meets or exceeds `required`. */
export function planSatisfies(current: EntitlementLevel, required: PlanId): boolean {
  return meetsEntitlement(current, required);
}

/** Minimum plan that unlocks a feature. */
export function minimumPlanFor(feature: Feature): EntitlementLevel {
  return FEATURE_MIN_PLAN[feature];
}

/** True when `plan` can use `feature`. */
export function hasEntitlement(plan: EntitlementLevel, feature: Feature): boolean {
  return planSatisfies(plan, minimumPlanFor(feature));
}

/** Whole days remaining on a time-boxed plan (0 when none/expired). */
export function planDaysRemaining(
  progress: PlanProgressLike | null | undefined,
  now: number = Date.now(),
): number {
  if (!progress?.planExpiresAt) return 0;
  return Math.max(0, Math.ceil((progress.planExpiresAt - now) / 86_400_000));
}
