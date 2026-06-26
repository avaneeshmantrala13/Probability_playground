import { useMemo, useState } from "react";
import type { ServedQuestion } from "../../lib/comeback";
import { useProgress } from "../../context/ProgressContext";
import { CheckIcon, XIcon } from "../icons";
import "./comeback.css";

interface ComebackQuizProps {
  questions: ServedQuestion[];
  /** Called once the final question has been answered + reviewed. */
  onComplete: (correct: number, total: number) => void;
}

/**
 * A self-contained multiple-choice quiz for the Comeback Challenge. It does not
 * depend on the lesson player: it tracks its own selection/score state, shows
 * immediate correctness feedback with an explanation, and reports the final
 * tally via `onComplete`.
 */
export function ComebackQuiz({ questions, onComplete }: ComebackQuizProps) {
  const { recordCorrectAnswer } = useProgress();
  const total = questions.length;
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const question = questions[index];
  const isLast = index === total - 1;
  const isCorrect = checked && selected === question.correctIndex;

  const progressPct = useMemo(
    () => Math.round((index / total) * 100),
    [index, total],
  );

  function check() {
    if (selected === null || checked) return;
    setChecked(true);
    if (selected === question.correctIndex) {
      recordCorrectAnswer();
      setCorrectCount((c) => c + 1);
    }
  }

  function next() {
    if (isLast) {
      onComplete(correctCount, total);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setChecked(false);
  }

  return (
    <div className="pp-card p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-secondary">
          Question <span className="text-primary">{index + 1}</span> of {total}
        </span>
        <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-accent">
          {correctCount} correct
        </span>
      </div>

      <div
        className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPct}
        aria-label="Challenge progress"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <h2 className="text-lg font-semibold leading-snug text-primary">
        {question.prompt}
      </h2>

      <ul className="mt-4 space-y-2.5">
        {question.options.map((option, i) => {
          const isThisCorrect = i === question.correctIndex;
          const isThisSelected = i === selected;

          let stateClass =
            "border-subtle bg-surface hover:border-accent/60 text-primary";
          let anim = "";
          if (checked) {
            if (isThisCorrect) {
              stateClass =
                "border-success bg-success-soft text-primary cb-option-correct";
              anim = "cb-option-correct";
            } else if (isThisSelected) {
              stateClass = "border-danger bg-danger-soft text-primary";
              anim = "cb-option-wrong";
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
                disabled={checked}
                onClick={() => setSelected(i)}
                className={[
                  "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                  stateClass,
                  anim,
                  checked ? "cursor-default" : "cursor-pointer",
                ].join(" ")}
                aria-pressed={isThisSelected}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={[
                      "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-bold",
                      isThisSelected && !checked
                        ? "border-accent text-accent"
                        : "border-subtle text-secondary",
                    ].join(" ")}
                    aria-hidden
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span>{option}</span>
                </span>
                {checked && isThisCorrect && (
                  <CheckIcon size={18} className="shrink-0 text-success" />
                )}
                {checked && isThisSelected && !isThisCorrect && (
                  <XIcon size={18} className="shrink-0 text-danger" />
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {checked && (
        <div
          className={[
            "cb-feedback mt-4 rounded-xl border p-4 text-sm",
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

      <div className="mt-6 flex justify-end">
        {!checked ? (
          <button
            type="button"
            className="pp-btn-primary"
            disabled={selected === null}
            onClick={check}
          >
            Check answer
          </button>
        ) : (
          <button type="button" className="pp-btn-primary" onClick={next}>
            {isLast ? "See results" : "Next question"}
          </button>
        )}
      </div>
    </div>
  );
}
