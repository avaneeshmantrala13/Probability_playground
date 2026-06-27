/** Simple in-memory rate limit per uid (resets on cold start — acceptable for Vercel). */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  uid: string,
  key: string,
  maxPerMinute: number,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const id = `${uid}:${key}`;
  const entry = buckets.get(id);
  if (!entry || now > entry.resetAt) {
    buckets.set(id, { count: 1, resetAt: now + 60_000 });
    return { ok: true };
  }
  if (entry.count >= maxPerMinute) {
    return { ok: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { ok: true };
}
