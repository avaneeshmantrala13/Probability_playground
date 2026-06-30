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
import {
  drawAttemptSelection,
  resolveAttemptQuestions,
  type AttemptSelection,
} from "../lib/attempt";
import { QuestionCard } from "../components/lesson/QuestionCard";
import { ProgressBar } from "../components/lesson/ProgressBar";
import { FeedbackPanel } from "../components/lesson/FeedbackPanel";
import { DifficultyBadge } from "../components/lesson/DifficultyBadge";
import { IntroModal } from "../components/lesson/IntroModal";
import { PreLesson, hasPreLessonContent } from "../components/lesson/primer/PreLesson";
import { QuestionTutorChat } from "../components/lesson/QuestionTutorChat";
import { getVerifiedBonusQuestion } from "../lib/practice/bonus";
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

/** An ephemeral AI bonus question, anchored right after a base question. */
interface BonusQuestion {
  id: string;
  q: RenderableQuestion;
  /** Index of the base question this bonus was generated from. */
  after: number;
}

/** A single navigable quiz item: graded base question or bonus practice one. */
type ViewItem =
  | { kind: "base"; q: RenderableQuestion; baseIndex: number }
  | { kind: "bonus"; q: RenderableQuestion; id: string; baseIndex: number };

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
  const [selection, setSelection] = useState<AttemptSelection | null>(null);
  const [placementAnswers, setPlacementAnswers] = useState<AttemptAnswer[]>(() =>
    freshAnswers(placementTotal),
  );
  const [phase, setPhase] = useState<Phase>("quiz");
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [earnedBefore, setEarnedBefore] = useState<Set<string>>(() => new Set());
  // Bonus AI questions are ephemeral practice: inserted right after the base
  // question they were generated from, never persisted, and never graded.
  const [bonus, setBonus] = useState<BonusQuestion[]>([]);
  const [bonusAnswers, setBonusAnswers] = useState<Record<string, AttemptAnswer>>({});
  // Bumped on restart/retry so the per-question tutor chat fully resets.
  const [runId, setRunId] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const hydratedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!lesson || loading) return;
    if (!isPokerTheoryLessonUnlocked(lesson.lessonId, progress)) return;
    if (hydratedFor.current === lesson.lessonId) return;

    // Bonus questions are ephemeral — never restored across reloads/re-entry.
    setBonus([]);
    setBonusAnswers({});

    const attempt = progress.activeAttempt;
    const canResume =
      !alreadyMastered &&
      !!attempt &&
      attempt.lessonId === lesson.lessonId &&
      attempt.answers.length === total;

    let resumed = false;
    if (canResume && attempt) {
      const resolvable =
        attempt.selection && resolveAttemptQuestions(lesson, attempt.selection);
      if (resolvable || !attempt.selection) {
        setSelection(attempt.selection ?? null);
        setRound(attempt.round);
        setAnswers(attempt.answers);
        setIndex(
          progress.currentLesson === lesson.lessonId
            ? Math.min(Math.max(progress.currentQuestion, 0), total - 1)
            : 0,
        );
        setPhase("quiz");
        resumed = true;
      }
    }

    if (!resumed) {
      const r = roundForPokerTheoryLesson(lesson.lessonId, progress);
      const sel = drawAttemptSelection(lesson);
      const fresh = freshAnswers(sel.questionIds.length);
      setSelection(sel);
      setRound(r);
      setAnswers(fresh);
      setIndex(0);
      setPlacementAnswers(freshAnswers(placementTotal));
      setPosition(lesson.lessonId, 0);
      saveAttempt(lesson.lessonId, r, fresh, sel);

      if (r === 0 && hasPreLessonContent(lesson)) {
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

  const baseQuestions = useMemo(() => {
    if (!lesson) return [];
    if (selection) {
      const resolved = resolveAttemptQuestions(lesson, selection);
      if (resolved) return resolved;
    }
    return buildPokerTheoryAttemptQuestions(lesson, round);
  }, [lesson, selection, round]);

  const quizView = useMemo<ViewItem[]>(() => {
    const out: ViewItem[] = [];
    baseQuestions.forEach((q, i) => {
      out.push({ kind: "base", q, baseIndex: i });
      for (const b of bonus) {
        if (b.after === i) out.push({ kind: "bonus", q: b.q, id: b.id, baseIndex: i });
      }
    });
    return out;
  }, [baseQuestions, bonus]);

  useEffect(() => {
    if (!lesson || hydratedFor.current !== lesson.lessonId) return;
    if (phase === "quiz")
      setPosition(lesson.lessonId, quizView[index]?.baseIndex ?? 0);
  }, [index, lesson, phase, quizView, setPosition]);

  const placementQuestions: RenderableQuestion[] = useMemo(
    () =>
      lesson?.placementQuestions?.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanations: q.explanations,
        concept: q.concept,
      })) ?? [],
    [lesson],
  );

  if (!lesson) return <Navigate to="/poker-theory" replace />;
  if (loading) return <LoadingScreen />;
  if (!isPokerTheoryLessonUnlocked(lesson.lessonId, progress)) {
    return <Navigate to="/poker-theory" replace />;
  }

  const isPlacementPhase = phase === "placement";
  const currentItem = isPlacementPhase ? null : quizView[index];
  const current = isPlacementPhase ? placementQuestions[index] : currentItem?.q;
  const activeTotal = isPlacementPhase ? placementQuestions.length : quizView.length;

  if (!current && phase !== "intro" && phase !== "placement-offer" && phase !== "results") {
    return <LoadingScreen />;
  }

  const fresh: AttemptAnswer = { selected: null, checked: false };
  const state: AttemptAnswer = isPlacementPhase
    ? placementAnswers[index] ?? fresh
    : currentItem?.kind === "base"
      ? answers[currentItem.baseIndex] ?? fresh
      : currentItem
        ? bonusAnswers[currentItem.id] ?? fresh
        : fresh;
  const { selected, checked } = state;
  const isRemediation = round > 0 && !isPlacementPhase;
  const tutorKey =
    currentItem?.kind === "base"
      ? `${runId}:b${currentItem.baseIndex}`
      : currentItem
        ? `${runId}:x${currentItem.id}`
        : `${runId}:none`;

  function update(patch: Partial<AttemptAnswer>) {
    if (isPlacementPhase) {
      const next = [...placementAnswers];
      next[index] = { ...next[index], ...patch };
      setPlacementAnswers(next);
      return;
    }
    if (!currentItem) return;
    if (currentItem.kind === "base") {
      const next = [...answers];
      next[currentItem.baseIndex] = { ...next[currentItem.baseIndex], ...patch };
      setAnswers(next);
      if (lesson) saveAttempt(lesson.lessonId, round, next, selection ?? undefined);
    } else {
      const id = currentItem.id;
      setBonusAnswers((prev) => ({
        ...prev,
        [id]: { ...(prev[id] ?? { selected: null, checked: false }), ...patch },
      }));
    }
  }

  function select(optionIndex: number) {
    if (checked) return;
    update({ selected: optionIndex });
  }

  function check() {
    if (selected === null || !current) return;
    update({ checked: true });
    // Bonus practice is never graded; placement and base questions are.
    const isGraded = isPlacementPhase || currentItem?.kind === "base";
    if (isGraded && selected === current.correctAnswer) recordCorrectAnswer();
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
  const isOnLastBase =
    !isPlacementPhase &&
    currentItem?.kind === "base" &&
    currentItem.baseIndex === baseQuestions.length - 1;

  async function loadAiQuestion() {
    if (!lesson || aiLoading || isPlacementPhase || !currentItem) return;
    setAiError(null);
    setAiLoading(true);
    const afterBaseIndex = currentItem.baseIndex;
    try {
      const topic = lesson.topics[afterBaseIndex % lesson.topics.length];
      // Anchor the bonus to the CURRENT question's specific concept so it stays
      // on-topic; fall back to the lesson topic only if the concept is missing.
      const conceptHint = currentItem.q.concept ?? topic;
      // Only trusted sources are served: a code-computed template (the LLM may
      // reword it, with every number preserved) or a human-vetted bank question.
      const gen = await getVerifiedBonusQuestion({
        lessonId: lesson.lessonId,
        title: lesson.title,
        topics: lesson.topics,
        order: lesson.order,
        conceptHint,
        topic,
      });
      const rq: RenderableQuestion = {
        id: gen.id,
        question: gen.question,
        options: gen.options,
        correctAnswer: gen.correctAnswer,
        explanations: gen.explanations,
        concept: gen.concept,
      };
      const basePos = quizView.findIndex(
        (v) => v.kind === "base" && v.baseIndex === afterBaseIndex,
      );
      const groupCount = bonus.filter((b) => b.after === afterBaseIndex).length;
      setBonus((prev) => [...prev, { id: gen.id, q: rq, after: afterBaseIndex }]);
      setBonusAnswers((prev) => ({ ...prev, [gen.id]: { selected: null, checked: false } }));
      if (basePos >= 0) setIndex(basePos + groupCount + 1);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Could not generate question.");
    } finally {
      setAiLoading(false);
    }
  }

  function finishQuiz() {
    if (!lesson) return;
    const correct = baseQuestions.reduce(
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
    const sel = drawAttemptSelection(lesson);
    const freshSet = freshAnswers(sel.questionIds.length);
    setBonus([]);
    setBonusAnswers({});
    setSelection(sel);
    setRound(newRound);
    setAnswers(freshSet);
    setIndex(0);
    setResult(null);
    setPhase("quiz");
    setPosition(lesson.lessonId, 0);
    saveAttempt(lesson.lessonId, newRound, freshSet, sel);
    setRunId((n) => n + 1);
  }

  function restart() {
    if (!lesson) return;
    if (
      !window.confirm(
        "Restart this lesson from the first question? You'll get a fresh, randomized set of questions.",
      )
    )
      return;
    const sel = drawAttemptSelection(lesson);
    const freshSet = freshAnswers(sel.questionIds.length);
    setBonus([]);
    setBonusAnswers({});
    setSelection(sel);
    setAnswers(freshSet);
    setIndex(0);
    setResult(null);
    setPhase("quiz");
    setPosition(lesson.lessonId, 0);
    saveAttempt(lesson.lessonId, round, freshSet, sel);
    // A restart is a clean run — the clock and tutor chat start over too.
    timer.reset();
    setRunId((n) => n + 1);
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

  if (phase === "intro" && hasPreLessonContent(lesson)) {
    return (
      <PreLesson
        lesson={lesson}
        backTo="/poker-theory"
        backLabel="Poker Theory"
        onStart={() => (hasPlacement ? setPhase("placement-offer") : setPhase("quiz"))}
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
        {hasPreLessonContent(lesson) && (
          <button
            type="button"
            onClick={() =>
              lesson.primer?.length || lesson.primerNarration?.length
                ? setPhase("intro")
                : setShowIntroModal(true)
            }
            className="mt-2 text-sm font-medium text-accent hover:underline"
          >
            {lesson.primer?.length || lesson.primerNarration?.length
              ? "Review primer"
              : "Review lesson intro"}
          </button>
        )}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1">
            <ProgressBar
              current={isPlacementPhase ? index + 1 : (currentItem?.baseIndex ?? 0) + 1}
              total={isPlacementPhase ? placementTotal : baseQuestions.length}
              label="Question"
            />
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
          isPlacementPhase ? undefined : currentItem?.kind === "bonus" ? (
            <span className="inline-flex items-center rounded-full bg-fuchsia-500/15 px-2.5 py-1 text-xs font-semibold text-fuchsia-600 dark:text-fuchsia-400">
              AI bonus practice
            </span>
          ) : (
            <DifficultyBadge
              index={currentItem?.baseIndex ?? 0}
              questionNumber={(currentItem?.baseIndex ?? 0) + 1}
            />
          )
        }
        footer={
          checked && selected !== null ? (
            <FeedbackPanel
              isCorrect={isCorrect}
              selectedIndex={selected}
              correctIndex={correctIndex}
              explanations={current.explanations}
              aiContext={{
                lessonTitle: lesson.title,
                questionText: current.question,
                options: current.options,
                correctIndex: current.correctAnswer,
                explanations: current.explanations,
                concept: current.concept,
              }}
            />
          ) : null
        }
      />

      {!isPlacementPhase && current && (
        <>
          <QuestionTutorChat
            key={tutorKey}
            lessonTitle={lesson.title}
            questionText={current.question}
            options={current.options}
            selectedIndex={selected}
            answered={checked}
            correctIndex={current.correctAnswer}
            explanations={current.explanations}
            concept={current.concept}
          />

          {aiError && (
            <p className="mt-3 text-sm text-danger" role="alert">
              {aiError}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="pp-btn-secondary text-sm"
              disabled={aiLoading}
              onClick={() => void loadAiQuestion()}
            >
              {aiLoading ? "Generating…" : "Generate AI bonus question"}
            </button>
            {currentItem?.kind === "bonus" && (
              <span className="self-center text-xs text-muted">
                AI practice — not counted toward lesson pass
              </span>
            )}
          </div>
        </>
      )}

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
        ) : isOnLastBase ? (
          <button type="button" className="pp-btn-primary" onClick={finishQuiz}>
            Finish lesson
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
