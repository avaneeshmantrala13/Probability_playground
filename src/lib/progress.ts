import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";

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
  await setDoc(
    doc(db, "courseProgress", uid),
    { ...progress, updatedAt: serverTimestamp() },
    { merge: true },
  );
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
