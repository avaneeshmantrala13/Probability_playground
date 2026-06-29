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
  DEFAULT_EQUIPPED,
  emptyPokerStats,
  emptyProgress,
  fetchProgress,
  recordLessonAttempt,
  saveProgress,
  todayKey,
  verifyLessonPersisted,
  type ActiveAttempt,
  type AttemptAnswer,
  type CosmeticCategory,
  type CourseProgress,
  type LessonMastery,
} from "../lib/progress";
import { applyChestReward, processLoginRewards } from "../lib/dailyRewards";
import type { MentalMathDifficulty } from "../lib/mentalMath/types";
import { emptyMentalMathScores } from "../lib/mentalMath/types";
import { recordDayTokens } from "../lib/streak";
import { isPassing, scoreToPercent } from "../lib/mastery";
import { STARTING_TOKENS } from "../lib/tokens";
import type { MultiplayerAccess } from "../lib/multiplayer/access";

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
    elapsedMs?: number,
  ) => AttemptResult;

  // ----- Poker capstone token economy -----
  /** Add tokens to the balance (updates peak + lifetime). */
  addTokens: (amount: number) => void;
  /** Spend tokens. Returns false (and does nothing) if the balance is too low. */
  spendTokens: (amount: number) => boolean;
  /** Set the balance to an absolute value (used to reconcile a poker stack). */
  setTokens: (amount: number) => void;
  /** Grant the one-time starting stake if it hasn't been granted yet. */
  seedPokerTokens: () => void;
  /** Buy a cosmetic by id at the given price. Returns false if unaffordable. */
  purchaseCosmetic: (id: string, price: number) => boolean;
  /** Equip an owned cosmetic in its category. */
  equipCosmetic: (category: CosmeticCategory, id: string) => void;
  /** Record a finished poker hand for lifetime stats. */
  recordPokerHand: (opts: {
    won: boolean;
    potSize: number;
    busted?: boolean;
  }) => void;
  /** Grant multiplayer access via daily password until expiry. */
  unlockMultiplayer: (access: MultiplayerAccess) => void;
  /** Record one correctly answered problem (lessons, poker quizzes, games). */
  recordCorrectAnswer: () => void;
  /** Save a mental math drill score if it beats the personal best for that mode. */
  recordMentalMathScore: (difficulty: MentalMathDifficulty, score: number) => boolean;
  /** Reload progress from Firestore (does not overwrite server with stale local state). */
  refetchProgress: () => Promise<boolean>;
  claimPendingChest: () => void;
  consumeQuizLife: () => boolean;
  tickFreePlayMinutes: (minutes: number) => void;
  quizLives: number;
  freePlayMinutesRemaining: number;
  /** True when the most recent save attempts all failed (progress at risk). */
  saveFailed: boolean;
  /** Short reason for the most recent save failure (null when saving is OK). */
  saveErrorReason: string | null;
  /** Manually retry persisting the latest progress to the server right now. */
  retrySave: () => void;
}

const ProgressContext = createContext<ProgressContextValue | undefined>(undefined);

const SAVE_DEBOUNCE_MS = 700;

// Bounded retry schedule for a single save (ms before each attempt). A dropped
// write — a network blip, a transient 5xx — is the classic way progress quietly
// disappears, so we retry before giving up rather than losing the write.
const SAVE_ATTEMPT_BACKOFF_MS = [0, 700, 2000, 5000];

// While a save is known-failed, retry the latest snapshot on this cadence so it
// lands as soon as connectivity (or a fixed permission) recovers.
const SAVE_RETRY_INTERVAL_MS = 12_000;

/** Turn a Firestore/save error into a short, user- and dev-readable reason. */
function describeSaveError(err: unknown): string {
  const code = (err as { code?: string } | null)?.code;
  if (code === "permission-denied") {
    return "permission-denied (Firestore security rules rejected the write)";
  }
  if (code === "unavailable" || code === "deadline-exceeded") {
    return "network unavailable — will retry";
  }
  if (code) return code;
  const msg = (err as { message?: string } | null)?.message;
  return msg ? msg.slice(0, 160) : "unknown error";
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [progress, setProgress] = useState<CourseProgress>(emptyProgress);
  const [loading, setLoading] = useState(true);

  const uidRef = useRef<string | null>(null);
  // The uid whose progress we have SUCCESSFULLY loaded from Firestore. Saves are
  // only ever allowed for this exact uid — this is the core guarantee that we
  // never overwrite a user's server data from an un-hydrated / empty / stale
  // in-memory state (e.g. after a transient fetch failure or account switch).
  const loadedUidRef = useRef<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<CourseProgress>(progress);
  latest.current = progress;

  // Surfaced to the UI so a dropped write can never *silently* lose progress —
  // the user sees a warning and we keep retrying in the background.
  const [saveFailed, setSaveFailed] = useState(false);
  // Human-readable reason for the most recent failure, shown in the banner and
  // logged — turns "it won't save" into an actionable diagnosis (e.g. a
  // permission-denied means a rules problem, vs. an offline/network blip).
  const [saveErrorReason, setSaveErrorReason] = useState<string | null>(null);
  const saveFailedRef = useRef(false);
  const setSaveFailedState = useCallback((failed: boolean, reason?: string | null) => {
    setSaveErrorReason(failed ? reason ?? null : null);
    if (saveFailedRef.current === failed) return;
    saveFailedRef.current = failed;
    setSaveFailed(failed);
  }, []);

  // Persist with bounded retries + backoff. On success we clear the failure
  // flag; only after every attempt fails do we flip it so the periodic/online
  // retries (and the UI banner) take over. `setDoc` resolves only on a server
  // ack here, so a clean resolve means the data really landed.
  const persistProgress = useCallback(
    (uid: string, snapshot: CourseProgress) => {
      void (async () => {
        let lastReason: string | null = null;
        for (let attempt = 0; attempt < SAVE_ATTEMPT_BACKOFF_MS.length; attempt++) {
          if (attempt > 0) {
            await new Promise((r) => setTimeout(r, SAVE_ATTEMPT_BACKOFF_MS[attempt]));
          }
          // Account switched or signed out mid-retry: the new session owns saves.
          if (uidRef.current !== uid || loadedUidRef.current !== uid) return;
          try {
            await saveProgress(uid, snapshot);
            setSaveFailedState(false);
            return;
          } catch (err) {
            lastReason = describeSaveError(err);
            console.error(
              `[progress] save attempt ${attempt + 1}/${SAVE_ATTEMPT_BACKOFF_MS.length} failed (${lastReason}) — progress not yet persisted:`,
              err,
            );
          }
        }
        setSaveFailedState(true, lastReason);
      })();
    },
    [setSaveFailedState],
  );

  // A save may only run for a uid whose progress we've actually loaded.
  const canPersist = useCallback((uid: string | null): uid is string => {
    return !!uid && loadedUidRef.current === uid;
  }, []);

  // Hydrate on sign-in; reset on sign-out. Also bumps the daily streak.
  useEffect(() => {
    let cancelled = false;
    // Wait for Firebase auth to resolve before reporting a loaded state.
    // Otherwise, on a reload, this effect would briefly run with user === null
    // and flip loading=false against empty progress; consumers (LessonPlayer,
    // useLessonTimer) would then hydrate a fresh attempt and ignore the real
    // progress once it arrives, resetting an in-progress lesson and its timer.
    if (authLoading) {
      setLoading(true);
      return;
    }
    if (!user) {
      uidRef.current = null;
      loadedUidRef.current = null;
      setProgress(emptyProgress());
      setLoading(false);
      return;
    }

    const uid = user.uid;
    const alreadyLoaded = loadedUidRef.current === uid;
    const switchingAccounts =
      loadedUidRef.current != null && loadedUidRef.current !== uid;
    uidRef.current = uid;
    if (switchingAccounts) {
      // A different account: block saves and drop the previous user's data from
      // view until the new account is loaded, so it can never be written back.
      loadedUidRef.current = null;
      setProgress(emptyProgress());
    }
    setLoading(!alreadyLoaded);

    (async () => {
      // Retry transient failures with backoff. A network blip must never drop a
      // user into a blank (and therefore overwrite-able) progress state.
      const MAX_HYDRATE_ATTEMPTS = 4;
      for (let attempt = 0; attempt < MAX_HYDRATE_ATTEMPTS && !cancelled; attempt++) {
        try {
          const remote = await fetchProgress(uid);
          const { progress: hydrated } = processLoginRewards(remote);
          if (cancelled) return;
          loadedUidRef.current = uid;
          setProgress(hydrated);
          setLoading(false);
          void persistProgress(uid, hydrated);
          return;
        } catch (err) {
          console.error(
            `[progress] hydrate attempt ${attempt + 1}/${MAX_HYDRATE_ATTEMPTS} failed for ${uid}:`,
            err,
          );
          await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
        }
      }
      if (cancelled) return;
      // All attempts failed. Do NOT replace good data with empty and do NOT
      // enable saving: leaving loadedUidRef unset keeps the server safe. If this
      // account had loaded before in this session, its data stays intact and
      // saveable; otherwise the user sees an empty (but non-destructive) view
      // that recovers on the next successful load/refresh.
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, persistProgress]);

  const scheduleSave = useCallback(() => {
    const uid = uidRef.current;
    if (!canPersist(uid)) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      if (canPersist(uidRef.current)) persistProgress(uid, latest.current);
    }, SAVE_DEBOUNCE_MS);
  }, [persistProgress, canPersist]);

  // Immediately persist the latest snapshot if a debounced save is pending.
  // Nulling the timer first makes this idempotent, so overlapping unload/hide
  // events (e.g. visibilitychange then pagehide) can't trigger duplicate writes.
  const flushNow = useCallback(() => {
    const uid = uidRef.current;
    if (!canPersist(uid) || !saveTimer.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = null;
    persistProgress(uid, latest.current);
  }, [persistProgress, canPersist]);

  // Persist the very next committed snapshot right away (no debounce). Used for
  // high-value events like finishing a lesson, where waiting on the debounce
  // window risks losing the result to a crash/close. Deferred one tick so the
  // pending setProgress updater has written the new snapshot into latest.current.
  const persistImmediately = useCallback(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    setTimeout(() => {
      const uid = uidRef.current;
      if (canPersist(uid)) persistProgress(uid, latest.current);
    }, 0);
  }, [canPersist, persistProgress]);

  // Manual + automatic recovery: re-persist the latest snapshot. Used by the
  // "Retry now" banner button and by the background recovery effect below.
  const retrySave = useCallback(() => {
    const uid = uidRef.current;
    if (canPersist(uid)) persistProgress(uid, latest.current);
  }, [canPersist, persistProgress]);

  // Safety net: while a save is known-failed, keep retrying the *latest*
  // snapshot on an interval and immediately when the network reconnects, so
  // progress lands the moment connectivity (or a fixed permission) recovers.
  useEffect(() => {
    const retry = () => {
      if (saveFailedRef.current) retrySave();
    };
    const interval = setInterval(retry, SAVE_RETRY_INTERVAL_MS);
    window.addEventListener("online", retry);
    return () => {
      clearInterval(interval);
      window.removeEventListener("online", retry);
    };
  }, [retrySave]);

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
    (
      lessonId: string,
      round: number,
      correct: number,
      total: number,
      elapsedMs?: number,
    ): AttemptResult => {
      const scorePercent = scoreToPercent(correct, total);
      const passed = isPassing(correct, total);

      update((prev) => {
        const existing = prev.lessonMastery[lessonId];
        const mastery: LessonMastery = {
          bestScore: Math.max(existing?.bestScore ?? 0, scorePercent),
          attempts: (existing?.attempts ?? 0) + 1,
          passed: (existing?.passed ?? false) || passed,
        };
        // Record the best (minimum) finishing time only for passing attempts;
        // otherwise carry forward any previously recorded best time.
        const prevBest = existing?.bestTimeMs;
        if (passed && elapsedMs != null && elapsedMs > 0) {
          mastery.bestTimeMs =
            prevBest != null ? Math.min(prevBest, elapsedMs) : elapsedMs;
        } else if (prevBest != null) {
          mastery.bestTimeMs = prevBest;
        }

        const completedLessons =
          passed && !prev.completedLessons.includes(lessonId)
            ? [...prev.completedLessons, lessonId]
            : prev.completedLessons;

        const pokerTheoryLastPassDate =
          passed && lessonId.startsWith("pt_") ? todayKey() : prev.pokerTheoryLastPassDate;

        // A passed lesson ends timing; a failed attempt keeps accruing so the
        // remediation round continues the same stopwatch.
        const lessonTimers = { ...prev.lessonTimers };
        if (passed) delete lessonTimers[lessonId];

        return {
          ...prev,
          lessonMastery: { ...prev.lessonMastery, [lessonId]: mastery },
          completedLessons,
          pokerTheoryLastPassDate,
          activeAttempt: null,
          lessonTimers,
        };
      });

      // Finishing a lesson is the highest-value write: persist it immediately
      // instead of waiting on the debounce so it can't be lost to a close/crash.
      persistImmediately();

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

      if (passed && uid) {
        // Belt-and-suspenders for the single most important write: read the doc
        // back from the server and confirm the finished lesson actually landed.
        // If it didn't, surface it and re-persist so it can never be lost.
        void (async () => {
          await new Promise((r) => setTimeout(r, 1500));
          if (uidRef.current !== uid || loadedUidRef.current !== uid) return;
          const ok = await verifyLessonPersisted(uid, lessonId);
          if (!ok) {
            setSaveFailedState(true);
            persistProgress(uid, latest.current);
          }
        })();
      }

      return { correct, total, scorePercent, passed };
    },
    [update, persistImmediately, persistProgress, setSaveFailedState],
  );

  const addTokens = useCallback(
    (amount: number) => {
      if (amount <= 0) return;
      update((prev) => {
        const tokens = (prev.tokens ?? 0) + amount;
        const today = todayKey();
        return {
          ...prev,
          tokens,
          peakTokens: Math.max(prev.peakTokens ?? 0, tokens),
          lifetimeTokens: (prev.lifetimeTokens ?? 0) + amount,
          loginHistory: recordDayTokens(
            prev.loginHistory ?? {},
            today,
            { earned: amount },
            prev.streak,
          ),
        };
      });
    },
    [update],
  );

  const spendTokens = useCallback(
    (amount: number): boolean => {
      if (amount <= 0) return true;
      if ((latest.current.tokens ?? 0) < amount) return false;
      update((prev) => {
        const today = todayKey();
        return {
          ...prev,
          tokens: (prev.tokens ?? 0) - amount,
          loginHistory: recordDayTokens(
            prev.loginHistory ?? {},
            today,
            { lost: amount },
            prev.streak,
          ),
        };
      });
      return true;
    },
    [update],
  );

  const setTokens = useCallback(
    (amount: number) => {
      const next = Math.max(0, Math.floor(amount));
      update((prev) => {
        const gained = Math.max(0, next - (prev.tokens ?? 0));
        return {
          ...prev,
          tokens: next,
          peakTokens: Math.max(prev.peakTokens ?? 0, next),
          lifetimeTokens: (prev.lifetimeTokens ?? 0) + gained,
        };
      });
    },
    [update],
  );

  const seedPokerTokens = useCallback(() => {
    if (latest.current.pokerSeeded) return;
    update((prev) => {
      if (prev.pokerSeeded) return prev;
      const tokens = Math.max(prev.tokens ?? 0, STARTING_TOKENS);
      return {
        ...prev,
        tokens,
        pokerSeeded: true,
        peakTokens: Math.max(prev.peakTokens ?? 0, tokens),
        lifetimeTokens: (prev.lifetimeTokens ?? 0) + tokens,
      };
    });
  }, [update]);

  const purchaseCosmetic = useCallback(
    (id: string, price: number): boolean => {
      const p = latest.current;
      if ((p.ownedCosmetics ?? []).includes(id)) return true;
      if ((p.tokens ?? 0) < price) return false;
      update((prev) => ({
        ...prev,
        tokens: (prev.tokens ?? 0) - price,
        ownedCosmetics: [...(prev.ownedCosmetics ?? []), id],
      }));
      return true;
    },
    [update],
  );

  const equipCosmetic = useCallback(
    (category: CosmeticCategory, id: string) => {
      update((prev) => ({
        ...prev,
        equipped: { ...(prev.equipped ?? DEFAULT_EQUIPPED), [category]: id },
      }));
    },
    [update],
  );

  const recordPokerHand = useCallback(
    (opts: { won: boolean; potSize: number; busted?: boolean }) => {
      update((prev) => {
        const s = prev.pokerStats ?? emptyPokerStats();
        return {
          ...prev,
          pokerStats: {
            handsPlayed: s.handsPlayed + 1,
            handsWon: s.handsWon + (opts.won ? 1 : 0),
            biggestPot: Math.max(s.biggestPot, opts.potSize),
            bustCount: s.bustCount + (opts.busted ? 1 : 0),
          },
        };
      });
    },
    [update],
  );

  const unlockMultiplayer = useCallback(
    (access: MultiplayerAccess) => {
      update((prev) => ({ ...prev, multiplayerAccess: access }));
    },
    [update],
  );

  const refetchProgress = useCallback(async (): Promise<boolean> => {
    const uid = uidRef.current;
    if (!uid) return false;
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    try {
      const remote = await fetchProgress(uid);
      const { progress: hydrated } = processLoginRewards(remote);
      loadedUidRef.current = uid;
      latest.current = hydrated;
      setProgress(hydrated);
      return true;
    } catch (err) {
      // Don't clobber: keep the current in-memory progress and leave the save
      // guard as-is so a failed refresh never drops the user's data.
      console.error("[progress] refetch failed:", err);
      return false;
    }
  }, []);

  const claimPendingChest = useCallback(() => {
    if (!latest.current.pendingChest) return;
    update((prev) => {
      if (!prev.pendingChest) return prev;
      return applyChestReward(prev, prev.pendingChest).progress;
    });
  }, [update]);

  const consumeQuizLife = useCallback((): boolean => {
    if ((latest.current.quizLives ?? 0) < 1) return false;
    update((prev) => ({
      ...prev,
      quizLives: Math.max(0, (prev.quizLives ?? 0) - 1),
    }));
    return true;
  }, [update]);

  const tickFreePlayMinutes = useCallback(
    (minutes: number) => {
      if (minutes <= 0) return;
      update((prev) => ({
        ...prev,
        freePlayMinutesRemaining: Math.max(
          0,
          (prev.freePlayMinutesRemaining ?? 0) - minutes,
        ),
      }));
    },
    [update],
  );

  const recordCorrectAnswer = useCallback(() => {
    update((prev) => ({
      ...prev,
      problemsCorrect: (prev.problemsCorrect ?? 0) + 1,
    }));
  }, [update]);

  const recordMentalMathScore = useCallback(
    (difficulty: MentalMathDifficulty, score: number): boolean => {
      let improved = false;
      update((prev) => {
        const current = prev.mentalMathBest ?? emptyMentalMathScores();
        const prevBest = current[difficulty];
        if (score <= prevBest) return prev;
        improved = true;
        return {
          ...prev,
          mentalMathBest: { ...current, [difficulty]: score },
        };
      });
      return improved;
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
      addTokens,
      spendTokens,
      setTokens,
      seedPokerTokens,
      purchaseCosmetic,
      equipCosmetic,
      recordPokerHand,
      recordCorrectAnswer,
      recordMentalMathScore,
      unlockMultiplayer,
      refetchProgress,
      claimPendingChest,
      consumeQuizLife,
      tickFreePlayMinutes,
      quizLives: progress.quizLives ?? 0,
      freePlayMinutesRemaining: progress.freePlayMinutesRemaining ?? 0,
      saveFailed,
      saveErrorReason,
      retrySave,
    }),
    [
      progress,
      loading,
      update,
      setPosition,
      saveAttempt,
      clearActiveAttempt,
      completeAttempt,
      addTokens,
      spendTokens,
      setTokens,
      seedPokerTokens,
      purchaseCosmetic,
      equipCosmetic,
      recordPokerHand,
      recordCorrectAnswer,
      recordMentalMathScore,
      unlockMultiplayer,
      refetchProgress,
      claimPendingChest,
      consumeQuizLife,
      tickFreePlayMinutes,
      saveFailed,
      saveErrorReason,
      retrySave,
    ],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within a ProgressProvider");
  return ctx;
}
