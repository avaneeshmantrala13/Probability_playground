import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "./admin.js";
import { isCompAccessEmail } from "./comp.js";

/**
 * Persistent per-uid daily AI usage counter (server-side free-tier enforcement).
 *
 * Storage: `aiUsage/{uid}` holds a flat map keyed by `${YYYYMMDD}:${feature}` →
 * count, plus an `updatedAt` marker. Increments run inside a Firestore
 * transaction so concurrent requests can't over-spend a quota.
 *
 * Effective plan is read from `courseProgress/{uid}` and mirrors
 * src/lib/billing/entitlements.ts:effectivePlan — paid plans (pro /
 * interview_prep) are effectively unlimited (guarded by a high safety cap);
 * free users are held to the per-feature daily limit.
 *
 * Fails OPEN: if Admin is unconfigured the request is allowed (and logged) so
 * the product never hard-breaks on a misconfiguration.
 */

type EffectivePlan = "free" | "pro" | "interview_prep";

/** Safety ceiling applied to paid plans to cap runaway/abusive usage. */
const PAID_SAFETY_CAP = 2000;

export interface ConsumeOptions {
  /** Free-tier daily limit for this feature. */
  freeLimit: number;
  /**
   * Optional override for the paid-plan safety cap. Paid plans are marketed as
   * unlimited; this only guards against pathological abuse.
   */
  paidCap?: number;
  /**
   * The caller's timezone offset in minutes, as returned by JS
   * `Date.prototype.getTimezoneOffset()` (positive for zones behind UTC, e.g.
   * +300 for UTC-5). Used so the daily counter resets at the user's LOCAL
   * midnight instead of UTC midnight. Clamped to ±14h; left at 0 (UTC) when
   * absent. Client-controlled, but bounded — it can only shift the day boundary
   * by at most a day, never grant unlimited resets.
   */
  tzOffsetMinutes?: number;
}

export interface ConsumeResult {
  ok: boolean;
  used: number;
  limit: number;
  /** True when enforcement was skipped (Admin unconfigured) and we failed open. */
  failedOpen?: boolean;
}

/** Max plausible timezone offset (±14h) — clamps a client-supplied value. */
const MAX_TZ_OFFSET_MIN = 14 * 60;

function clampOffset(min: unknown): number {
  if (typeof min !== "number" || !Number.isFinite(min)) return 0;
  return Math.max(-MAX_TZ_OFFSET_MIN, Math.min(MAX_TZ_OFFSET_MIN, Math.trunc(min)));
}

/**
 * Calendar day key in the caller's LOCAL time so the daily quota resets at their
 * local midnight. `tzOffsetMinutes` follows JS getTimezoneOffset() sign
 * (UTC = local + offset), so local time = UTC − offset.
 */
function dayKey(now: Date, tzOffsetMinutes = 0): string {
  const local = new Date(now.getTime() - tzOffsetMinutes * 60_000);
  const y = local.getUTCFullYear();
  const m = String(local.getUTCMonth() + 1).padStart(2, "0");
  const d = String(local.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function coercePlan(value: unknown): EffectivePlan {
  return value === "pro" || value === "interview_prep" ? value : "free";
}

/** Effective plan accounting for expiry (mirrors entitlements.effectivePlan). */
function effectivePlan(plan: unknown, planExpiresAt: unknown, now: number): EffectivePlan {
  const level = coercePlan(plan);
  if (level === "free") return "free";
  if (typeof planExpiresAt === "number" && planExpiresAt <= now) return "free";
  return level;
}

/**
 * Atomically account one unit of `feature` usage for `uid` and decide whether
 * the request is allowed under the user's effective plan + daily limit.
 */
export async function consumeDailyQuota(
  uid: string,
  feature: string,
  opts: ConsumeOptions,
): Promise<ConsumeResult> {
  const db = getDb();
  if (!db) {
    console.error(
      `[usage] Admin unconfigured — failing open for uid=${uid} feature=${feature}`,
    );
    return { ok: true, used: 0, limit: opts.freeLimit, failedOpen: true };
  }

  const now = Date.now();
  const field = `${dayKey(new Date(now), clampOffset(opts.tzOffsetMinutes))}:${feature}`;
  const usageRef = db.collection("aiUsage").doc(uid);
  const progressRef = db.collection("courseProgress").doc(uid);
  const userRef = db.collection("users").doc(uid);

  try {
    return await db.runTransaction(async (tx) => {
      const [progressSnap, usageSnap, userSnap] = await Promise.all([
        tx.get(progressRef),
        tx.get(usageRef),
        tx.get(userRef),
      ]);

      const progress = progressSnap.exists ? progressSnap.data() ?? {} : {};
      // Comped owner accounts are treated as the top paid tier (unlimited-ish).
      const comp = userSnap.exists && isCompAccessEmail(userSnap.data()?.email);
      const plan = comp
        ? "interview_prep"
        : effectivePlan(progress.plan, progress.planExpiresAt, now);
      const limit = plan === "free" ? opts.freeLimit : (opts.paidCap ?? PAID_SAFETY_CAP);

      const usageData = usageSnap.exists ? usageSnap.data() ?? {} : {};
      const current = typeof usageData[field] === "number" ? (usageData[field] as number) : 0;

      if (current >= limit) {
        return { ok: false, used: current, limit };
      }

      tx.set(
        usageRef,
        { [field]: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() },
        { merge: true },
      );
      return { ok: true, used: current + 1, limit };
    });
  } catch (err) {
    console.error(`[usage] transaction failed — failing open for uid=${uid} feature=${feature}:`, err);
    return { ok: true, used: 0, limit: opts.freeLimit, failedOpen: true };
  }
}
