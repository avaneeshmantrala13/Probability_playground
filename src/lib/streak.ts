/**
 * Shared streak / daily-activity data layer for Probability Playground.
 *
 * Consumed by the Calendar tab agent and daily-rewards logic. All fields below
 * live on the Firestore document `courseProgress/{uid}` unless noted.
 *
 * ## Top-level fields (on CourseProgress)
 *
 * | Field                    | Type                              | Description |
 * |--------------------------|-----------------------------------|-------------|
 * | streak                   | number                            | Current consecutive login-day count |
 * | lastActiveDate           | string \| null                    | YYYY-MM-DD of last activity bump |
 * | lastLoginRewardDate      | string \| null                    | YYYY-MM-DD when daily reward was last processed |
 * | loginHistory             | Record<string, StreakDay>         | Per-day login + reward snapshot keyed by date |
 * | pendingChest             | PendingChest \| null              | Unclaimed chest for the current streak day |
 * | freePlayMinutesRemaining | number                            | Free poker-table minutes (days 1–2 reward) |
 * | quizLives                | number                            | Wrong-answer forgiveness count for quizzes |
 * | chestBadgesEarned        | string[]                          | Badge ids granted exclusively via chests |
 * | chestStats               | ChestStats                        | Lifetime chest-open counters |
 *
 * ## Subcollection (optional future use)
 *
 * Calendar agent may also read `courseProgress/{uid}/dailyActivity/{date}` if
 * we split high-volume per-day logs; for now everything is denormalised into
 * `loginHistory` on the parent doc.
 */

import { BADGES } from "./badges";
import { todayKey, type CourseProgress } from "./progress";

/** Snapshot of one calendar day for the streak heat-map / calendar UI. */
export interface StreakDay {
  /** YYYY-MM-DD */
  date: string;
  /** Whether the user logged in (opened the app) on this day. */
  loggedIn: boolean;
  /** Streak count as of that day (after login processing). */
  streakCount: number;
  /** What daily reward was granted on this new streak day. */
  rewardType?: "free_play" | "chest" | "none";
  /** Tokens earned this day (lessons, chests, poker wins, etc.). */
  tokensEarned?: number;
  /** Tokens lost this day (poker losses, store purchases, etc.). */
  tokensLost?: number;
  /** Chest tier 1–10 when rewardType === "chest". */
  chestLevel?: number;
  /** Whether the chest reward was claimed (opened). */
  chestClaimed?: boolean;
  /** Extra activity tallies the calendar can aggregate. */
  activity?: DayActivity;
  /** Badge ids earned on this day (chests, milestones, etc.). */
  badgesEarned?: string[];
}

/** Optional per-day activity counters for the calendar heat-map. */
export interface DayActivity {
  lessonsCompleted?: number;
  pokerHandsPlayed?: number;
  quizQuestionsAnswered?: number;
}

/** Lifetime counters for chest-related badges. */
export interface ChestStats {
  opened: number;
  bestLevel: number;
}

/** An unopened treasure chest waiting for the user to tap it. */
export interface PendingChest {
  /** YYYY-MM-DD this chest was earned. */
  date: string;
  /** Streak day number when earned (≥ 3). */
  streakDay: number;
  /** Tier 1 (wooden) … 10 (diamond). */
  level: number;
  /** Pre-rolled reward (revealed only after the open animation). */
  reward: ChestReward;
}

/** Possible contents inside a treasure chest. */
export type ChestReward =
  | { kind: "tokens"; amount: number }
  | { kind: "lives"; amount: number }
  | { kind: "badge"; badgeId: string };

export const EMPTY_CHEST_STATS: ChestStats = { opened: 0, bestLevel: 0 };

/** Read a StreakDay entry, returning a safe default for missing dates. */
export function getStreakDay(
  history: Record<string, StreakDay> | undefined,
  date: string,
): StreakDay | undefined {
  return history?.[date];
}

/** Merge token earned/lost into a day's loginHistory entry (creates if needed). */
export function recordDayTokens(
  history: Record<string, StreakDay>,
  date: string,
  delta: { earned?: number; lost?: number },
  streakCount: number,
): Record<string, StreakDay> {
  const prev = history[date] ?? {
    date,
    loggedIn: true,
    streakCount,
  };
  return {
    ...history,
    [date]: {
      ...prev,
      tokensEarned: (prev.tokensEarned ?? 0) + (delta.earned ?? 0),
      tokensLost: (prev.tokensLost ?? 0) + (delta.lost ?? 0),
    },
  };
}

/** True when `date` is a different calendar day than `lastActiveDate`. */
export function isNewStreakDay(
  lastActiveDate: string | null | undefined,
  date = todayKey(),
): boolean {
  if (!lastActiveDate) return true;
  return lastActiveDate !== date;
}

/** Ordered list of chest tier names for UI labels. */
export const CHEST_TIER_NAMES = [
  "Wooden",
  "Bronze",
  "Iron",
  "Silver",
  "Gold",
  "Platinum",
  "Ruby",
  "Sapphire",
  "Emerald",
  "Diamond",
] as const;

export function chestTierName(level: number): string {
  return CHEST_TIER_NAMES[Math.min(Math.max(level, 1), 10) - 1];
}

// ----- Calendar read helpers (display-only; no chest logic) -----

export type ProgressWithStreak = CourseProgress;

export interface DaySummary {
  date: string;
  active: boolean;
  badgeIds: string[];
  tokensEarned: number;
  tokensLost: number;
  streakOnDay: number;
  longestStreakThroughDay: number;
}

export interface StreakSnapshot {
  loginDates: Set<string>;
  currentStreak: number;
  longestStreak: number;
  dayMap: Map<string, DaySummary>;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(key: string): Date {
  return new Date(key + "T00:00:00");
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

export function shiftDate(key: string, deltaDays: number): string {
  const d = parseDate(key);
  d.setDate(d.getDate() + deltaDays);
  return formatDate(d);
}

function sortedUnique(dates: string[]): string[] {
  return [...new Set(dates.filter((d) => DATE_RE.test(d)))].sort();
}

export function deriveLoginDates(progress: ProgressWithStreak, today = todayKey()): string[] {
  const fromHistory = Object.values(progress.loginHistory ?? {})
    .filter((d) => d.loggedIn)
    .map((d) => d.date);
  const fromWindow = deriveStreakWindowDates(progress, today);
  return sortedUnique([...fromHistory, ...fromWindow]);
}

/** Consecutive login dates ending on lastActiveDate (or today) from the live streak count. */
export function deriveStreakWindowDates(
  progress: ProgressWithStreak,
  today = todayKey(),
): string[] {
  const streak = Math.max(0, progress.streak);
  if (streak === 0) return [];
  const anchor = progress.lastActiveDate ?? today;
  const dates: string[] = [];
  for (let i = streak - 1; i >= 0; i--) {
    dates.push(shiftDate(anchor, -i));
  }
  return dates;
}

/**
 * Fill loginHistory for each day in the current streak window. Needed when the
 * streak predates loginHistory (e.g. calendar added after streak started).
 */
export function backfillStreakHistory(
  history: Record<string, StreakDay>,
  streak: number,
  anchor: string,
): Record<string, StreakDay> {
  if (streak <= 0) return history;
  const next = { ...history };
  for (let i = streak - 1; i >= 0; i--) {
    const date = shiftDate(anchor, -i);
    const streakCountOnDay = streak - i;
    const existing = next[date];
    if (existing?.loggedIn && (existing.streakCount ?? 0) >= streakCountOnDay) continue;
    next[date] = {
      ...existing,
      date,
      loggedIn: true,
      streakCount: streakCountOnDay,
      rewardType: existing?.rewardType ?? "none",
    };
  }
  return next;
}

function isActiveOn(progress: ProgressWithStreak, date: string, loginSet: Set<string>): boolean {
  if (loginSet.has(date)) return true;
  const record = progress.loginHistory?.[date];
  return record?.loggedIn ?? false;
}

function tokensForDay(progress: ProgressWithStreak, date: string): { earned: number; lost: number } {
  const day = progress.loginHistory?.[date];
  const legacy = progress.tokensByDay?.[date];
  return {
    earned: day?.tokensEarned ?? legacy?.earned ?? 0,
    lost: day?.tokensLost ?? legacy?.lost ?? 0,
  };
}

function badgeIdsForDay(progress: ProgressWithStreak, date: string): string[] {
  const day = progress.loginHistory?.[date];
  if (day?.badgesEarned?.length) return day.badgesEarned;
  return progress.badgesByDay?.[date] ?? [];
}

export function longestStreakInDates(sortedDates: string[]): number {
  if (sortedDates.length === 0) return 0;
  let best = 1;
  let run = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = parseDate(sortedDates[i - 1]!);
    const curr = parseDate(sortedDates[i]!);
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86_400_000);
    if (diff === 1) {
      run += 1;
      best = Math.max(best, run);
    } else if (diff > 0) {
      run = 1;
    }
  }
  return best;
}

export function streakEndingOn(date: string, loginSet: Set<string>): number {
  if (!loginSet.has(date)) return 0;
  let count = 1;
  let cursor = date;
  while (loginSet.has(shiftDate(cursor, -1))) {
    count += 1;
    cursor = shiftDate(cursor, -1);
  }
  return count;
}

export function longestStreakThrough(date: string, sortedLogins: string[]): number {
  return longestStreakInDates(sortedLogins.filter((d) => d <= date));
}

export function buildStreakSnapshot(progress: ProgressWithStreak): StreakSnapshot {
  const sortedLogins = deriveLoginDates(progress);
  const loginDates = new Set(sortedLogins);
  const currentStreak = progress.streak;
  const longestStreak = Math.max(longestStreakInDates(sortedLogins), currentStreak);

  const allDates = new Set<string>(sortedLogins);
  for (const key of Object.keys(progress.loginHistory ?? {})) allDates.add(key);
  for (const key of Object.keys(progress.badgesByDay ?? {})) allDates.add(key);
  for (const key of Object.keys(progress.tokensByDay ?? {})) allDates.add(key);

  const dayMap = new Map<string, DaySummary>();
  for (const date of allDates) {
    const active = isActiveOn(progress, date, loginDates);
    const historyDay = progress.loginHistory?.[date];
    const tokens = tokensForDay(progress, date);
    dayMap.set(date, {
      date,
      active,
      badgeIds: badgeIdsForDay(progress, date),
      tokensEarned: tokens.earned,
      tokensLost: tokens.lost,
      streakOnDay: active ? streakEndingOn(date, loginDates) : (historyDay?.streakCount ?? 0),
      longestStreakThroughDay: longestStreakThrough(date, sortedLogins),
    });
  }

  return { loginDates, currentStreak, longestStreak, dayMap };
}

export function getDaySummary(
  snapshot: StreakSnapshot,
  progress: ProgressWithStreak,
  date: string,
): DaySummary {
  const existing = snapshot.dayMap.get(date);
  if (existing) return existing;

  const active = isActiveOn(progress, date, snapshot.loginDates);
  const sortedLogins = [...snapshot.loginDates].sort();
  const historyDay = progress.loginHistory?.[date];
  const tokens = tokensForDay(progress, date);
  return {
    date,
    active,
    badgeIds: badgeIdsForDay(progress, date),
    tokensEarned: tokens.earned,
    tokensLost: tokens.lost,
    streakOnDay: active ? streakEndingOn(date, snapshot.loginDates) : (historyDay?.streakCount ?? 0),
    longestStreakThroughDay: longestStreakThrough(date, sortedLogins),
  };
}

export function badgeById(id: string) {
  return BADGES.find((b) => b.id === id);
}

export function monthGrid(year: number, month: number): (string | null)[][] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  const daysInMonth = last.getDate();

  const cells: (string | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(formatDate(new Date(year, month, d)));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
}

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });
}
