import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useProgress } from "../../context/ProgressContext";
import { generateProblem } from "../../lib/mentalMath/generator";
import {
  DIFFICULTY_LABELS,
  MENTAL_MATH_DURATION_SEC,
  type MentalMathDifficulty,
  type MentalMathProblem,
} from "../../lib/mentalMath/types";

const VALID: MentalMathDifficulty[] = ["easy", "medium", "hard"];

function isDifficulty(v: string | undefined): v is MentalMathDifficulty {
  return VALID.includes(v as MentalMathDifficulty);
}

export function MentalMathDrill() {
  const { difficulty: raw } = useParams<{ difficulty: string }>();
  const navigate = useNavigate();
  const { recordMentalMathScore, recordCorrectAnswer } = useProgress();

  const difficulty = isDifficulty(raw) ? raw : null;

  const [phase, setPhase] = useState<"ready" | "playing" | "done">("ready");
  const [secondsLeft, setSecondsLeft] = useState(MENTAL_MATH_DURATION_SEC);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [problem, setProblem] = useState<MentalMathProblem | null>(null);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [newBest, setNewBest] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!difficulty) navigate("/mental-math", { replace: true });
  }, [difficulty, navigate]);

  const nextProblem = useCallback(() => {
    if (!difficulty) return;
    setProblem(generateProblem(difficulty));
    setInput("");
    setFeedback(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [difficulty]);

  useEffect(() => {
    if (phase !== "playing" || !difficulty) return;
    nextProblem();
  }, [phase, difficulty, nextProblem]);

  useEffect(() => {
    if (phase !== "playing") return;
    if (secondsLeft <= 0) {
      setPhase("done");
      return;
    }
    const id = window.setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [phase, secondsLeft]);

  useEffect(() => {
    if (phase !== "done" || !difficulty) return;
    const improved = recordMentalMathScore(difficulty, score);
    setNewBest(improved);
  }, [phase, difficulty, score, recordMentalMathScore]);

  function startDrill() {
    setSecondsLeft(MENTAL_MATH_DURATION_SEC);
    setScore(0);
    setAttempts(0);
    setNewBest(false);
    setPhase("playing");
  }

  function submitAnswer(e?: React.FormEvent) {
    e?.preventDefault();
    if (phase !== "playing" || !problem || feedback) return;

    const trimmed = input.trim();
    if (!trimmed) return;

    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) return;

    setAttempts((a) => a + 1);
    const correct = parsed === problem.answer;
    setFeedback(correct ? "correct" : "wrong");

    if (correct) {
      setScore((s) => s + 1);
      recordCorrectAnswer();
    }

    window.setTimeout(() => {
      if (phase === "playing") nextProblem();
    }, correct ? 120 : 280);
  }

  if (!difficulty) return null;

  if (phase === "ready") {
    return (
      <div className="mx-auto max-w-lg text-center">
        <Link to="/mental-math" className="text-sm font-semibold text-accent hover:text-accent-hover">
          ← Mental Math
        </Link>
        <div className="pp-card mt-6 p-8">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            {DIFFICULTY_LABELS[difficulty]} · {MENTAL_MATH_DURATION_SEC}s
          </p>
          <h1 className="mt-2 text-2xl font-extrabold text-primary">Ready?</h1>
          <p className="mt-3 text-secondary">
            Type each answer and press Enter. Wrong answers don&apos;t count — keep moving.
          </p>
          <button type="button" className="pp-btn-primary mt-8 w-full" onClick={startDrill}>
            Start drill
          </button>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="mx-auto max-w-lg text-center">
        <div className="pp-card p-8">
          <p className="text-4xl" aria-hidden>
            {newBest ? "🏆" : "⏱️"}
          </p>
          <h1 className="mt-4 text-2xl font-extrabold text-primary">Time&apos;s up!</h1>
          <p className="mt-2 text-secondary">
            {DIFFICULTY_LABELS[difficulty]} · {attempts} attempts
          </p>
          <p className="mt-6 text-5xl font-extrabold tabular-nums text-accent">{score}</p>
          <p className="mt-1 text-sm text-muted">correct in {MENTAL_MATH_DURATION_SEC}s</p>
          {newBest && (
            <p className="mt-4 rounded-xl bg-accent/10 px-4 py-2 text-sm font-semibold text-accent">
              New personal best!
            </p>
          )}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button type="button" className="pp-btn-primary" onClick={startDrill}>
              Play again
            </button>
            <Link to="/leaderboard?board=mental-math" className="pp-btn-secondary">
              Leaderboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const pct = (secondsLeft / MENTAL_MATH_DURATION_SEC) * 100;

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link to="/mental-math" className="text-sm font-semibold text-accent hover:text-accent-hover">
          Quit
        </Link>
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            {DIFFICULTY_LABELS[difficulty]}
          </p>
          <p className="text-2xl font-extrabold tabular-nums text-primary">{score}</p>
        </div>
        <p className="text-xl font-bold tabular-nums text-accent">{secondsLeft}s</p>
      </div>

      <div className="mb-6 h-2 overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-accent transition-all duration-1000 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="pp-card flex min-h-[220px] flex-col items-center justify-center p-8">
        {problem && (
          <>
            <p
              className={[
                "text-4xl font-extrabold tabular-nums tracking-tight sm:text-5xl",
                feedback === "correct"
                  ? "text-success"
                  : feedback === "wrong"
                    ? "text-danger"
                    : "text-primary",
              ].join(" ")}
            >
              {problem.prompt}
            </p>
            <form onSubmit={submitAnswer} className="mt-8 w-full max-w-xs">
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                className="pp-input text-center text-2xl font-bold tabular-nums"
                value={input}
                onChange={(e) => setInput(e.target.value.replace(/[^\d-]/g, ""))}
                disabled={!!feedback}
                aria-label="Your answer"
                autoFocus
              />
            </form>
            {feedback === "wrong" && (
              <p className="mt-3 text-sm font-medium text-danger">
                Answer: {problem.answer}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
