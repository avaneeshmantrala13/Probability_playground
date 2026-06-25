import { todayKey } from "./progress";

const WORDS = [
  "ACE", "KING", "FLUSH", "RIVER", "BLUFF", "RAISE", "STAKE", "CHIPS",
  "FELT", "DEAL", "ODDS", "PAIR", "FULL", "HOUSE", "SUIT", "CLUB",
];

/**
 * Deterministic daily password from secret + UTC date.
 * Same password for all users on a given UTC day; rotates at midnight UTC.
 */
export function generateDailyPassword(dateKey: string, secret: string): string {
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

/** ISO timestamp when the current UTC daily window ends (next midnight UTC). */
export function dailyWindowExpiresAt(now = new Date()): string {
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );
  return next.toISOString();
}

export function currentDateKey(now = new Date()): string {
  return todayKey(now);
}

export function verifyDailyPassword(
  attempt: string,
  secret: string,
  now = new Date(),
): boolean {
  if (!secret || !attempt.trim()) return false;
  const expected = generateDailyPassword(currentDateKey(now), secret);
  return attempt.trim().toUpperCase() === expected.toUpperCase();
}
