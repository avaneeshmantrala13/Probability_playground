import { useCallback, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { QuestionCard } from "../components/lesson/QuestionCard";
import { FeedbackPanel } from "../components/lesson/FeedbackPanel";
import { QuestionTutorChat } from "../components/lesson/QuestionTutorChat";
import type { OptionState } from "../components/lesson/OptionButton";
import { ChevronRightIcon } from "../components/icons";
import {
  drawPracticeQuestions,
  getPracticeBank,
  type PracticeQuestion,
} from "../content/practice";
import { useEntitlement, UpsellCard, lessonRequiresPro } from "../lib/billing";

const ROUND_SIZE = 15;

export function PracticeSession() {
  const { lessonId = "" } = useParams();
  const bank = getPracticeBank(lessonId);
  const { isAtLeast } = useEntitlement();
  // Advanced quant drills (lessons 12–18) are Pro-only.
  const proLocked = lessonRequiresPro(lessonId) && !isAtLeast("pro");

  const [round, setRound] = useState(0);
  const questions = useMemo<PracticeQuestion[]>(
    () => drawPracticeQuestions(lessonId, ROUND_SIZE),
    // Reshuffle a fresh set whenever the round counter bumps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lessonId, round],
  );

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const current = questions[index];
  const isCorrect = checked && selected === current?.correctAnswer;

  const getOptionState = useCallback(
    (i: number): OptionState => {
      if (!checked) return selected === i ? "selected" : "idle";
      if (i === current.correctAnswer) return "correct";
      if (i === selected) return "incorrect";
      return "muted";
    },
    [checked, selected, current],
  );

  const check = () => {
    if (selected === null || checked) return;
    setChecked(true);
    if (selected === current.correctAnswer) setCorrectCount((c) => c + 1);
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      // New round: reshuffle a fresh draw and reset.
      setRound((r) => r + 1);
      setIndex(0);
      setCorrectCount(0);
    } else {
      setIndex((i) => i + 1);
    }
    setSelected(null);
    setChecked(false);
  };

  if (proLocked) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link to="/practice" className="text-sm text-muted hover:text-primary">
          ← Practice
        </Link>
        <div className="mt-6">
          <UpsellCard
            feature="all_lessons"
            suggestedPlan="pro"
            title="Advanced practice is part of Pro"
            description="This drill set belongs to the advanced quant block (lessons 12–18). Upgrade to Pro to unlock it."
          />
        </div>
      </div>
    );
  }

  if (!bank || questions.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-secondary">No practice questions found for this lesson yet.</p>
        <Link to="/practice" className="mt-4 inline-block text-accent hover:underline">
          Back to Practice
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <Link to="/practice" className="text-sm text-muted hover:text-primary">
            ← Practice
          </Link>
          <h1 className="mt-1 text-xl font-bold text-primary sm:text-2xl">{bank.title}</h1>
        </div>
        <div className="text-right text-sm text-secondary">
          <p className="font-semibold tabular-nums text-primary">
            {index + 1} / {questions.length}
          </p>
          <p className="tabular-nums">
            {correctCount} correct · {bank.questions.length} in bank
          </p>
        </div>
      </div>

      <QuestionCard
        question={current}
        selected={selected}
        onSelect={(i) => !checked && setSelected(i)}
        getOptionState={getOptionState}
        locked={checked}
        footer={
          checked && selected !== null ? (
            <FeedbackPanel
              isCorrect={!!isCorrect}
              selectedIndex={selected}
              correctIndex={current.correctAnswer}
              explanations={current.explanations}
              aiContext={{
                lessonTitle: bank.title,
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
        key={current.id ?? index}
        lessonTitle={bank.title}
        questionText={current.question}
        options={current.options}
        selectedIndex={selected}
        answered={checked}
        correctIndex={current.correctAnswer}
        explanations={current.explanations}
        concept={current.concept}
      />

      <div className="mt-5 flex justify-end gap-3">
        {!checked ? (
          <button
            type="button"
            className="pp-btn-primary"
            disabled={selected === null}
            onClick={check}
          >
            Check answer
          </button>
        ) : (
          <button type="button" className="pp-btn-primary inline-flex items-center gap-1" onClick={next}>
            {index + 1 >= questions.length ? "New round" : "Next question"}
            <ChevronRightIcon size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
