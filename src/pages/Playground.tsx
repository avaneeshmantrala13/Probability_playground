import { Link } from "react-router-dom";
import { ChevronRightIcon, LockIcon } from "../components/icons";
import { useProgress } from "../context/ProgressContext";
import { getGameLockInfo } from "../lib/games";

interface GameCard {
  id: string;
  to: string;
  title: string;
  blurb: string;
  concept: string;
  emoji: string;
}

const GAME_CARDS: GameCard[] = [
  {
    id: "monty-hall",
    to: "/games/monty-hall",
    title: "Monty Hall: Switch or Stay",
    blurb:
      "Play the classic game show with goats and a prize, then simulate hundreds of rounds to see why switching wins.",
    concept: "Conditional probability \u00b7 law of large numbers",
    emoji: "\u{1F6AA}",
  },
  {
    id: "poker",
    to: "/games/poker",
    title: "Poker Scenario",
    blurb:
      "Sit at a cartoon casino table and predict the odds of completing a flush, a pair, and more.",
    concept: "Conditional probability \u00b7 experimental vs. theoretical",
    emoji: "\u{1F0CF}",
  },
];

export function Playground() {
  const { progress } = useProgress();

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
          Playground
        </h1>
        <p className="mt-2 max-w-xl text-secondary">
          Optional games you earn by mastering lessons. Experiment
          freely&mdash;these don&apos;t affect your lesson progress.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {GAME_CARDS.map((game) => {
          const lock = getGameLockInfo(game.id, progress);

          if (!lock.unlocked) {
            return (
              <div
                key={game.id}
                className="pp-card flex flex-col gap-4 p-6 opacity-90"
                aria-disabled
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-muted text-secondary">
                  <LockIcon size={22} />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-primary">{game.title}</h2>
                  <p className="mt-1.5 text-sm text-secondary">{game.blurb}</p>
                </div>
                <Link
                  to={lock.requiredLessonHref}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline"
                >
                  Master &ldquo;{lock.requiredLessonTitle}&rdquo; to unlock
                  <ChevronRightIcon size={16} />
                </Link>
              </div>
            );
          }

          return (
            <Link
              key={game.id}
              to={game.to}
              className="pp-card group flex flex-col gap-4 p-6 transition-colors hover:border-accent"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-muted text-2xl">
                <span aria-hidden>{game.emoji}</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-primary">{game.title}</h2>
                <p className="mt-1.5 text-sm text-secondary">{game.blurb}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted">{game.concept}</span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent">
                  Play
                  <ChevronRightIcon size={16} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
