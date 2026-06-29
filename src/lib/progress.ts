import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { stripUndefined } from "./firestore/sanitize";

/** Per-question state inside an in-progress lesson attempt. */
export interface AttemptAnswer {
  selected: number | null;
  checked: boolean;
}

export interface ActiveAttempt {
  lessonId: string;
  /** 0 = primary questions, 1+ = remediation round. */
  round: number;
  answers: AttemptAnswer[];
}

export interface LessonMastery {
  /** Best percentage (0–100) achieved on the lesson. */
  bestScore: number;
  attempts: number;
  passed: boolean;
  /** Fastest finishing time (ms) for a PASSED attempt; powers speed badges. */
  bestTimeMs?: number;
}

import type { MultiplayerAccess } from "./multiplayer/access";
import type { ChestStats, PendingChest, StreakDay } from "./streak";
import { EMPTY_CHEST_STATS } from "./streak";
import type { MentalMathBestScores } from "./mentalMath/types";
import { emptyMentalMathScores } from "./mentalMath/types";

/** Currently equipped cosmetic ids, one per category. */
export interface EquippedCosmetics {
  deckSkin: string;
  tableTheme: string;
  accentTheme: string;
  chipStyle: string;
  avatarAccessory: string;
  animation: string;
  playerOutfit: string;
}

/** Cosmetic categories the player can unlock + equip with poker tokens. */
export type CosmeticCategory = keyof EquippedCosmetics;

/** Lifetime poker performance stats (drives some milestone badges). */
export interface PokerStats {
  handsPlayed: number;
  handsWon: number;
  biggestPot: number;
  bustCount: number;
}

/** The default (free) cosmetics every player owns + starts equipped with. */
export const DEFAULT_EQUIPPED: EquippedCosmetics = {
  deckSkin: "deck-classic",
  tableTheme: "table-classic-green",
  accentTheme: "accent-default",
  chipStyle: "chip-classic",
  avatarAccessory: "acc-none",
  animation: "anim-none",
  playerOutfit: "outfit-default",
};

export const DEFAULT_OWNED_COSMETICS: string[] = [
  "deck-classic",
  "table-classic-green",
  "accent-default",
  "chip-classic",
  "acc-none",
  "anim-none",
  "outfit-default",
];

export function emptyPokerStats(): PokerStats {
  return { handsPlayed: 0, handsWon: 0, biggestPot: 0, bustCount: 0 };
}

export interface CourseProgress {
  currentLesson: string | null;
  currentQuestion: number;
  completedLessons: string[];
  lessonMastery: Record<string, LessonMastery>;
  streak: number;
  lastActiveDate: string | null;
  activeAttempt: ActiveAttempt | null;
  /** Accrued elapsed time (ms) for each lesson's in-progress attempt. */
  lessonTimers?: Record<string, number>;

  // ----- Poker capstone token economy (unlocked after all lessons) -----
  /** Current chip/token balance. */
  tokens?: number;
  /** Whether the one-time starting stake has been granted. */
  pokerSeeded?: boolean;
  /** Highest balance ever reached (powers "reach N tokens" milestone badges). */
  peakTokens?: number;
  /** Total tokens ever earned across the lifetime of the account. */
  lifetimeTokens?: number;
  /** Lifetime count of correctly answered problems (lessons, poker quizzes, games). */
  problemsCorrect?: number;
  /** Cosmetic ids the player has unlocked. */
  ownedCosmetics?: string[];
  /** Currently equipped cosmetics by category. */
  equipped?: EquippedCosmetics;
  /** Lifetime poker stats. */
  pokerStats?: PokerStats;
  /** Daily-password multiplayer unlock (expires at next UTC midnight). */
  multiplayerAccess?: MultiplayerAccess;

  // ----- Daily login streak rewards (see src/lib/streak.ts for schema) -----
  /** Free poker-table minutes remaining (granted on streak days 1–2). */
  freePlayMinutesRemaining?: number;
  /** Quiz wrong-answer forgiveness count (consumed by quiz agents). */
  quizLives?: number;
  /** YYYY-MM-DD when daily login rewards were last processed. */
  lastLoginRewardDate?: string | null;
  /** Unopened treasure chest for the current streak day (day 3+). */
  pendingChest?: PendingChest | null;
  /** Per-day login + reward snapshot for the calendar heat-map. */
  loginHistory?: Record<string, StreakDay>;
  /** Badge ids earned exclusively from treasure chests. */
  chestBadgesEarned?: string[];
  /** Lifetime chest-open counters. */
  chestStats?: ChestStats;
  /** Legacy/alternate per-day badge ids (calendar reads either source). */
  badgesByDay?: Record<string, string[]>;
  /** Legacy/alternate per-day token deltas. */
  tokensByDay?: Record<string, { earned: number; lost: number }>;
  /** Best correct-answer counts in 120s mental math drills, per difficulty. */
  mentalMathBest?: MentalMathBestScores;
  /** YYYY-MM-DD when a poker theory lesson was last passed (daily Poker Night gate). */
  pokerTheoryLastPassDate?: string | null;
}

export function emptyProgress(): CourseProgress {
  return {
    currentLesson: null,
    currentQuestion: 0,
    completedLessons: [],
    lessonMastery: {},
    streak: 0,
    lastActiveDate: null,
    activeAttempt: null,
    lessonTimers: {},
    tokens: 0,
    pokerSeeded: false,
    peakTokens: 0,
    lifetimeTokens: 0,
    problemsCorrect: 0,
    ownedCosmetics: [...DEFAULT_OWNED_COSMETICS],
    equipped: { ...DEFAULT_EQUIPPED },
    pokerStats: emptyPokerStats(),
    freePlayMinutesRemaining: 0,
    quizLives: 0,
    lastLoginRewardDate: null,
    pendingChest: null,
    loginHistory: {},
    chestBadgesEarned: [],
    chestStats: { ...EMPTY_CHEST_STATS },
    mentalMathBest: emptyMentalMathScores(),
  };
}

/** Fresh progress with the standard 1000-token starting balance. */
export function freshProgressWithTokens(): CourseProgress {
  return {
    ...emptyProgress(),
    tokens: 1000,
    pokerSeeded: true,
    peakTokens: 1000,
    lifetimeTokens: 1000,
  };
}

/** Local date as YYYY-MM-DD (used for streak tracking). */
export function todayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function dayDiff(a: string, b: string): number {
  const da = new Date(a + "T00:00:00");
  const db_ = new Date(b + "T00:00:00");
  return Math.round((db_.getTime() - da.getTime()) / 86_400_000);
}

/**
 * Returns the updated streak for "active today". Same day = unchanged,
 * consecutive day = +1, any gap (or first ever) = reset to 1.
 */
export function computeStreak(
  prevStreak: number,
  lastActiveDate: string | null,
  today = todayKey(),
): number {
  if (!lastActiveDate) return 1;
  const diff = dayDiff(lastActiveDate, today);
  if (diff === 0) return Math.max(1, prevStreak);
  if (diff === 1) return prevStreak + 1;
  return 1;
}

export async function fetchProgress(uid: string): Promise<CourseProgress> {
  const snap = await getDoc(doc(db, "courseProgress", uid));
  if (!snap.exists()) return emptyProgress();
  const data = snap.data() as Partial<CourseProgress>;
  return { ...emptyProgress(), ...data };
}

export async function saveProgress(
  uid: string,
  progress: CourseProgress,
): Promise<void> {
  // Firestore rejects the ENTIRE write with `invalid-argument` if any field is
  // `undefined` (e.g. optional fields like `pokerTheoryLastPassDate` that aren't
  // in emptyProgress). Strip them so a stray undefined can never drop a save.
  // Sanitize only the plain progress data — `serverTimestamp()` is a FieldValue
  // sentinel that must be added afterward so stripUndefined never rebuilds it.
  await setDoc(
    doc(db, "courseProgress", uid),
    { ...stripUndefined(progress), updatedAt: serverTimestamp() },
    { merge: true },
  );
}

/**
 * Read the doc back from the server and confirm a just-passed lesson actually
 * landed. The Firestore web SDK only resolves `setDoc` after a server ack (no
 * offline persistence is enabled here), so a thrown save is the usual failure
 * signal — but for the highest-value write (finishing a lesson) we double-check
 * against the server so a silent drop can never masquerade as success.
 *
 * Best-effort: returns `false` (rather than throwing) if the read itself fails,
 * so callers can decide to retry without crashing the finish flow.
 */
export async function verifyLessonPersisted(
  uid: string,
  lessonId: string,
): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, "courseProgress", uid));
    if (!snap.exists()) return false;
    const data = snap.data() as Partial<CourseProgress>;
    return (
      (data.completedLessons ?? []).includes(lessonId) ||
      data.lessonMastery?.[lessonId]?.passed === true
    );
  } catch (err) {
    console.error("[progress] verify read failed:", err);
    return false;
  }
}

export interface LessonAttemptRecord {
  lessonId: string;
  round: number;
  correct: number;
  total: number;
  scorePercent: number;
  passed: boolean;
}

/** Appends an immutable per-attempt record under the owning user. */
export async function recordLessonAttempt(
  uid: string,
  record: LessonAttemptRecord,
): Promise<void> {
  await addDoc(collection(db, "lessonAttempts", uid, "attempts"), {
    ...record,
    createdAt: serverTimestamp(),
  });
}
