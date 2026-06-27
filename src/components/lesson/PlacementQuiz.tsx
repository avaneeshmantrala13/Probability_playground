import { useState } from "react";
import type { Lesson } from "../../content/types";
import { PASS_THRESHOLD } from "../../lib/mastery";
import { QuestionCard } from "./QuestionCard";
import { FeedbackPanel } from "./FeedbackPanel";
import { DifficultyBadge } from "./DifficultyBadge";
import type { OptionState } from "./OptionButton";
import { ChevronRightIcon } from "../icons";

interface PlacementQuizProps {
  lesson: Lesson;
  onPass: (correct: number, total: number) => void;
  onBack: () => void;
}

/** Fast-track quiz — pass at ≥80% to skip the full lesson. */
export function PlacementQuiz({ lesson, onPass, onBack }: PlacementQuizProps) {
  const questions = lesson.placementQuestions ?? [];
  const total = questions.length;
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  if (total === 0) return null;

  const current = questions[index];
  const correctIndex = current.correctAnswer;
  const isCorrect = checked && selected === correctIndex;
  const isLast = index === total - 1;
  const passMark = Math.round(PASS_THRESHOLD * 100);

  function getOptionState(i: number): OptionState {
    if (!checked) return selected === i ? "selected" : "idle";
    if (i === correctIndex) return "correct";
    if (i === selected) return "incorrect";
    return "muted";
  }

  function check() {
    if (selected === null || checked) return;
    setChecked(true);
    if (selected === correctIndex) setCorrectCount((c) => c + 1);
  }

  function advance() {
    if (isLast) {
      onPass(correctCount, total);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setChecked(false);
  }

  function finishPlacement() {
    onPass(correctCount, total);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium text-secondary hover:text-primary"
        >
          &larr; Back to overview
        </button>
        <span className="text-xs font-medium text-muted">
          Placement quiz · {index + 1}/{total}
        </span>
      </div>

      <div className="mb-4 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-secondary">
        Score <strong className="text-primary">{passMark}%+</strong> to skip ahead and
        mark this lesson complete. You need{" "}
        {Math.ceil(PASS_THRESHOLD * total)} of {total} correct.
      </div>

      <QuestionCard
        question={current}
        selected={selected}
        onSelect={setSelected}
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
          ) : undefined
        }
      />

      <div className="mt-6 flex justify-end gap-3">
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
          <button type="button" className="pp-btn-primary" onClick={finishPlacement}>
            See results
          </button>
        ) : (
          <button type="button" className="pp-btn-primary" onClick={advance}>
            Next
            <ChevronRightIcon size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
