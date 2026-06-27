import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  getNextPokerTheoryLesson,
  getPokerTheoryLesson,
} from "../content/pokerTheory";
import type { Lesson, RenderableQuestion } from "../content/pokerTheory/types";
import { useProgress, type AttemptResult } from "../context/ProgressContext";
import type { AttemptAnswer } from "../lib/progress";
import {
  buildPokerTheoryAttemptQuestions,
  isPokerTheoryLessonUnlocked,
  PASS_THRESHOLD,
  roundForPokerTheoryLesson,
} from "../content/pokerTheory/mastery";
import { QuestionCard } from "../components/lesson/QuestionCard";
import { ProgressBar } from "../components/lesson/ProgressBar";
import { FeedbackPanel } from "../components/lesson/FeedbackPanel";
import { DifficultyBadge } from "../components/lesson/DifficultyBadge";
import { IntroModal } from "../components/lesson/IntroModal";
import type { OptionState } from "../components/lesson/OptionButton";
import { CheckIcon, ChevronRightIcon, ClockIcon, TrophyIcon } from "../components/icons";
import { LoadingScreen } from "../components/layout/LoadingScreen";
import { useLessonTimer } from "../hooks/useLessonTimer";
import { formatDuration } from "../lib/time";
import { earnedBadgeIds, earnedBadges } from "../lib/badges";
import { Confetti } from "../components/lesson/Confetti";

type Phase =
  | "intro"
  | "placement-offer"
  | "placement"
  | "quiz"
  | "results";

function freshAnswers(count: number): AttemptAnswer[] {
  return Array.from({ length: count }, () => ({ selected: null, checked: false }));
}

export function PokerTheoryPlayer() {
  const { lessonId = "" } = useParams();
  const lesson = getPokerTheoryLesson(lessonId);
  const { progress, loading, setPosition, saveAttempt, completeAttempt, recordCorrectAnswer } =
    useProgress();
  const alreadyMastered = Boolean(progress.lessonMastery[lessonId]?.passed);
  const timer = useLessonTimer(lessonId);

  const total = lesson?.questions.length ?? 0;
  const placementTotal = lesson?.placementQuestions?.length ?? 0;
  const hasPlacement = placementTotal > 0 && !alreadyMastered;

  const [round, setRound] = useState(0);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AttemptAnswer[]>(() => freshAnswers(total));
  const [placementAnswers, setPlacementAnswers] = useState<AttemptAnswer[]>(() =>
    freshAnswers(placementTotal),
  );
  const [phase, setPhase] = useState<Phase>("quiz");
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [earnedBefore, setEarnedBefore] = useState<Set<string>>(() => new Set());
  const hydratedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!lesson || loading) return;
    if (!isPokerTheoryLessonUnlocked(lesson.lessonId, progress)) return;
    if (hydratedFor.current === lesson.lessonId) return;

    const attempt = progress.activeAttempt;
    if (
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
      setPhase("quiz");
    } else {
      const r = roundForPokerTheoryLesson(lesson.lessonId, progress);
      const fresh = freshAnswers(total);
      setRound(r);
      setAnswers(fresh);
      setIndex(0);
      setPlacementAnswers(freshAnswers(placementTotal));
      setPosition(lesson.lessonId, 0);
      saveAttempt(lesson.lessonId, r, fresh);

      if (r === 0 && lesson.intro && lesson.intro.length > 0) {
        setPhase("intro");
      } else if (r === 0 && hasPlacement) {
        setPhase("placement-offer");
      } else {
        setPhase("quiz");
      }
    }
    setResult(null);
    hydratedFor.current = lesson.lessonId;
  }, [
    lesson,
    loading,
    progress,
    total,
    placementTotal,
    hasPlacement,
    alreadyMastered,
    setPosition,
    saveAttempt,
  ]);

  useEffect(() => {
    if (!lesson || hydratedFor.current !== lesson.lessonId) return;
    if (phase === "quiz") setPosition(lesson.lessonId, index);
  }, [index, lesson, phase, setPosition]);

  const questions = useMemo(
    () => (lesson ? buildPokerTheoryAttemptQuestions(lesson, round) : []),
    [lesson, round],
  );

  const placementQuestions: RenderableQuestion[] = useMemo(
    () =>
      lesson?.placementQuestions?.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanations: q.explanations,
      })) ?? [],
    [lesson],
  );

  if (!lesson) return <Navigate to="/poker-theory" replace />;
  if (loading) return <LoadingScreen />;
  if (!isPokerTheoryLessonUnlocked(lesson.lessonId, progress)) {
    return <Navigate to="/poker-theory" replace />;
  }

  const isPlacementPhase = phase === "placement";
  const activeQuestions = isPlacementPhase ? placementQuestions : questions;
  const activeAnswers = isPlacementPhase ? placementAnswers : answers;
  const activeTotal = activeQuestions.length;
  const current = activeQuestions[index];

  if (!current && phase !== "intro" && phase !== "placement-offer" && phase !== "results") {
    return <LoadingScreen />;
  }

  const state = activeAnswers[index] ?? { selected: null, checked: false };
  const { selected, checked } = state;
  const isRemediation = round > 0 && !isPlacementPhase;

  function setActiveAnswers(next: AttemptAnswer[]) {
    if (isPlacementPhase) setPlacementAnswers(next);
    else {
      setAnswers(next);
      if (lesson) saveAttempt(lesson.lessonId, round, next);
    }
  }

  function update(patch: Partial<AttemptAnswer>) {
    const next = [...activeAnswers];
    next[index] = { ...next[index], ...patch };
    setActiveAnswers(next);
  }

  function select(optionIndex: number) {
    if (checked) return;
    update({ selected: optionIndex });
  }

  function check() {
    if (selected === null) return;
    update({ checked: true });
    if (selected === current.correctAnswer) recordCorrectAnswer();
  }

  const correctIndex = current?.correctAnswer ?? 0;
  const isCorrect = checked && selected === correctIndex;

  function getOptionState(i: number): OptionState {
    if (!checked) return selected === i ? "selected" : "idle";
    if (i === correctIndex) return "correct";
    if (i === selected) return "incorrect";
    return "muted";
  }

  const isLast = index === activeTotal - 1;

  function finishQuiz() {
    if (!lesson) return;
    const correct = questions.reduce(
      (acc, q, i) => acc + (answers[i]?.selected === q.correctAnswer ? 1 : 0),
      0,
    );
    const elapsedMs = timer.getElapsedMs();
    setEarnedBefore(earnedBadgeIds(progress));
    const res = completeAttempt(lesson.lessonId, round, correct, total, elapsedMs);
    if (res.passed) timer.stop();
    setResult(res);
    setPhase("results");
  }

  function finishPlacement() {
    if (!lesson) return;
    const correct = placementQuestions.reduce(
      (acc, q, i) => acc + (placementAnswers[i]?.selected === q.correctAnswer ? 1 : 0),
      0,
    );
    const elapsedMs = timer.getElapsedMs();
    setEarnedBefore(earnedBadgeIds(progress));
    const res = completeAttempt(
      lesson.lessonId,
      0,
      correct,
      placementTotal,
      elapsedMs,
    );
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

  function beginPlacement() {
    setIndex(0);
    setPlacementAnswers(freshAnswers(placementTotal));
    setPhase("placement");
  }

  function beginFullLesson() {
    setIndex(0);
    setPhase("quiz");
  }

  const wasPlacementAttempt =
    placementTotal > 0 && result != null && result.total === placementTotal;

  if (phase === "results" && result) {
    return result.passed ? (
      <PokerTheoryCleared
        lesson={lesson}
        result={result}
        previouslyEarned={earnedBefore}
        skippedViaPlacement={wasPlacementAttempt}
      />
    ) : wasPlacementAttempt ? (
      <PlacementFailedView onContinue={beginFullLesson} score={result.scorePercent} />
    ) : (
      <ResultsView result={result} onRetry={retry} />
    );
  }

  if (phase === "intro" && lesson.intro && lesson.intro.length > 0) {
    return (
      <IntroView
        lesson={lesson}
        onBegin={() => (hasPlacement ? setPhase("placement-offer") : setPhase("quiz"))}
      />
    );
  }

  if (phase === "placement-offer" && hasPlacement) {
    return (
      <PlacementOfferView
        lesson={lesson}
        questionCount={placementTotal}
        onPlacement={beginPlacement}
        onFullLesson={beginFullLesson}
      />
    );
  }

  if (!current) return <LoadingScreen />;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <Link
            to="/poker-theory"
            className="text-sm font-medium text-secondary hover:text-primary"
          >
            &larr; Poker Theory
          </Link>
          <div className="flex items-center gap-2">
            {phase === "quiz" && (
              <button
                type="button"
                onClick={restart}
                className="rounded-full px-2.5 py-1 text-xs font-medium text-secondary hover:bg-surface-muted hover:text-primary"
              >
                Restart
              </button>
            )}
            <span
              className={[
                "rounded-full px-2.5 py-1 text-xs font-medium",
                isPlacementPhase
                  ? "bg-accent/15 text-accent"
                  : isRemediation
                    ? "bg-accent/15 text-accent"
                    : "bg-surface-muted text-secondary",
              ].join(" ")}
            >
              {isPlacementPhase
                ? "Placement test"
                : isRemediation
                  ? `Practice round ${round}`
                  : `Lesson ${lesson.order}`}
            </span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-primary">{lesson.title}</h1>
        {isPlacementPhase && (
          <p className="mt-1 text-sm text-secondary">
            Score {Math.round(PASS_THRESHOLD * 100)}% or higher to skip the full lesson
            and unlock the next one.
          </p>
        )}
        {isRemediation && (
          <p className="mt-1 text-sm text-secondary">
            Practice variants — same ideas, different numbers. Reach{" "}
            {Math.round(PASS_THRESHOLD * 100)}% to unlock the next lesson.
          </p>
        )}
        {alreadyMastered && !isRemediation && !isPlacementPhase && (
          <p className="mt-1 text-sm text-secondary">
            You&apos;ve already mastered this lesson — feel free to redo it any time.
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
            <ProgressBar current={index + 1} total={activeTotal} label="Question" />
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
        badge={
          isPlacementPhase ? undefined : (
            <DifficultyBadge index={index} questionNumber={index + 1} />
          )
        }
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
          <button
            type="button"
            className="pp-btn-primary"
            onClick={isPlacementPhase ? finishPlacement : finishQuiz}
          >
            {isPlacementPhase ? "Finish placement" : "Finish lesson"}
          </button>
        ) : (
          <button
            type="button"
            className="pp-btn-primary"
            onClick={() => setIndex((i) => Math.min(activeTotal - 1, i + 1))}
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

function IntroView({ lesson, onBegin }: { lesson: Lesson; onBegin: () => void }) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5">
        <Link
          to="/poker-theory"
          className="text-sm font-medium text-secondary hover:text-primary"
        >
          &larr; Poker Theory
        </Link>
      </div>

      <div className="pp-card p-6 sm:p-8">
        <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-secondary">
          Lesson {lesson.order}
        </span>
        <h1 className="mt-3 text-2xl font-bold text-primary">{lesson.title}</h1>
        {lesson.subtitle && <p className="mt-1 text-secondary">{lesson.subtitle}</p>}

        <div className="mt-5 space-y-3 leading-relaxed text-secondary">
          {lesson.intro?.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-7">
          <button type="button" className="pp-btn-primary" onClick={onBegin} autoFocus>
            Continue
            <ChevronRightIcon size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function PlacementOfferView({
  lesson,
  questionCount,
  onPlacement,
  onFullLesson,
}: {
  lesson: Lesson;
  questionCount: number;
  onPlacement: () => void;
  onFullLesson: () => void;
}) {
  const passMark = Math.round(PASS_THRESHOLD * 100);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5">
        <Link
          to="/poker-theory"
          className="text-sm font-medium text-secondary hover:text-primary"
        >
          &larr; Poker Theory
        </Link>
      </div>

      <div className="pp-card p-6 sm:p-8">
        <h1 className="text-xl font-bold text-primary">{lesson.title}</h1>
        <p className="mt-3 text-secondary">
          Already comfortable with this topic? Take a quick {questionCount}-question
          placement test. Score {passMark}% or higher to skip the full lesson and move
          on.
        </p>
        <p className="mt-2 text-sm text-secondary">
          Or work through all {lesson.questions.length} questions for deeper practice.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button type="button" className="pp-btn-primary" onClick={onPlacement}>
            Take placement test
            <ChevronRightIcon size={16} />
          </button>
          <button type="button" className="pp-btn-secondary" onClick={onFullLesson}>
            Start full lesson
          </button>
        </div>
      </div>
    </div>
  );
}

function PlacementFailedView({
  score,
  onContinue,
}: {
  score: number;
  onContinue: () => void;
}) {
  const passMark = Math.round(PASS_THRESHOLD * 100);

  return (
    <div className="mx-auto max-w-md text-center">
      <div className="pp-card p-8">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-surface-muted text-3xl font-extrabold text-secondary">
          {score}%
        </div>
        <h1 className="mt-5 text-xl font-bold text-primary">Placement not passed</h1>
        <p className="mt-2 text-secondary">
          You needed {passMark}% to skip ahead. No worries — the full lesson will
          reinforce these concepts.
        </p>
        <button type="button" className="pp-btn-primary mt-6" onClick={onContinue}>
          Start full lesson
          <ChevronRightIcon size={16} />
        </button>
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
          You need {passMark}% to unlock the next lesson. Try a fresh set of practice
          questions on the same ideas.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button type="button" className="pp-btn-primary" onClick={onRetry}>
            Practice again
          </button>
          <Link to="/poker-theory" className="pp-btn-secondary">
            All lessons
          </Link>
        </div>
      </div>
    </div>
  );
}

function PokerTheoryCleared({
  lesson,
  result,
  previouslyEarned,
  skippedViaPlacement,
}: {
  lesson: Lesson;
  result: AttemptResult;
  previouslyEarned?: Set<string>;
  skippedViaPlacement?: boolean;
}) {
  const { progress } = useProgress();
  const next = getNextPokerTheoryLesson(lesson.lessonId);
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
          {skippedViaPlacement ? "Placement passed!" : "Lesson mastered!"}
        </h1>
        <p className="mt-2 text-secondary">
          You scored{" "}
          <span className="font-semibold text-primary">{result.scorePercent}%</span>{" "}
          ({result.correct} of {result.total} correct) on{" "}
          <span className="font-medium text-primary">{lesson.title}</span>.
          {skippedViaPlacement && " You skipped the full lesson."}
        </p>

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
            <Link to={`/poker-theory/${next.lessonId}`} className="pp-btn-primary">
              Start {next.title}
              <ChevronRightIcon size={16} />
            </Link>
          ) : (
            <Link to="/poker-theory" className="pp-btn-primary">
              Back to Poker Theory
            </Link>
          )}
          <Link to="/poker-theory" className="pp-btn-secondary">
            All lessons
          </Link>
        </div>
      </div>
    </div>
  );
}
