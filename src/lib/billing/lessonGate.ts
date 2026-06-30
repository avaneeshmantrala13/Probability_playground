/**
 * Per-lesson access gating by billing tier.
 *
 * The advanced quant block (lessons 12–18) is Pro-only content: free users can
 * see it exists but must upgrade to Pro to open it. Enforcement lives in the
 * lesson player, the practice session, and the Learn primer view, and is
 * surfaced as a lock in the lesson list. Sequential mastery still applies on
 * top of this gate.
 *
 * Comped owner accounts resolve to the top tier in `useEntitlement`, so they
 * are never blocked here.
 */
import { meetsEntitlement, type EntitlementLevel } from "./plans";

/** Advanced quant lessons that require a paid (Pro or higher) plan. */
export const PRO_LESSON_IDS: ReadonlySet<string> = new Set<string>([
  "lesson_12",
  "lesson_13",
  "lesson_14",
  "lesson_15",
  "lesson_16",
  "lesson_17",
  "lesson_18",
]);

/** True when the lesson belongs to the Pro-only advanced block. */
export function lessonRequiresPro(lessonId: string): boolean {
  return PRO_LESSON_IDS.has(lessonId);
}

/**
 * True when `plan` may open `lessonId` from a billing standpoint. This ignores
 * sequential-mastery unlocking (handled separately by `isLessonUnlocked`).
 */
export function canAccessLessonPlan(
  lessonId: string,
  plan: EntitlementLevel,
): boolean {
  if (!lessonRequiresPro(lessonId)) return true;
  return meetsEntitlement(plan, "pro");
}
