import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { getLesson } from "../content";
import { useProgress, type AttemptResult } from "../context/ProgressContext";
import type { AttemptAnswer } from "../lib/progress";
import {
  buildAttemptQuestions,
  isLessonUnlocked,
  PASS_THRESHOLD,
  roundForLesson,
} from "../lib/mastery";
import {
  drawAttemptSelection,
  resolveAttemptQuestions,
  type AttemptSelection,
} from "../lib/attempt";
import { QuestionCard } from "../components/lesson/QuestionCard";
import { ProgressBar } from "../components/lesson/ProgressBar";
import { FeedbackPanel } from "../components/lesson/FeedbackPanel";
import { DifficultyBadge } from "../components/lesson/DifficultyBadge";
import { LessonCleared } from "../components/lesson/LessonCleared";
import { IntroModal } from "../components/lesson/IntroModal";
import { PreLesson, hasPreLessonContent } from "../components/lesson/primer/PreLesson";
import type { OptionState } from "../components/lesson/OptionButton";
import { PlacementQuiz } from "../components/lesson/PlacementQuiz";
import { QuestionTutorChat } from "../components/lesson/QuestionTutorChat";
import { getVerifiedBonusQuestion } from "../lib/practice/bonus";
import type { RenderableQuestion } from "../content/types";
import { useEntitlement, UpsellCard, lessonRequiresPro } from "../lib/billing";
import { ChevronRightIcon, ClockIcon } from "../components/icons";
import { LoadingScreen } from "../components/layout/LoadingScreen";
import { useLessonTimer } from "../hooks/useLessonTimer";
import { formatDuration } from "../lib/time";
import { earnedBadgeIds } from "../lib/badges";

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

/** A single navigable item: either a graded base question or a bonus practice one. */
type ViewItem =
  | { kind: "base"; q: RenderableQuestion; baseIndex: number }
  | { kind: "bonus"; q: RenderableQuestion; id: string; baseIndex: number };

export function LessonPlayer() {
  const { lessonId = "" } = useParams();
  const lesson = getLesson(lessonId);
  const { progress, loading, setPosition, saveAttempt, completeAttempt, recordCorrectAnswer } =
    useProgress();
  const { isAtLeast } = useEntitlement();
  // Advanced quant lessons (12–18) are Pro-only; free users see an upsell.
  const proLocked = lessonRequiresPro(lessonId) && !isAtLeast("pro");
  // A lesson that's already mastered can be redone/reviewed. The timer still
  // counts up so a faster redo can improve the recorded best time and badges.
  const alreadyMastered = Boolean(progress.lessonMastery[lessonId]?.passed);
  const timer = useLessonTimer(lessonId);

  const baseQuestionCount = lesson?.questions.length ?? 0;

  const [round, setRound] = useState(0);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AttemptAnswer[]>(() =>
    freshAnswers(baseQuestionCount),
  );
  // The randomized question set drawn for the current attempt (null falls back
  // to the authored order, e.g. for legacy in-progress attempts).
  const [selection, setSelection] = useState<AttemptSelection | null>(null);
  const [phase, setPhase] = useState<"intro" | "placement" | "quiz" | "results">("quiz");
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

  // Resume / initialize the attempt once progress has loaded.
  useEffect(() => {
    if (!lesson || loading) return;
    if (proLocked) return;
    if (!isLessonUnlocked(lesson.lessonId, progress)) return;
    if (hydratedFor.current === lesson.lessonId) return;

    // Bonus questions are ephemeral — never restored across reloads/re-entry.
    setBonus([]);
    setBonusAnswers({});

    const attempt = progress.activeAttempt;
    // A mastered lesson is being redone/reviewed: always start clean so the
    // previous (checked) answers don't reveal the solutions on re-entry.
    const canResume =
      !alreadyMastered &&
      !!attempt &&
      attempt.lessonId === lesson.lessonId &&
      attempt.answers.length >= baseQuestionCount;

    let resumed = false;
    if (canResume && attempt) {
      // Restore the SAME randomized set if one was saved and still resolves;
      // otherwise resume a legacy (pre-randomization) attempt on authored order.
      const resolvable =
        attempt.selection && resolveAttemptQuestions(lesson, attempt.selection);
      if (resolvable || !attempt.selection) {
        setSelection(attempt.selection ?? null);
        setRound(attempt.round);
        setAnswers(attempt.answers);
        setIndex(
          progress.currentLesson === lesson.lessonId
            ? Math.min(Math.max(progress.currentQuestion, 0), attempt.answers.length - 1)
            : 0,
        );
        // Returning mid-attempt resumes straight at the saved question.
        setPhase("quiz");
        resumed = true;
      }
    }

    if (!resumed) {
      // A fresh attempt draws a NEW randomized, difficulty-ramped set.
      const r = roundForLesson(lesson.lessonId, progress);
      const sel = drawAttemptSelection(lesson);
      const fresh = freshAnswers(sel.questionIds.length);
      setSelection(sel);
      setRound(r);
      setAnswers(fresh);
      setIndex(0);
      setPosition(lesson.lessonId, 0);
      saveAttempt(lesson.lessonId, r, fresh, sel);
      // Show the pre-lesson primer only when starting the primary round fresh.
      setPhase(r === 0 && hasPreLessonContent(lesson) ? "intro" : "quiz");
    }
    setResult(null);
    hydratedFor.current = lesson.lessonId;
  }, [lesson, loading, progress, baseQuestionCount, alreadyMastered, setPosition, saveAttempt]);

  const baseQuestions = useMemo(() => {
    if (!lesson) return [];
    if (selection) {
      const resolved = resolveAttemptQuestions(lesson, selection);
      if (resolved) return resolved;
    }
    return buildAttemptQuestions(lesson, round);
  }, [lesson, selection, round]);

  // The navigable order: each base question, immediately followed by any bonus
  // questions generated from it. Bonus questions never reorder the base set.
  const view = useMemo<ViewItem[]>(() => {
    const out: ViewItem[] = [];
    baseQuestions.forEach((q, i) => {
      out.push({ kind: "base", q, baseIndex: i });
      for (const b of bonus) {
        if (b.after === i) out.push({ kind: "bonus", q: b.q, id: b.id, baseIndex: i });
      }
    });
    return out;
  }, [baseQuestions, bonus]);

  const questionCount = view.length;

  // Persist position when the student changes question (store the underlying
  // base index so resume lands on a real graded question, not a bonus).
  useEffect(() => {
    if (!lesson || hydratedFor.current !== lesson.lessonId) return;
    setPosition(lesson.lessonId, view[index]?.baseIndex ?? 0);
  }, [index, lesson, view, setPosition]);

  if (!lesson) return <Navigate to="/lessons" replace />;
  if (loading) return <LoadingScreen />;
  if (proLocked) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-5">
          <Link to="/lessons" className="text-sm font-medium text-secondary hover:text-primary">
            &larr; All lessons
          </Link>
        </div>
        <UpsellCard
          feature="all_lessons"
          suggestedPlan="pro"
          title="This advanced lesson is part of Pro"
          description="Lessons 12–18 cover advanced quant topics — conditional expectation, martingales, Markov chains, gambler's ruin, order statistics, Kelly sizing, and adverse selection. Upgrade to Pro to unlock the full advanced track."
        />
      </div>
    );
  }
  if (!isLessonUnlocked(lesson.lessonId, progress)) {
    return <Navigate to="/lessons" replace />;
  }

  const currentItem = view[index];
  if (!currentItem) return <LoadingScreen />;
  const current = currentItem.q;

  const state: AttemptAnswer =
    currentItem.kind === "base"
      ? answers[currentItem.baseIndex] ?? { selected: null, checked: false }
      : bonusAnswers[currentItem.id] ?? { selected: null, checked: false };
  const { selected, checked } = state;
  const isRemediation = round > 0;
  // Stable identity for the tutor chat: changes per question and per restart so
  // the conversation never leaks between questions or survives a restart.
  const tutorKey =
    currentItem.kind === "base"
      ? `${runId}:b${currentItem.baseIndex}`
      : `${runId}:x${currentItem.id}`;

  function update(patch: Partial<AttemptAnswer>) {
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
    if (selected === null) return;
    update({ checked: true });
    // Only graded base questions affect progress/stats — bonus is pure practice.
    if (currentItem.kind === "base" && selected === correctIndex) recordCorrectAnswer();
  }

  const correctIndex = current.correctAnswer;
  const isCorrect = checked && selected === correctIndex;

  function getOptionState(i: number): OptionState {
    if (!checked) return selected === i ? "selected" : "idle";
    if (i === correctIndex) return "correct";
    if (i === selected) return "incorrect";
    return "muted";
  }

  const isLast = index === questionCount - 1;
  const isOnLastBase =
    currentItem.kind === "base" && currentItem.baseIndex === baseQuestions.length - 1;

  async function loadAiQuestion() {
    if (!lesson || aiLoading) return;
    setAiError(null);
    setAiLoading(true);
    const afterBaseIndex = currentItem.baseIndex;
    try {
      const topic = lesson.topics[afterBaseIndex % lesson.topics.length];
      // Anchor the bonus to the CURRENT question's specific concept so it stays
      // on-topic; fall back to the lesson topic only if the concept is missing.
      const conceptHint = current.concept ?? topic;
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
      // Anchor the bonus right after the current base question's group, and jump
      // the student straight to it (not to the end of the lesson).
      const basePos = view.findIndex(
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

  function finish() {
    if (!lesson) return;
    const correct = baseQuestions.reduce(
      (acc, q, i) => acc + (answers[i]?.selected === q.correctAnswer ? 1 : 0),
      0,
    );
    const scoreTotal = baseQuestions.length;
    // Always record elapsed time; completeAttempt only updates the best time
    // when the attempt passed and elapsedMs > 0, so redos can still improve it.
    const elapsedMs = timer.getElapsedMs();
    setEarnedBefore(earnedBadgeIds(progress));
    const res = completeAttempt(lesson.lessonId, round, correct, scoreTotal, elapsedMs);
    // Passing ends timing for this lesson; a failed attempt keeps the clock
    // running into the next remediation round.
    if (res.passed) timer.stop();
    setResult(res);
    setPhase("results");
  }

  function retry() {
    if (!lesson) return;
    const newRound = round + 1;
    // A remediation retry draws a fresh random set on the same concepts.
    const sel = drawAttemptSelection(lesson);
    const fresh = freshAnswers(sel.questionIds.length);
    setBonus([]);
    setBonusAnswers({});
    setSelection(sel);
    setRound(newRound);
    setAnswers(fresh);
    setIndex(0);
    setResult(null);
    setPhase("quiz");
    setPosition(lesson.lessonId, 0);
    saveAttempt(lesson.lessonId, newRound, fresh, sel);
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
    // A restart draws a NEW randomized set so the lesson can't be memorized.
    const sel = drawAttemptSelection(lesson);
    const fresh = freshAnswers(sel.questionIds.length);
    setBonus([]);
    setBonusAnswers({});
    setSelection(sel);
    setAnswers(fresh);
    setIndex(0);
    setResult(null);
    setPhase("quiz");
    setPosition(lesson.lessonId, 0);
    saveAttempt(lesson.lessonId, round, fresh, sel);
    // A restart is a clean run — the clock and tutor chat start over too.
    timer.reset();
    setRunId((n) => n + 1);
  }

  if (phase === "results" && result) {
    return result.passed ? (
      <LessonCleared lesson={lesson} result={result} previouslyEarned={earnedBefore} />
    ) : (
      <ResultsView result={result} onRetry={retry} />
    );
  }

  if (phase === "intro" && hasPreLessonContent(lesson)) {
    return (
      <PreLesson
        lesson={lesson}
        backTo="/lessons"
        backLabel="All lessons"
        onStart={() => setPhase("quiz")}
        onPlacement={
          lesson.placementQuestions && lesson.placementQuestions.length > 0 && !alreadyMastered
            ? () => setPhase("placement")
            : undefined
        }
      />
    );
  }

  if (phase === "placement" && lesson.placementQuestions?.length) {
    return (
      <PlacementQuiz
        lesson={lesson}
        onBack={() => setPhase("intro")}
        onPass={(correct, placementTotal) => {
          setEarnedBefore(earnedBadgeIds(progress));
          const res = completeAttempt(
            lesson.lessonId,
            0,
            correct,
            placementTotal,
            timer.getElapsedMs(),
          );
          if (res.passed) timer.stop();
          setResult(res);
          setPhase("results");
        }}
      />
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
                : current && index < questionCount
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
              current={currentItem.baseIndex + 1}
              total={baseQuestions.length}
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
          currentItem.kind === "bonus" ? (
            <span className="inline-flex items-center rounded-full bg-fuchsia-500/15 px-2.5 py-1 text-xs font-semibold text-fuchsia-600 dark:text-fuchsia-400">
              AI bonus practice
            </span>
          ) : (
            <DifficultyBadge
              index={currentItem.baseIndex}
              questionNumber={currentItem.baseIndex + 1}
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
        {currentItem.kind === "bonus" && (
          <span className="self-center text-xs text-muted">AI practice — not counted toward lesson pass</span>
        )}
      </div>

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
        ) : isLast || isOnLastBase ? (
          <button type="button" className="pp-btn-primary" onClick={finish}>
            Finish lesson
          </button>
        ) : (
          <button
            type="button"
            className="pp-btn-primary"
            onClick={() => setIndex((i) => Math.min(questionCount - 1, i + 1))}
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
