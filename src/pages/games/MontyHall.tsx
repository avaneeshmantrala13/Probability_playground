import { Link } from "react-router-dom";
import "../../components/games/montyhall/montyhall.css";
import { GameStage } from "../../components/games/montyhall/GameStage";
import { StatsPanel } from "../../components/games/montyhall/StatsPanel";
import { AutoSimulate } from "../../components/games/montyhall/AutoSimulate";
import { Reflection } from "../../components/games/montyhall/Reflection";
import { useMontyHallStats } from "../../components/games/montyhall/useMontyHallStats";
import { useReducedMotion } from "../../components/games/montyhall/useReducedMotion";
import { useProgress } from "../../context/ProgressContext";
import { getGameLockInfo } from "../../lib/games";
import { LockIcon } from "../../components/icons";

export function MontyHall() {
  const { progress, loading } = useProgress();

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <p className="text-center text-muted">Loading…</p>
      </div>
    );
  }

  const lock = getGameLockInfo("monty-hall", progress);

  if (!lock.unlocked) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="pp-card p-8 text-center">
          <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-surface-muted text-secondary">
            <LockIcon size={28} />
          </span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
            Monty Hall is locked
          </h1>
          <p className="mx-auto mt-2 max-w-md text-secondary">
            Master {lock.requiredLessonTitle} to unlock this game.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
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

  return <MontyHallGame />;
}

function MontyHallGame() {
  const reduced = useReducedMotion();
  const { stats, record, reset } = useMontyHallStats();

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
          Monty Hall — Switch or Stay
        </h1>
        <p className="mt-2 max-w-2xl text-secondary">
          Pick a door, watch the host reveal a goat, then decide whether to
          switch or stay — and simulate thousands of games to compare strategies.
        </p>
      </header>

      <div className="space-y-5">
        <GameStage reduced={reduced} onRecord={record} />
        <StatsPanel stats={stats} onReset={reset} />
        <AutoSimulate />
        <Reflection />
      </div>
    </div>
  );
}
