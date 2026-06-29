/**
 * Fail-open wrapper around the daily AI usage counter.
 *
 * IMPORTANT: this intentionally does NOT statically import `./usage` (which
 * pulls in firebase-admin/firestore). Importing that module at the top of a
 * serverless function put firebase-admin into the function's load graph and was
 * crashing the whole function on Vercel (FUNCTION_INVOCATION_FAILED) — taking
 * the AI tutor / question generation / poker lines down with it.
 *
 * By loading `./usage` lazily inside a try/catch, any load- or run-time failure
 * degrades to "allow the request" instead of killing the endpoint. The quota is
 * a soft anti-abuse guard, never a hard dependency for core features.
 */
export interface QuotaResult {
  ok: boolean;
  used: number;
  limit: number;
  failedOpen?: boolean;
}

export async function consumeQuotaSafe(
  uid: string,
  feature: string,
  freeLimit: number,
): Promise<QuotaResult> {
  try {
    const mod = await import("./usage.js");
    return await mod.consumeDailyQuota(uid, feature, { freeLimit });
  } catch (err) {
    console.error(
      `[quota] usage module unavailable — failing open for feature=${feature}:`,
      err,
    );
    return { ok: true, used: 0, limit: freeLimit, failedOpen: true };
  }
}
