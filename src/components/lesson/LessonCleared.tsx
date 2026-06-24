import { Link } from "react-router-dom";
import { getNextLesson } from "../../content";
import type { Lesson } from "../../content/types";
import { useProgress, type AttemptResult } from "../../context/ProgressContext";
import { GAMES } from "../../lib/games";
import { earnedBadges } from "../../lib/badges";
import { CheckIcon, ChevronRightIcon, TrophyIcon } from "../icons";
import { Confetti } from "./Confetti";

/** Celebration screen shown when a lesson is passed (mastered). */
export function LessonCleared({
  lesson,
  result,
  previouslyEarned,
}: {
  lesson: Lesson;
  result: AttemptResult;
  /** Badge ids earned before this attempt, used to highlight new ones. */
  previouslyEarned?: Set<string>;
}) {
  const { progress } = useProgress();
  const next = getNextLesson(lesson.lessonId);
  const unlockedGames = GAMES.filter((g) => g.requiredLessonId === lesson.lessonId);
  const newBadges = earnedBadges(progress).filter(
    (b) => !(previouslyEarned?.has(b.id) ?? false),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="pp-anim-fade-in absolute inset-0 bg-bg/80 backdrop-blur-sm" />
      <Confetti />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Lesson mastered"
        className="pp-anim-dialog-pop pp-card relative z-10 w-full max-w-md p-8 text-center"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success">
          <CheckIcon size={32} />
        </div>

        <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-primary">
          Lesson mastered!
        </h1>
        <p className="mt-2 text-secondary">
          You scored{" "}
          <span className="font-semibold text-primary">{result.scorePercent}%</span>{" "}
          ({result.correct} of {result.total} correct) on{" "}
          <span className="font-medium text-primary">{lesson.title}</span>.
        </p>

        {unlockedGames.length > 0 && (
          <div className="mt-5 rounded-xl border border-accent/30 bg-accent/10 p-4 text-left">
            <p className="text-sm font-semibold text-primary">
              {unlockedGames.length > 1 ? "New games unlocked!" : "New game unlocked!"}
            </p>
            <p className="mt-0.5 text-sm text-secondary">
              Mastering this lesson earned you{" "}
              {unlockedGames.map((g, i) => (
                <span key={g.id}>
                  {i > 0 && (i === unlockedGames.length - 1 ? " and " : ", ")}
                  <span className="font-medium text-primary">{g.title}</span>
                </span>
              ))}
              .
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {unlockedGames.map((g) => (
                <Link
                  key={g.id}
                  to={g.route}
                  className="inline-flex items-center justify-center gap-1 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-contrast hover:bg-accent-hover"
                >
                  Play {g.title}
                  <ChevronRightIcon size={15} />
                </Link>
              ))}
            </div>
          </div>
        )}

        {newBadges.length > 0 && (
          <div className="mt-5 rounded-xl border border-success/30 bg-success-soft/60 p-4 text-left">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-primary">
              <TrophyIcon size={16} className="text-success" />
              {newBadges.length > 1 ? "New badges earned!" : "New badge earned!"}
            </p>
            <ul className="mt-1.5 space-y-1">
              {newBadges.map((b) => (
                <li key={b.id} className="text-sm text-secondary">
                  <span className="font-medium text-primary">{b.title}</span> —{" "}
                  {b.description}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          {next ? (
            <Link to={`/lessons/${next.lessonId}`} className="pp-btn-primary">
              Start {next.title}
              <ChevronRightIcon size={16} />
            </Link>
          ) : (
            <Link to="/lessons" className="pp-btn-primary">
              Back to lessons
            </Link>
          )}
          <Link to="/badges" className="pp-btn-secondary">
            View your badges
          </Link>
          <Link to="/lessons" className="pp-btn-secondary">
            All lessons
          </Link>
        </div>
      </div>
    </div>
  );
}
