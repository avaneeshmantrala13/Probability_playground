import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import {
  computeStreak,
  emptyProgress,
  fetchProgress,
  recordLessonAttempt,
  saveProgress,
  todayKey,
  type ActiveAttempt,
  type AttemptAnswer,
  type CourseProgress,
} from "../lib/progress";
import { isPassing, scoreToPercent } from "../lib/mastery";

export interface AttemptResult {
  correct: number;
  total: number;
  scorePercent: number;
  passed: boolean;
}

interface ProgressContextValue {
  progress: CourseProgress;
  loading: boolean;
  /** Functional update that also persists (debounced) to Firestore. */
  update: (updater: (prev: CourseProgress) => CourseProgress) => void;
  /** Remember the student's exact position for resume. */
  setPosition: (lessonId: string, questionIndex: number) => void;
  /** Persist the in-progress attempt's answers for exact resume. */
  saveAttempt: (lessonId: string, round: number, answers: AttemptAnswer[]) => void;
  /** Clear the active attempt (e.g. on finishing/restarting a lesson). */
  clearActiveAttempt: () => void;
  /** Score a finished lesson, update mastery/unlocks, and record the attempt. */
  completeAttempt: (
    lessonId: string,
    round: number,
    correct: number,
    total: number,
  ) => AttemptResult;
}

const ProgressContext = createContext<ProgressContextValue | undefined>(undefined);

const SAVE_DEBOUNCE_MS = 700;

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<CourseProgress>(emptyProgress);
  const [loading, setLoading] = useState(true);

  const uidRef = useRef<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<CourseProgress>(progress);
  latest.current = progress;

  // Hydrate on sign-in; reset on sign-out. Also bumps the daily streak.
  useEffect(() => {
    let cancelled = false;
    if (!user) {
      uidRef.current = null;
      setProgress(emptyProgress());
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      try {
        const remote = await fetchProgress(user.uid);
        const today = todayKey();
        const streak = computeStreak(remote.streak, remote.lastActiveDate, today);
        const hydrated: CourseProgress = {
          ...remote,
          streak,
          lastActiveDate: today,
        };
        if (!cancelled) {
          uidRef.current = user.uid;
          setProgress(hydrated);
          // Persist the streak/date bump immediately.
          void saveProgress(user.uid, hydrated).catch(() => undefined);
        }
      } catch {
        if (!cancelled) setProgress(emptyProgress());
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const scheduleSave = useCallback(() => {
    const uid = uidRef.current;
    if (!uid) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      void saveProgress(uid, latest.current).catch(() => undefined);
    }, SAVE_DEBOUNCE_MS);
  }, []);

  // Immediately persist the latest snapshot if a debounced save is pending.
  // Nulling the timer first makes this idempotent, so overlapping unload/hide
  // events (e.g. visibilitychange then pagehide) can't trigger duplicate writes.
  const flushNow = useCallback(() => {
    const uid = uidRef.current;
    if (!uid || !saveTimer.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = null;
    void saveProgress(uid, latest.current).catch(() => undefined);
  }, []);

  // Flush pending progress on any signal that the tab may be going away.
  // 'beforeunload' is unreliable on mobile and during Vite HMR reloads, so we
  // also listen for 'pagehide' and the page being hidden via 'visibilitychange'.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flushNow();
    };
    window.addEventListener("beforeunload", flushNow);
    window.addEventListener("pagehide", flushNow);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("beforeunload", flushNow);
      window.removeEventListener("pagehide", flushNow);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [flushNow]);

  const update = useCallback(
    (updater: (prev: CourseProgress) => CourseProgress) => {
      setProgress((prev) => {
        const next = updater(prev);
        latest.current = next;
        return next;
      });
      scheduleSave();
    },
    [scheduleSave],
  );

  const setPosition = useCallback(
    (lessonId: string, questionIndex: number) => {
      update((prev) => ({
        ...prev,
        currentLesson: lessonId,
        currentQuestion: questionIndex,
      }));
    },
    [update],
  );

  const saveAttempt = useCallback(
    (lessonId: string, round: number, answers: AttemptAnswer[]) => {
      const attempt: ActiveAttempt = { lessonId, round, answers };
      update((prev) => ({ ...prev, activeAttempt: attempt }));
    },
    [update],
  );

  const clearActiveAttempt = useCallback(() => {
    update((prev) => ({ ...prev, activeAttempt: null }));
  }, [update]);

  const completeAttempt = useCallback(
    (lessonId: string, round: number, correct: number, total: number): AttemptResult => {
      const scorePercent = scoreToPercent(correct, total);
      const passed = isPassing(correct, total);

      update((prev) => {
        const existing = prev.lessonMastery[lessonId];
        const mastery = {
          bestScore: Math.max(existing?.bestScore ?? 0, scorePercent),
          attempts: (existing?.attempts ?? 0) + 1,
          passed: (existing?.passed ?? false) || passed,
        };
        const completedLessons =
          passed && !prev.completedLessons.includes(lessonId)
            ? [...prev.completedLessons, lessonId]
            : prev.completedLessons;
        return {
          ...prev,
          lessonMastery: { ...prev.lessonMastery, [lessonId]: mastery },
          completedLessons,
          activeAttempt: null,
        };
      });

      const uid = uidRef.current;
      if (uid) {
        void recordLessonAttempt(uid, {
          lessonId,
          round,
          correct,
          total,
          scorePercent,
          passed,
        }).catch(() => undefined);
      }

      return { correct, total, scorePercent, passed };
    },
    [update],
  );

  const value = useMemo<ProgressContextValue>(
    () => ({
      progress,
      loading,
      update,
      setPosition,
      saveAttempt,
      clearActiveAttempt,
      completeAttempt,
    }),
    [progress, loading, update, setPosition, saveAttempt, clearActiveAttempt, completeAttempt],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within a ProgressProvider");
  return ctx;
}
