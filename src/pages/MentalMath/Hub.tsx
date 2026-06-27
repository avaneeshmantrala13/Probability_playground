import { Link } from "react-router-dom";
import { useProgress } from "../../context/ProgressContext";
import {
  DIFFICULTY_HINTS,
  DIFFICULTY_LABELS,
  type MentalMathDifficulty,
} from "../../lib/mentalMath/types";
import { emptyMentalMathScores } from "../../lib/mentalMath/types";

const MODES: MentalMathDifficulty[] = ["easy", "medium", "hard"];

const MODE_STYLES: Record<MentalMathDifficulty, string> = {
  easy: "from-emerald-500/15 to-teal-500/10 border-emerald-500/30",
  medium: "from-amber-500/15 to-orange-500/10 border-amber-500/30",
  hard: "from-rose-500/15 to-red-500/10 border-rose-500/30",
};

export function MentalMathHub() {
  const { progress } = useProgress();
  const best = progress.mentalMathBest ?? emptyMentalMathScores();

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
          Mental Math
        </h1>
        <p className="mt-2 max-w-2xl text-secondary">
          Speed drills inspired by Zetamac and RankYourBrain — two minutes, as many
          correct answers as you can. Build the arithmetic fluency quant interviews
          expect.
        </p>
        <Link
          to="/leaderboard?board=mental-math"
          className="mt-4 inline-flex text-sm font-semibold text-accent hover:text-accent-hover"
        >
          View mental math leaderboard →
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {MODES.map((mode) => (
          <Link
            key={mode}
            to={`/mental-math/play/${mode}`}
            className={[
              "pp-card group relative overflow-hidden border bg-gradient-to-br p-5 transition-transform hover:-translate-y-0.5",
              MODE_STYLES[mode],
            ].join(" ")}
          >
            <p className="text-xs font-bold uppercase tracking-wide text-muted">
              {DIFFICULTY_LABELS[mode]}
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-primary">
              {mode === "easy" ? "Warm up" : mode === "medium" ? "Interview prep" : "Beast mode"}
            </h2>
            <p className="mt-2 text-sm text-secondary">{DIFFICULTY_HINTS[mode]}</p>
            <p className="mt-4 text-sm font-semibold text-primary">
              Personal best:{" "}
              <span className="text-accent">{best[mode] || "—"}</span>
            </p>
            <span className="mt-4 inline-flex text-sm font-semibold text-accent group-hover:underline">
              Start drill →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
