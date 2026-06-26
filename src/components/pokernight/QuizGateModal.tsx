import { useCallback, useEffect, useRef, useState } from "react";
import type { ServedQuestion } from "../../lib/comeback";
import {
  QUIZ_GATE_LABELS,
  QUIZ_GATE_TIMEOUT_MS,
  type QuizGateId,
} from "../../lib/poker/quizGate";

interface QuizGateModalProps {
  gate: QuizGateId;
  question: ServedQuestion;
  onResolve: (selectedIndex: number | null) => void;
}

export function QuizGateModal({ gate, question, onResolve }: QuizGateModalProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(QUIZ_GATE_TIMEOUT_MS / 1000));
  const resolvedRef = useRef(false);

  const finish = useCallback(
    (index: number | null) => {
      if (resolvedRef.current) return;
      resolvedRef.current = true;
      onResolve(index);
    },
    [onResolve],
  );

  useEffect(() => {
    const deadline = Date.now() + QUIZ_GATE_TIMEOUT_MS;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) finish(null);
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [finish]);

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
          <span className={`font-mono text-lg font-bold tabular-nums ${urgency}`} aria-live="polite">
            {secondsLeft}s
          </span>
        </div>
        <h2 id="quiz-gate-title" className="text-lg font-semibold leading-snug text-primary">
          {question.prompt}
        </h2>
        <ul className="mt-4 space-y-2">
          {question.options.map((option, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => {
                  setSelected(i);
                  finish(i);
                }}
                className={[
                  "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                  selected === i
                    ? "border-accent bg-surface-muted text-primary"
                    : "border-subtle bg-surface text-primary hover:border-accent/60",
                ].join(" ")}
              >
                <span
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-subtle text-xs font-bold text-secondary"
                  aria-hidden
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{option}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-center text-xs text-muted">
          Answer in time to see the cards — wrong or timeout hides them for you only.
        </p>
      </div>
    </div>
  );
}
