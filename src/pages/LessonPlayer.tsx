import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { getLesson } from "../content";
import type { Lesson } from "../content/types";
import { useProgress, type AttemptResult } from "../context/ProgressContext";
import type { AttemptAnswer } from "../lib/progress";
import {
  buildAttemptQuestions,
  isLessonUnlocked,
  PASS_THRESHOLD,
  roundForLesson,
} from "../lib/mastery";
import { QuestionCard } from "../components/lesson/QuestionCard";
import { ProgressBar } from "../components/lesson/ProgressBar";
import { FeedbackPanel } from "../components/lesson/FeedbackPanel";
import { DifficultyBadge } from "../components/lesson/DifficultyBadge";
import { LessonCleared } from "../components/lesson/LessonCleared";
import { IntroModal } from "../components/lesson/IntroModal";
import type { OptionState } from "../components/lesson/OptionButton";
import { ChevronRightIcon, ClockIcon } from "../components/icons";
import { LoadingScreen } from "../components/layout/LoadingScreen";
import { useLessonTimer } from "../hooks/useLessonTimer";
import { formatDuration } from "../lib/time";
import { earnedBadgeIds } from "../lib/badges";

function freshAnswers(count: number): AttemptAnswer[] {
  return Array.from({ length: count }, () => ({ selected: null, checked: false }));
}

export function LessonPlayer() {
  const { lessonId = "" } = useParams();
  const lesson = getLesson(lessonId);
  const { progress, loading, setPosition, saveAttempt, completeAttempt, recordCorrectAnswer } =
    useProgress();
  // A lesson that's already mastered can be redone/reviewed. The timer still
  // counts up so a faster redo can improve the recorded best time and badges.
  const alreadyMastered = Boolean(progress.lessonMastery[lessonId]?.passed);
  const timer = useLessonTimer(lessonId);

  const total = lesson?.questions.length ?? 0;

  const [round, setRound] = useState(0);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AttemptAnswer[]>(() => freshAnswers(total));
  const [phase, setPhase] = useState<"intro" | "quiz" | "results">("quiz");
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [earnedBefore, setEarnedBefore] = useState<Set<string>>(() => new Set());
  const hydratedFor = useRef<string | null>(null);

  // Resume / initialize the attempt once progress has loaded.
  useEffect(() => {
    if (!lesson || loading) return;
    if (!isLessonUnlocked(lesson.lessonId, progress)) return;
    if (hydratedFor.current === lesson.lessonId) return;

    const attempt = progress.activeAttempt;
    if (
      // A mastered lesson is being redone/reviewed: always start clean so the
      // previous (checked) answers don't reveal the solutions on re-entry.
      !alreadyMastered &&
      attempt &&
      attempt.lessonId === lesson.lessonId &&
      attempt.answers.length === total
    ) {
      setRound(attempt.round);
      setAnswers(attempt.answers);
      setIndex(
        progress.currentLesson === lesson.lessonId
          ? Math.min(Math.max(progress.currentQuestion, 0), total - 1)
          : 0,
      );
      // Returning mid-attempt resumes straight at the saved question.
      setPhase("quiz");
    } else {
      const r = roundForLesson(lesson.lessonId, progress);
      const fresh = freshAnswers(total);
      setRound(r);
      setAnswers(fresh);
      setIndex(0);
      setPosition(lesson.lessonId, 0);
      saveAttempt(lesson.lessonId, r, fresh);
      // Show the overview only when starting the primary round fresh.
      setPhase(r === 0 && lesson.intro && lesson.intro.length > 0 ? "intro" : "quiz");
    }
    setResult(null);
    hydratedFor.current = lesson.lessonId;
  }, [lesson, loading, progress, total, alreadyMastered, setPosition, saveAttempt]);

  // Persist position when the student changes question.
  useEffect(() => {
    if (!lesson || hydratedFor.current !== lesson.lessonId) return;
    setPosition(lesson.lessonId, index);
  }, [index, lesson, setPosition]);

  const questions = useMemo(
    () => (lesson ? buildAttemptQuestions(lesson, round) : []),
    [lesson, round],
  );

  if (!lesson) return <Navigate to="/lessons" replace />;
  if (loading) return <LoadingScreen />;
  if (!isLessonUnlocked(lesson.lessonId, progress)) {
    return <Navigate to="/lessons" replace />;
  }

  const current = questions[index];
  if (!current) return <LoadingScreen />;

  const state = answers[index] ?? { selected: null, checked: false };
  const { selected, checked } = state;
  const isRemediation = round > 0;

  function commit(next: AttemptAnswer[]) {
    setAnswers(next);
    if (lesson) saveAttempt(lesson.lessonId, round, next);
  }

  function update(patch: Partial<AttemptAnswer>) {
    const next = [...answers];
    next[index] = { ...next[index], ...patch };
    commit(next);
  }

  function select(optionIndex: number) {
    if (checked) return;
    update({ selected: optionIndex });
  }

  function check() {
    if (selected === null) return;
    update({ checked: true });
    if (selected === correctIndex) recordCorrectAnswer();
  }

  const correctIndex = current.correctAnswer;
  const isCorrect = checked && selected === correctIndex;

  function getOptionState(i: number): OptionState {
    if (!checked) return selected === i ? "selected" : "idle";
    if (i === correctIndex) return "correct";
    if (i === selected) return "incorrect";
    return "muted";
  }

  const isLast = index === total - 1;

  function finish() {
    if (!lesson) return;
    const correct = questions.reduce(
      (acc, q, i) => acc + (answers[i]?.selected === q.correctAnswer ? 1 : 0),
      0,
    );
    // Always record elapsed time; completeAttempt only updates the best time
    // when the attempt passed and elapsedMs > 0, so redos can still improve it.
    const elapsedMs = timer.getElapsedMs();
    setEarnedBefore(earnedBadgeIds(progress));
    const res = completeAttempt(lesson.lessonId, round, correct, total, elapsedMs);
    // Passing ends timing for this lesson; a failed attempt keeps the clock
    // running into the next remediation round.
    if (res.passed) timer.stop();
    setResult(res);
    setPhase("results");
  }

  function retry() {
    if (!lesson) return;
    const newRound = round + 1;
    const fresh = freshAnswers(total);
    setRound(newRound);
    setAnswers(fresh);
    setIndex(0);
    setResult(null);
    setPhase("quiz");
    setPosition(lesson.lessonId, 0);
    saveAttempt(lesson.lessonId, newRound, fresh);
  }

  function restart() {
    if (!lesson) return;
    if (
      !window.confirm(
        "Restart this lesson from the first question? Your current answers will be cleared.",
      )
    )
      return;
    const fresh = freshAnswers(total);
    setAnswers(fresh);
    setIndex(0);
    setResult(null);
    setPhase("quiz");
    setPosition(lesson.lessonId, 0);
    saveAttempt(lesson.lessonId, round, fresh);
  }

  if (phase === "results" && result) {
    return result.passed ? (
      <LessonCleared lesson={lesson} result={result} previouslyEarned={earnedBefore} />
    ) : (
      <ResultsView result={result} onRetry={retry} />
    );
  }

  if (phase === "intro" && lesson.intro && lesson.intro.length > 0) {
    return (
      <IntroView lesson={lesson} onBegin={() => setPhase("quiz")} />
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <Link to="/lessons" className="text-sm font-medium text-secondary hover:text-primary">
            &larr; All lessons
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={restart}
              className="rounded-full px-2.5 py-1 text-xs font-medium text-secondary hover:bg-surface-muted hover:text-primary"
            >
              Restart
            </button>
            <span
              className={[
                "rounded-full px-2.5 py-1 text-xs font-medium",
                isRemediation
                  ? "bg-accent/15 text-accent"
                  : "bg-surface-muted text-secondary",
              ].join(" ")}
            >
              {isRemediation
                ? `Practice round ${round}`
                : current && index < total
                  ? `Lesson ${lesson.order}`
                  : ""}
            </span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-primary">{lesson.title}</h1>
        {isRemediation && (
          <p className="mt-1 text-sm text-secondary">
            Practice variants — same ideas, different numbers. Reach{" "}
            {Math.round(PASS_THRESHOLD * 100)}% to unlock the next lesson.
          </p>
        )}
        {alreadyMastered && !isRemediation && (
          <p className="mt-1 text-sm text-secondary">
            You've already mastered this lesson — feel free to redo it any time.
            Your best time and badges are saved.
          </p>
        )}
        {lesson.intro && lesson.intro.length > 0 && (
          <button
            type="button"
            onClick={() => setShowIntroModal(true)}
            className="mt-2 text-sm font-medium text-accent hover:underline"
          >
            Review lesson intro
          </button>
        )}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1">
            <ProgressBar current={index + 1} total={total} label="Question" />
          </div>
          <span
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium tabular-nums text-secondary"
            aria-label="Time on this lesson"
            title="Time on this lesson"
          >
            <ClockIcon size={14} />
            {formatDuration(timer.elapsedMs)}
          </span>
        </div>
      </div>

      <QuestionCard
        question={current}
        selected={selected}
        onSelect={select}
        getOptionState={getOptionState}
        locked={checked}
        badge={<DifficultyBadge index={index} questionNumber={index + 1} />}
        footer={
          checked && selected !== null ? (
            <FeedbackPanel
              isCorrect={isCorrect}
              selectedIndex={selected}
              correctIndex={correctIndex}
              explanations={current.explanations}
            />
          ) : null
        }
      />

      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          className="pp-btn-secondary"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          Previous
        </button>

        {!checked ? (
          <button
            type="button"
            className="pp-btn-primary"
            disabled={selected === null}
            onClick={check}
          >
            Check answer
          </button>
        ) : isLast ? (
          <button type="button" className="pp-btn-primary" onClick={finish}>
            Finish lesson
          </button>
        ) : (
          <button
            type="button"
            className="pp-btn-primary"
            onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
          >
            Next
            <ChevronRightIcon size={16} />
          </button>
        )}
      </div>

      {showIntroModal && (
        <IntroModal lesson={lesson} onClose={() => setShowIntroModal(false)} />
      )}
    </div>
  );
}

function IntroView({
  lesson,
  onBegin,
}: {
  lesson: Lesson;
  onBegin: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5">
        <Link
          to="/lessons"
          className="text-sm font-medium text-secondary hover:text-primary"
        >
          &larr; All lessons
        </Link>
      </div>

      <div className="pp-card p-6 sm:p-8">
        <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-secondary">
          Lesson {lesson.order}
        </span>
        <h1 className="mt-3 text-2xl font-bold text-primary">{lesson.title}</h1>
        {lesson.subtitle && (
          <p className="mt-1 text-secondary">{lesson.subtitle}</p>
        )}

        <div className="mt-5 space-y-3 leading-relaxed text-secondary">
          {lesson.intro?.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-7">
          <button
            type="button"
            className="pp-btn-primary"
            onClick={onBegin}
            autoFocus
          >
            Begin lesson
            <ChevronRightIcon size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultsView({
  result,
  onRetry,
}: {
  result: AttemptResult;
  onRetry: () => void;
}) {
  const passMark = Math.round(PASS_THRESHOLD * 100);

  return (
    <div className="mx-auto max-w-md text-center">
      <div className="pp-card p-8">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-danger-soft text-3xl font-extrabold text-danger">
          {result.scorePercent}%
        </div>

        <h1 className="mt-5 text-xl font-bold text-primary">Keep practicing</h1>
        <p className="mt-2 text-secondary">
          You answered {result.correct} of {result.total} correctly.
        </p>
        <p className="mt-1 text-sm text-secondary">
          You need {passMark}% to unlock the next lesson. Try a fresh set of
          practice questions on the same ideas.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button type="button" className="pp-btn-primary" onClick={onRetry}>
            Practice again
          </button>
          <Link to="/lessons" className="pp-btn-secondary">
            All lessons
          </Link>
        </div>
      </div>
    </div>
  );
}
