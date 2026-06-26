import { useState } from "react";
import { OptionButton, type OptionState } from "../../lesson/OptionButton";
import { useProgress } from "../../../context/ProgressContext";
import { CheckMark, CrossMark } from "./scene/glyphs";

const OPTIONS = ["1/3", "1/2", "2/3", "3/4"];
const CORRECT = 2;

export function Reflection() {
  const { recordCorrectAnswer } = useProgress();
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;

  function choose(index: number) {
    if (answered) return;
    setSelected(index);
    if (index === CORRECT) recordCorrectAnswer();
  }

  function stateFor(index: number): OptionState {
    if (!answered) return "idle";
    if (index === CORRECT) return "correct";
    if (index === selected) return "incorrect";
    return "muted";
  }

  const isCorrect = selected === CORRECT;

  return (
    <section className="pp-card p-4 sm:p-5">
      <h2 className="text-base font-semibold text-primary">Quick check</h2>
      <p className="mt-1 text-sm text-secondary">
        Over many games, switching wins about ___ of the time.
      </p>

      <div className="mt-4 grid gap-2.5" role="radiogroup" aria-label="Switching win rate">
        {OPTIONS.map((label, i) => (
          <OptionButton
            key={label}
            index={i}
            label={label}
            state={stateFor(i)}
            disabled={answered}
            onSelect={choose}
          />
        ))}
      </div>

      {answered && (
        <div
          className={[
            "mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
            isCorrect ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
          ].join(" ")}
          role="status"
        >
          {isCorrect ? (
            <CheckMark className="h-4 w-4" />
          ) : (
            <CrossMark className="h-4 w-4" />
          )}
          {isCorrect ? "Correct — it's 2/3." : "Not quite — run the auto-simulation to see."}
          {!isCorrect && (
            <button
              type="button"
              className="ml-1 underline underline-offset-2"
              onClick={() => setSelected(null)}
            >
              Try again
            </button>
          )}
        </div>
      )}
    </section>
  );
}
