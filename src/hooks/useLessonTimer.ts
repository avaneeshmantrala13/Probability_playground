import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useProgress } from "../context/ProgressContext";

/** How often the accrued time is written back into progress while running. */
const PERSIST_INTERVAL_MS = 8000;

export interface LessonTimer {
  /** Live elapsed time (ms) for display; updates ~once per second. */
  elapsedMs: number;
  /** Current elapsed time (ms) read on demand (e.g. on lesson finish). */
  getElapsedMs: () => number;
  /** Stop accruing and persisting; returns the final elapsed time (ms). */
  stop: () => number;
}

/**
 * A per-lesson stopwatch that:
 * - resumes from the saved elapsed time (survives refresh),
 * - only accrues while mounted, the tab is visible, and a user is signed in,
 * - persists periodically (debounced) and on pause/hide/unmount,
 * - never writes to Firestore on every tick.
 *
 * Pass `active = false` to freeze it entirely (e.g. when reviewing/redoing a
 * lesson that's already mastered — there is no time or badge to earn, so the
 * clock should not run or be persisted).
 */
export function useLessonTimer(lessonId: string, active = true): LessonTimer {
  const { user } = useAuth();
  const { progress, loading, update } = useProgress();

  // Accumulated ms from completed (paused) segments.
  const baseMsRef = useRef(0);
  // Timestamp the current running segment began, or null while paused.
  const segmentStartRef = useRef<number | null>(null);
  // Once stopped (lesson finished) we neither accrue nor persist again.
  const stoppedRef = useRef(false);
  const lastPersistRef = useRef(0);
  const hydratedFor = useRef<string | null>(null);

  const [elapsedMs, setElapsedMs] = useState(0);

  const liveMs = useCallback(
    () =>
      baseMsRef.current +
      (segmentStartRef.current != null ? Date.now() - segmentStartRef.current : 0),
    [],
  );

  const persist = useCallback(() => {
    if (!user || stoppedRef.current || !active) return;
    const ms = liveMs();
    update((prev) => ({
      ...prev,
      lessonTimers: { ...prev.lessonTimers, [lessonId]: ms },
    }));
    lastPersistRef.current = Date.now();
  }, [user, active, lessonId, update, liveMs]);

  // Hydrate the base from the saved value once, per lesson, after load.
  useEffect(() => {
    if (loading) return;
    if (hydratedFor.current === lessonId) return;
    baseMsRef.current = progress.lessonTimers?.[lessonId] ?? 0;
    segmentStartRef.current = null;
    stoppedRef.current = false;
    lastPersistRef.current = Date.now();
    hydratedFor.current = lessonId;
    setElapsedMs(baseMsRef.current);
  }, [lessonId, loading, progress]);

  useEffect(() => {
    if (loading || hydratedFor.current !== lessonId) return;

    const canRun = () =>
      active &&
      !stoppedRef.current &&
      !!user &&
      document.visibilityState === "visible";

    const startSegment = () => {
      if (segmentStartRef.current == null && canRun()) {
        segmentStartRef.current = Date.now();
      }
    };

    const pauseSegment = () => {
      if (segmentStartRef.current != null) {
        baseMsRef.current += Date.now() - segmentStartRef.current;
        segmentStartRef.current = null;
      }
      setElapsedMs(baseMsRef.current);
      persist();
    };

    startSegment();
    setElapsedMs(liveMs());

    const tick = setInterval(() => {
      if (!canRun()) {
        if (segmentStartRef.current != null) pauseSegment();
        return;
      }
      if (segmentStartRef.current == null) startSegment();
      setElapsedMs(liveMs());
      if (Date.now() - lastPersistRef.current >= PERSIST_INTERVAL_MS) persist();
    }, 1000);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") pauseSegment();
      else startSegment();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisibility);
      // Bank + persist whatever ran in this segment before unmounting.
      pauseSegment();
    };
  }, [lessonId, loading, user, active, persist, liveMs]);

  const getElapsedMs = useCallback(() => liveMs(), [liveMs]);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    if (segmentStartRef.current != null) {
      baseMsRef.current += Date.now() - segmentStartRef.current;
      segmentStartRef.current = null;
    }
    setElapsedMs(baseMsRef.current);
    return baseMsRef.current;
  }, []);

  return { elapsedMs, getElapsedMs, stop };
}
