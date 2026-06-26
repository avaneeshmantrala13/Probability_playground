import { useCallback, useEffect, useRef, useState } from "react";
import { useQuizDifficulty } from "../../context/QuizDifficultyContext";
import {
  getNextQuizGate,
  pickQuizQuestion,
  QUIZ_GATE_TIMEOUT_MS,
  type QuizGateId,
  type QuizGateResults,
} from "../../lib/poker/quizGate";
import type { GameState } from "../../lib/poker";
import type { ServedQuestion } from "../../lib/comeback";

export interface ActiveQuizGate {
  gate: QuizGateId;
  question: ServedQuestion;
}

export interface UseQuizGatesOpts {
  state: GameState;
  viewerSeatIndex: number;
  enabled: boolean;
  lives?: number;
  onConsumeLife?: () => void;
}

export function useQuizGates(opts: UseQuizGatesOpts) {
  const { state, viewerSeatIndex, enabled, lives = 0, onConsumeLife } = opts;
  const { difficulty } = useQuizDifficulty();
  const [results, setResults] = useState<QuizGateResults>({});
  const [activeGate, setActiveGate] = useState<ActiveQuizGate | null>(null);
  const handRef = useRef(state.handNumber);
  const resultsHandRef = useRef(state.handNumber);
  const usedQuestionIds = useRef<Set<string>>(new Set());
  const resultsRef = useRef(results);
  const activeGateRef = useRef(activeGate);
  resultsRef.current = results;
  activeGateRef.current = activeGate;

  useEffect(() => {
    if (state.handNumber === handRef.current) return;
    handRef.current = state.handNumber;
    resultsHandRef.current = state.handNumber;
    usedQuestionIds.current = new Set();
    resultsRef.current = {};
    setResults({});
    setActiveGate(null);
  }, [state.handNumber]);

  const resolveGate = useCallback(
    (resolvedGate: QuizGateId, selectedIndex: number | null) => {
      setActiveGate((current) => {
        if (!current || current.gate !== resolvedGate) return current;
        const { gate, question } = current;
        const passed =
          selectedIndex !== null && selectedIndex === question.correctIndex;
        if (!passed && lives > 0) onConsumeLife?.();
        setResults((prev) => {
          const next = { ...prev, [gate]: { passed, selectedIndex } };
          resultsRef.current = next;
          return next;
        });
        return null;
      });
    },
    [lives, onConsumeLife],
  );

  useEffect(() => {
    if (!enabled || activeGateRef.current) return;
    const viewer = state.seats[viewerSeatIndex];
    if (!viewer || viewer.status === "out") return;

    const handResults =
      resultsHandRef.current === state.handNumber ? resultsRef.current : {};
    const gate = getNextQuizGate(state, viewerSeatIndex, handResults);
    if (!gate) return;

    const question = pickQuizQuestion(
      state.handNumber,
      gate,
      usedQuestionIds.current,
      difficulty,
    );
    usedQuestionIds.current.add(question.id);
    setActiveGate({ gate, question });
  }, [state, viewerSeatIndex, enabled, difficulty, activeGate]);

  return { results, activeGate, resolveGate };
}

export { QUIZ_GATE_TIMEOUT_MS };
