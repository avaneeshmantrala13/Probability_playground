import { Link } from "react-router-dom";
import { getLesson, LESSONS, TOTAL_LESSONS } from "../content";
import { useAuth } from "../context/AuthContext";
import { useProgress } from "../context/ProgressContext";
import { isLessonUnlocked } from "../lib/mastery";
import { Brand } from "../components/Brand";
import { ChevronRightIcon } from "../components/icons";
import { FallingCards } from "../components/home/FallingCards";
import { FreePlayBanner } from "../components/dailyRewards/FreePlayBanner";

export function Home() {
  const { user } = useAuth();
  const { progress, freePlayMinutesRemaining } = useProgress();
  const name = user?.displayName ?? user?.email?.split("@")[0] ?? "Learner";

  // Where the "continue" button should go: the in-progress lesson if any,
  // otherwise the first unlocked lesson that isn't finished yet.
  const resumeLesson = progress.activeAttempt
    ? getLesson(progress.activeAttempt.lessonId)
    : null;

  const nextLesson =
    resumeLesson ??
    LESSONS.find(
      (l) =>
        isLessonUnlocked(l.lessonId, progress) &&
        !progress.completedLessons.includes(l.lessonId),
    );

  const completedCount = progress.completedLessons.length;
  const allDone = completedCount === TOTAL_LESSONS;

  const ctaLabel = resumeLesson
    ? "Pick up where you left off"
    : completedCount > 0
      ? "Continue learning"
      : "Start learning";

  return (
    <>
      <FallingCards />
      <div className="relative z-10 mx-auto max-w-3xl">
      <FreePlayBanner
        minutesRemaining={freePlayMinutesRemaining}
        streakDay={progress.streak}
      />
      <section className="pp-card relative overflow-hidden">
        {/* Subtle, theme-aware color wash blending the primary purple with the
            complementary teal accent. Very low intensity so text stays crisp. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/[0.08] via-transparent to-accent-2/[0.08]"
        />
        <div className="relative flex flex-col items-start gap-5 p-7 sm:p-9">
          <Brand size={44} />

          <div>
            <h1 className="bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent sm:text-3xl">
              Hi {name}, learn probability by doing.
            </h1>
            <p className="mt-3 max-w-xl text-secondary">
              Probability Playground teaches probability and intro statistics
              through experimentation. Run a simulation, watch the results unfold
              in real time, then answer questions and get instant feedback.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
            {nextLesson ? (
              <Link to={`/lessons/${nextLesson.lessonId}`} className="pp-btn-primary">
                {ctaLabel}
                <ChevronRightIcon size={16} />
              </Link>
            ) : (
              <Link to="/lessons" className="pp-btn-primary">
                {allDone ? "Review lessons" : "Browse lessons"}
                <ChevronRightIcon size={16} />
              </Link>
            )}
            <Link to="/lessons" className="pp-btn-secondary">
              View all lessons
            </Link>
          </div>

          {resumeLesson && (
            <p className="text-sm text-secondary">
              In progress:{" "}
              <span className="font-medium text-primary">{resumeLesson.title}</span>
            </p>
          )}
        </div>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="pp-card p-5 text-center">
          <div className="text-3xl font-bold text-accent">{progress.streak}</div>
          <div className="mt-1 text-sm text-secondary">day streak</div>
        </div>
        <div className="pp-card p-5 text-center">
          <div className="text-3xl font-bold text-accent-2">
            {completedCount}
            <span className="text-xl text-muted">/{TOTAL_LESSONS}</span>
          </div>
          <div className="mt-1 text-sm text-secondary">lessons mastered</div>
        </div>
      </div>
      </div>
    </>
  );
}
