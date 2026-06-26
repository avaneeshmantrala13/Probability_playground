import { useQuizDifficulty } from "../../context/QuizDifficultyContext";
import {
  QUIZ_DIFFICULTY_LABELS,
  type QuizDifficulty,
} from "../../lib/poker/quizQuestions";

const OPTIONS: QuizDifficulty[] = ["easy", "medium", "hard"];

interface QuizDifficultyPickerProps {
  /** Compact layout for lobby; full cards on settings page. */
  compact?: boolean;
}

export function QuizDifficultyPicker({ compact = false }: QuizDifficultyPickerProps) {
  const { difficulty, setDifficulty } = useQuizDifficulty();

  if (compact) {
    return (
      <div className="pp-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">Quiz difficulty</p>
            <p className="text-xs text-secondary">
              Answer before each reveal — {QUIZ_DIFFICULTY_LABELS[difficulty].hint.toLowerCase()}
            </p>
          </div>
          <div
            className="inline-flex rounded-xl border border-subtle bg-surface p-1"
            role="radiogroup"
            aria-label="Quiz difficulty"
          >
            {OPTIONS.map((opt) => {
              const active = difficulty === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setDifficulty(opt)}
                  className={[
                    "rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                    active
                      ? "bg-accent text-white"
                      : "text-secondary hover:bg-surface-muted hover:text-primary",
                  ].join(" ")}
                >
                  {QUIZ_DIFFICULTY_LABELS[opt].label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="grid gap-3 sm:grid-cols-3"
      role="radiogroup"
      aria-label="Quiz difficulty"
    >
      {OPTIONS.map((opt) => {
        const active = difficulty === opt;
        const meta = QUIZ_DIFFICULTY_LABELS[opt];
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setDifficulty(opt)}
            className={[
              "flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-colors",
              active ? "border-accent bg-surface-muted" : "border-subtle hover:border-accent/60",
            ].join(" ")}
          >
            <span className="font-medium text-primary">{meta.label}</span>
            <span className="text-xs text-secondary">{meta.hint}</span>
          </button>
        );
      })}
    </div>
  );
}
