import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "./admin";

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
}

export interface ConsumeResult {
  ok: boolean;
  used: number;
  limit: number;
  /** True when enforcement was skipped (Admin unconfigured) and we failed open. */
  failedOpen?: boolean;
}

function dayKey(now: Date): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
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
  const field = `${dayKey(new Date(now))}:${feature}`;
  const usageRef = db.collection("aiUsage").doc(uid);
  const progressRef = db.collection("courseProgress").doc(uid);

  try {
    return await db.runTransaction(async (tx) => {
      const [progressSnap, usageSnap] = await Promise.all([
        tx.get(progressRef),
        tx.get(usageRef),
      ]);

      const progress = progressSnap.exists ? progressSnap.data() ?? {} : {};
      const plan = effectivePlan(progress.plan, progress.planExpiresAt, now);
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
