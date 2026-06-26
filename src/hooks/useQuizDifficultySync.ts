import { useEffect, useRef } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { useQuizDifficulty } from "../context/QuizDifficultyContext";
import type { QuizDifficulty } from "../lib/poker/quizQuestions";

/**
 * Keeps quiz-gate difficulty in sync with the user's Firestore settings doc so
 * it follows them across devices. localStorage remains the fast source of truth.
 */
export function useQuizDifficultySync() {
  const { user } = useAuth();
  const { difficulty, setDifficulty } = useQuizDifficulty();
  const hydratedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      hydratedFor.current = null;
      return;
    }
    if (hydratedFor.current === user.uid) return;

    let cancelled = false;
    void (async () => {
      try {
        const snap = await getDoc(doc(db, "settings", user.uid));
        const remote = snap.data()?.quizDifficulty as QuizDifficulty | undefined;
        if (
          !cancelled &&
          remote &&
          (remote === "easy" || remote === "medium" || remote === "hard")
        ) {
          setDifficulty(remote);
        }
      } catch {
        // Offline or rules issue: keep the local preference.
      } finally {
        hydratedFor.current = user.uid;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, setDifficulty]);

  useEffect(() => {
    if (!user || hydratedFor.current !== user.uid) return;
    void setDoc(
      doc(db, "settings", user.uid),
      { quizDifficulty: difficulty },
      { merge: true },
    ).catch(() => undefined);
  }, [user, difficulty]);
}
