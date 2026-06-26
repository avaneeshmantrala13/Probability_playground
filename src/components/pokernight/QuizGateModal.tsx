import { useCallback, useEffect, useRef, useState } from "react";
import type { ServedQuestion } from "../../lib/comeback";
import {
  QUIZ_GATE_FEEDBACK_MS,
  QUIZ_GATE_LABELS,
  QUIZ_GATE_TIMEOUT_MS,
  type QuizGateId,
} from "../../lib/poker/quizGate";
import { CheckIcon, XIcon } from "../icons";

interface QuizGateModalProps {
  gate: QuizGateId;
  question: ServedQuestion;
  onResolve: (gate: QuizGateId, selectedIndex: number | null) => void;
}

export function QuizGateModal({ gate, question, onResolve }: QuizGateModalProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(QUIZ_GATE_TIMEOUT_MS / 1000));
  const resolvedRef = useRef(false);
  const feedbackTimerRef = useRef<number | null>(null);

  const isCorrect =
    showFeedback && selected !== null && selected === question.correctIndex;

  const finish = useCallback(
    (index: number | null) => {
      if (resolvedRef.current) return;
      resolvedRef.current = true;
      onResolve(gate, index);
    },
    [gate, onResolve],
  );

  const handleSelect = useCallback(
    (index: number) => {
      if (resolvedRef.current || showFeedback) return;
      setSelected(index);
      setShowFeedback(true);
      feedbackTimerRef.current = window.setTimeout(
        () => finish(index),
        QUIZ_GATE_FEEDBACK_MS,
      );
    },
    [finish, showFeedback],
  );

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (showFeedback) return;
    const deadline = Date.now() + QUIZ_GATE_TIMEOUT_MS;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) finish(null);
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [finish, showFeedback]);

  const urgency =
    secondsLeft <= 3 ? "text-danger" : secondsLeft <= 5 ? "text-amber-600" : "text-accent";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-gate-title"
    >
      <div className="pp-card w-full max-w-lg p-5 shadow-xl sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-secondary">
            Before {QUIZ_GATE_LABELS[gate]}
          </span>
          {!showFeedback && (
            <span
              className={`font-mono text-lg font-bold tabular-nums ${urgency}`}
              aria-live="polite"
            >
              {secondsLeft}s
            </span>
          )}
        </div>
        <h2 id="quiz-gate-title" className="text-lg font-semibold leading-snug text-primary">
          {question.prompt}
        </h2>
        <ul className="mt-4 space-y-2">
          {question.options.map((option, i) => {
            const isThisCorrect = i === question.correctIndex;
            const isThisSelected = i === selected;

            let stateClass =
              "border-subtle bg-surface text-primary hover:border-accent/60";
            if (showFeedback) {
              if (isThisCorrect) {
                stateClass = "border-success bg-success-soft text-primary";
              } else if (isThisSelected) {
                stateClass = "border-danger bg-danger-soft text-primary";
              } else {
                stateClass = "border-subtle bg-surface text-muted opacity-70";
              }
            } else if (isThisSelected) {
              stateClass = "border-accent bg-surface-muted text-primary";
            }

            return (
              <li key={i}>
                <button
                  type="button"
                  disabled={showFeedback}
                  onClick={() => handleSelect(i)}
                  className={[
                    "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                    stateClass,
                    showFeedback ? "cursor-default" : "cursor-pointer",
                  ].join(" ")}
                  aria-pressed={isThisSelected}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={[
                        "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-bold",
                        isThisSelected && !showFeedback
                          ? "border-accent text-accent"
                          : "border-subtle text-secondary",
                      ].join(" ")}
                      aria-hidden
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span>{option}</span>
                  </span>
                  {showFeedback && isThisCorrect && (
                    <CheckIcon size={18} className="shrink-0 text-success" />
                  )}
                  {showFeedback && isThisSelected && !isThisCorrect && (
                    <XIcon size={18} className="shrink-0 text-danger" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {showFeedback && (
          <div
            className={[
              "mt-4 rounded-xl border p-4 text-sm",
              isCorrect
                ? "border-success bg-success-soft"
                : "border-danger bg-danger-soft",
            ].join(" ")}
          >
            <p className="font-semibold text-primary">
              {isCorrect ? "Correct!" : "Not quite."}
            </p>
            <p className="mt-1 text-secondary">{question.explanation}</p>
          </div>
        )}

        <p className="mt-4 text-center text-xs text-muted">
          {showFeedback
            ? "Revealing cards…"
            : "Answer in time to see the cards — wrong or timeout hides them for you only."}
        </p>
      </div>
    </div>
  );
}
