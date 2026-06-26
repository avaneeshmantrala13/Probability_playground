import { useCallback, useEffect, useRef, useState } from "react";
import { useQuizDifficulty } from "../../context/QuizDifficultyContext";
import {
  detectQuizGate,
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
  const prevStateRef = useRef<GameState | null>(null);
  const handRef = useRef(state.handNumber);
  const resultsHandRef = useRef(state.handNumber);
  const usedQuestionIds = useRef<Set<string>>(new Set());
  const resultsRef = useRef(results);
  resultsRef.current = results;

  useEffect(() => {
    if (state.handNumber === handRef.current) return;
    handRef.current = state.handNumber;
    resultsHandRef.current = state.handNumber;
    usedQuestionIds.current = new Set();
    // Clear synchronously so the gate-detection effect in the same commit
    // does not treat the previous hand's hole/flop/turn/river results as current.
    resultsRef.current = {};
    setResults({});
    setActiveGate(null);
    prevStateRef.current = null;
  }, [state.handNumber]);

  const resolveGate = useCallback(
    (selectedIndex: number | null) => {
      setActiveGate((current) => {
        if (!current) return null;
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
    if (!enabled) return;
    const viewer = state.seats[viewerSeatIndex];
    if (!viewer || viewer.status === "out") {
      prevStateRef.current = state;
      return;
    }
    const gate = detectQuizGate(prevStateRef.current, state, viewerSeatIndex);
    prevStateRef.current = state;
    const handResults =
      resultsHandRef.current === state.handNumber ? resultsRef.current : {};
    if (!gate || handResults[gate] !== undefined) return;
    const question = pickQuizQuestion(
      state.handNumber,
      gate,
      usedQuestionIds.current,
      difficulty,
    );
    usedQuestionIds.current.add(question.id);
    const pending = { ...handResults, [gate]: "pending" as const };
    resultsHandRef.current = state.handNumber;
    resultsRef.current = pending;
    setResults(pending);
    setActiveGate({ gate, question });
  }, [state, viewerSeatIndex, enabled, difficulty]);

  return { results, activeGate, resolveGate };
}

export { QUIZ_GATE_TIMEOUT_MS };
