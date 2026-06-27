import { useState } from "react";
import { Link } from "react-router-dom";
import {
  POKER_THEORY_LESSONS,
  TOTAL_POKER_THEORY_LESSONS,
} from "../content/pokerTheory";
import type { Lesson } from "../content/pokerTheory/types";
import { useProgress } from "../context/ProgressContext";
import { isPokerTheoryLessonUnlocked } from "../content/pokerTheory/mastery";
import { ProgressBar } from "../components/lesson/ProgressBar";
import { IntroModal } from "../components/lesson/IntroModal";
import { BookIcon, CheckIcon, ChevronRightIcon, LockIcon, SpadeIcon } from "../components/icons";

export function PokerTheory() {
  const { progress } = useProgress();
  const completedCount = POKER_THEORY_LESSONS.filter((l) =>
    progress.completedLessons.includes(l.lessonId),
  ).length;
  const [introLesson, setIntroLesson] = useState<Lesson | null>(null);

  return (
    <div>
      <header className="mb-6">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-secondary">
          <SpadeIcon size={14} className="text-accent" />
          Theory course
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
          Poker Theory
        </h1>
        <p className="mt-2 max-w-xl text-secondary">
          Master the strategic foundations of Texas Hold&apos;em — from hand
          rankings and position to pot odds, ranges, and reading opponents.
          Score 80% to unlock the next lesson, or pass the placement quiz to
          skip ahead.
        </p>
        <div className="mt-5 max-w-md">
          <ProgressBar
            current={completedCount}
            total={TOTAL_POKER_THEORY_LESSONS}
            label="Course progress"
          />
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {POKER_THEORY_LESSONS.map((lesson) => {
          const completed = progress.completedLessons.includes(lesson.lessonId);
          const mastery = progress.lessonMastery[lesson.lessonId];
          const unlocked = isPokerTheoryLessonUnlocked(lesson.lessonId, progress);

          const inner = (
            <>
              <div className="flex items-start justify-between gap-3">
                <span
                  className={[
                    "inline-flex h-10 w-10 items-center justify-center rounded-xl",
                    unlocked ? "bg-surface-muted text-accent" : "bg-surface-muted text-muted",
                  ].join(" ")}
                >
                  {!unlocked ? (
                    <LockIcon size={18} />
                  ) : completed ? (
                    <CheckIcon size={20} />
                  ) : (
                    <BookIcon size={20} />
                  )}
                </span>
                <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-secondary">
                  Lesson {lesson.order}
                </span>
              </div>
              <h2 className="mt-4 text-lg font-semibold text-primary">{lesson.title}</h2>
              {lesson.subtitle && (
                <p className="mt-1 text-sm text-secondary">{lesson.subtitle}</p>
              )}
              <div className="mt-4 flex items-center justify-between text-sm text-secondary">
                <span>
                  {mastery
                    ? `Best ${mastery.bestScore}%`
                    : `${lesson.questions.length} questions`}
                </span>
                <span
                  className={[
                    "inline-flex items-center gap-1 font-medium",
                    unlocked ? "text-accent" : "text-muted",
                  ].join(" ")}
                >
                  {!unlocked ? "Locked" : completed ? "Review" : "Start"}
                  {unlocked && <ChevronRightIcon size={16} />}
                </span>
              </div>
              {unlocked && lesson.intro && lesson.intro.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIntroLesson(lesson);
                  }}
                  className="mt-3 self-start text-xs font-medium text-secondary hover:text-primary hover:underline"
                >
                  Read intro
                </button>
              )}
            </>
          );

          if (!unlocked) {
            return (
              <div
                key={lesson.lessonId}
                aria-disabled="true"
                className="pp-card flex cursor-not-allowed flex-col p-5 opacity-60"
                title="Pass the previous lesson to unlock"
              >
                {inner}
              </div>
            );
          }

          return (
            <Link
              key={lesson.lessonId}
              to={`/poker-theory/${lesson.lessonId}`}
              className="pp-card group flex flex-col p-5 transition-colors hover:border-accent/60"
            >
              {inner}
            </Link>
          );
        })}
      </div>

      {introLesson && (
        <IntroModal lesson={introLesson} onClose={() => setIntroLesson(null)} />
      )}
    </div>
  );
}
