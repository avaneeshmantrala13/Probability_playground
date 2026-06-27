import { useState } from "react";
import { Link } from "react-router-dom";
import {
  MARKET_MAKING_LESSONS,
  TOTAL_MARKET_MAKING_LESSONS,
} from "../content/marketMakingLessons";
import type { Lesson } from "../content/types";
import { useProgress } from "../context/ProgressContext";
import { isMarketMakingLessonUnlocked } from "../content/marketMakingLessons/mastery";
import { ProgressBar } from "../components/lesson/ProgressBar";
import { IntroModal } from "../components/lesson/IntroModal";
import { BookIcon, ChartIcon, CheckIcon, ChevronRightIcon, LockIcon } from "../components/icons";

export function MarketMakingLessons() {
  const { progress } = useProgress();
  const completedCount = MARKET_MAKING_LESSONS.filter((l) =>
    progress.completedLessons.includes(l.lessonId),
  ).length;
  const [introLesson, setIntroLesson] = useState<Lesson | null>(null);

  return (
    <div>
      <header className="mb-6">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-secondary">
          <ChartIcon size={14} className="text-emerald-500" />
          Market making course
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
          Market Making Lessons
        </h1>
        <p className="mt-2 max-w-xl text-secondary">
          Learn two-sided quoting from first principles — bid/ask, spread, fair
          value, inventory skew, and interview-style puzzles. Score 80% to unlock
          the next lesson.
        </p>
        <Link
          to="/resources?track=market-making"
          className="mt-3 inline-flex text-sm font-medium text-accent hover:underline"
        >
          Browse market-making resources (Jane Street guide, Harris book…) →
        </Link>
        <div className="mt-5 max-w-md">
          <ProgressBar
            current={completedCount}
            total={TOTAL_MARKET_MAKING_LESSONS}
            label="Course progress"
          />
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {MARKET_MAKING_LESSONS.map((lesson) => {
          const completed = progress.completedLessons.includes(lesson.lessonId);
          const mastery = progress.lessonMastery[lesson.lessonId];
          const unlocked = isMarketMakingLessonUnlocked(lesson.lessonId, progress);

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
              to={`/market-making/lessons/${lesson.lessonId}`}
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
