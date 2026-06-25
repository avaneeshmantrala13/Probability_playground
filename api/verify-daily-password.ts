import type { VercelRequest, VercelResponse } from "@vercel/node";

/** Mirrors src/lib/dailyPassword.ts — kept inline for Vercel ESM bundling. */
const WORDS = [
  "ACE", "KING", "FLUSH", "RIVER", "BLUFF", "RAISE", "STAKE", "CHIPS",
  "FELT", "DEAL", "ODDS", "PAIR", "FULL", "HOUSE", "SUIT", "CLUB",
];

function todayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function generateDailyPassword(dateKey: string, secret: string): string {
  let hash = 0;
  const input = `${secret}:${dateKey}`;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  const w1 = WORDS[hash % WORDS.length];
  const w2 = WORDS[(hash >> 8) % WORDS.length];
  const num = String((hash >> 16) % 100).padStart(2, "0");
  return `${w1}-${w2}-${num}`;
}

function dailyWindowExpiresAt(now = new Date()): string {
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );
  return next.toISOString();
}

function currentDateKey(now = new Date()): string {
  return todayKey(now);
}

function verifyDailyPassword(attempt: string, secret: string, now = new Date()): boolean {
  if (!secret || !attempt.trim()) return false;
  const expected = generateDailyPassword(currentDateKey(now), secret);
  return attempt.trim().toUpperCase() === expected.toUpperCase();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const secret = process.env.DAILY_PASSWORD_SECRET ?? "";

    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }

    if (!secret) {
      return res.status(503).json({ error: "Daily password not configured. Set DAILY_PASSWORD_SECRET." });
    }

    const { password } = req.body as { password?: string };
    if (!password || typeof password !== "string") {
      return res.status(400).json({ error: "Missing password" });
    }

    const ok = verifyDailyPassword(password, secret);
    if (!ok) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    const dateKey = currentDateKey();
    return res.status(200).json({
      ok: true,
      dateKey,
      expiresAt: dailyWindowExpiresAt(),
    });
  } catch (err) {
    console.error("verify-daily-password error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return res.status(500).json({ error: message });
  }
}
