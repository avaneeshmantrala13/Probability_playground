import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_QUIZ_DIFFICULTY,
  type QuizDifficulty,
} from "../lib/poker/quizQuestions";

const STORAGE_KEY = "pp-quiz-difficulty";

interface QuizDifficultyContextValue {
  difficulty: QuizDifficulty;
  setDifficulty: (d: QuizDifficulty) => void;
}

const QuizDifficultyContext = createContext<QuizDifficultyContextValue | undefined>(
  undefined,
);

function readStoredDifficulty(): QuizDifficulty {
  if (typeof window === "undefined") return DEFAULT_QUIZ_DIFFICULTY;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "easy" || stored === "medium" || stored === "hard") return stored;
  return DEFAULT_QUIZ_DIFFICULTY;
}

export function QuizDifficultyProvider({ children }: { children: ReactNode }) {
  const [difficulty, setDifficultyState] = useState<QuizDifficulty>(readStoredDifficulty);

  const setDifficulty = useCallback((d: QuizDifficulty) => {
    setDifficultyState(d);
    try {
      window.localStorage.setItem(STORAGE_KEY, d);
    } catch {
      // Ignore storage failures (e.g. private mode).
    }
  }, []);

  const value = useMemo(
    () => ({ difficulty, setDifficulty }),
    [difficulty, setDifficulty],
  );

  return (
    <QuizDifficultyContext.Provider value={value}>
      {children}
    </QuizDifficultyContext.Provider>
  );
}

export function useQuizDifficulty(): QuizDifficultyContextValue {
  const ctx = useContext(QuizDifficultyContext);
  if (!ctx) {
    throw new Error("useQuizDifficulty must be used within QuizDifficultyProvider");
  }
  return ctx;
}
