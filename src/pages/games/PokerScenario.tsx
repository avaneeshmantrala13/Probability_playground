import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useProgress } from "../../context/ProgressContext";
import { getGameLockInfo } from "../../lib/games";
import { LockIcon } from "../../components/icons";
import { OptionButton, type OptionState } from "../../components/lesson/OptionButton";
import { Stat, StatGrid } from "../../components/simulations/ui";
import { RunningLineChart } from "../../components/simulations/charts";
import { CasinoScene } from "../../components/games/poker/CasinoScene";
import { SCENARIOS } from "../../components/games/poker/scenarios";
import {
  exactProbability,
  formatPct,
  monteCarlo,
  type MonteCarloResult,
} from "../../components/games/poker/deck";
import "../../components/games/poker/poker.css";

const BEST_KEY = "pp-poker-best";
const MC_DRAWS = 6000;

function loadBest(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(BEST_KEY);
  const n = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function shuffleOrder(): number[] {
  const order = SCENARIOS.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

function CheckIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrossIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M18 6 6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PokerScenarioGame() {
  const { recordCorrectAnswer } = useProgress();
  const [order, setOrder] = useState<number[]>(shuffleOrder);
  const [pointer, setPointer] = useState(0);
  const [dealKey, setDealKey] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [best, setBest] = useState<number>(loadBest);
  const [mc, setMc] = useState<MonteCarloResult | null>(null);

  const scenario = SCENARIOS[order[pointer]];
  const known = useMemo(
    () => [...scenario.hole, ...scenario.community],
    [scenario],
  );
  const exact = useMemo(
    () => exactProbability(known, scenario.predicate),
    [known, scenario],
  );

  const revealed = selected !== null;
  const isCorrect = revealed && selected === scenario.correct;

  const handleSelect = useCallback(
    (index: number) => {
      if (selected !== null) return;
      setSelected(index);
      setMc(monteCarlo(known, scenario.predicate, MC_DRAWS));
      setAnswered((a) => a + 1);
      if (index === scenario.correct) {
        recordCorrectAnswer();
        setScore((prev) => {
          const next = prev + 1;
          if (next > best) {
            setBest(next);
            window.localStorage.setItem(BEST_KEY, String(next));
          }
          return next;
        });
      }
    },
    [selected, known, scenario, best, recordCorrectAnswer],
  );

  const handleNext = useCallback(() => {
    setSelected(null);
    setMc(null);
    setDealKey((k) => k + 1);
    setPointer((p) => {
      const next = p + 1;
      if (next >= order.length) {
        setOrder(shuffleOrder());
        return 0;
      }
      return next;
    });
  }, [order.length]);

  const optionState = (index: number): OptionState => {
    if (!revealed) return "idle";
    if (index === scenario.correct) return "correct";
    if (index === selected) return "incorrect";
    return "muted";
  };

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">
          Poker Scenario
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
          Guess the odds at the felt
        </h1>
        <p className="mt-2 text-secondary">
          Read each hand, pick the probability that the next card hits, then watch
          a simulation race toward the exact answer.
        </p>
      </header>

      <StatGrid>
        <Stat label="This session" value={score} accent />
        <Stat label="Hands played" value={answered} />
        <Stat label="Personal best" value={best} />
        <Stat label="Hand" value={`${pointer + 1} / ${order.length}`} />
      </StatGrid>

      <div className="mt-4">
        <CasinoScene
          hole={scenario.hole}
          community={scenario.community}
          dealKey={dealKey}
        />
      </div>

      <section className="pp-card mt-4 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {scenario.title}
        </p>
        <h2 className="mt-1.5 text-lg font-semibold text-primary">
          {scenario.question}
        </h2>

        <div
          className="mt-4 flex flex-col gap-2.5"
          role="radiogroup"
          aria-label="Probability options"
        >
          {scenario.options.map((option, index) => (
            <OptionButton
              key={`${scenario.id}-${index}`}
              index={index}
              label={option}
              state={optionState(index)}
              disabled={revealed}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </section>

      {revealed && mc && (
        <section className="pp-card poker-pop mt-4 p-5 sm:p-6">
          <div
            className={[
              "flex items-center gap-2.5 rounded-xl border p-3.5",
              isCorrect
                ? "border-success bg-success-soft text-success"
                : "border-danger bg-danger-soft text-danger",
            ].join(" ")}
          >
            <span className="flex-shrink-0">
              {isCorrect ? <CheckIcon /> : <CrossIcon />}
            </span>
            <p className="text-sm font-semibold">
              {isCorrect
                ? "Correct! Your read matches the math."
                : `Not quite. The exact probability is ${scenario.options[scenario.correct]}.`}
            </p>
          </div>

          <div className="mt-4">
            <StatGrid>
              <Stat label="Exact (theory)" value={formatPct(exact.probability)} accent />
              <Stat label="Simulated" value={formatPct(mc.empirical)} />
              <Stat
                label="Favorable cards"
                value={`${exact.favorable} / ${exact.total}`}
              />
              <Stat label="Draws simulated" value={mc.draws.toLocaleString()} />
            </StatGrid>
          </div>

          <div className="mt-4 rounded-xl border border-subtle bg-surface p-3 sm:p-4">
            <p className="mb-2 text-sm font-medium text-secondary">
              Simulated probability converging to the exact value (dashed line)
            </p>
            <RunningLineChart
              data={mc.running}
              target={exact.probability}
              yLabel="P(next card)"
            />
          </div>

          <div className="mt-4 flex justify-end">
            <button type="button" className="pp-btn-primary" onClick={handleNext}>
              Next hand
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export function PokerScenario() {
  const { progress, loading } = useProgress();
  const lock = getGameLockInfo("poker", progress);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <p className="text-center text-secondary">Loading…</p>
      </div>
    );
  }

  if (!lock.unlocked) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="pp-card flex flex-col items-center p-8 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-muted text-secondary">
            <LockIcon size={28} />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-primary">
            Poker Scenario is locked
          </h1>
          <p className="mt-2 max-w-md text-secondary">
            Master {lock.requiredLessonTitle} to unlock this game.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
            <Link to={lock.requiredLessonHref} className="pp-btn-primary">
              Go to {lock.requiredLessonTitle}
            </Link>
            <Link to="/playground" className="pp-btn-secondary">
              Back to Playground
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <PokerScenarioGame />;
}
