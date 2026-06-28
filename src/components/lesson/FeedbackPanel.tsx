import { useState } from "react";
import type { Explanations } from "../../content/types";
import { OPTION_LETTERS } from "../../content/types";
import { sendTutorMessage } from "../../lib/ai/client";
import { CheckIcon, XIcon } from "../icons";

/** Question context the AI tutor needs to explain a specific option on demand. */
export interface FeedbackAiContext {
  lessonTitle: string;
  questionText: string;
  options: string[];
}

interface FeedbackPanelProps {
  isCorrect: boolean;
  selectedIndex: number;
  correctIndex: number;
  explanations: Explanations;
  /**
   * When provided, the panel can fetch an AI explanation for an option whose
   * authored text is missing, and offers a "go deeper" option otherwise.
   */
  aiContext?: FeedbackAiContext;
}

/**
 * Immediate feedback after checking an answer, followed by the explanation
 * section. Authored explanation text is shown first; when an authored
 * explanation is missing (or the learner wants more depth) we can fetch a
 * concise, targeted explanation from the AI tutor on demand.
 */
export function FeedbackPanel({
  isCorrect,
  selectedIndex,
  correctIndex,
  explanations,
  aiContext,
}: FeedbackPanelProps) {
  const selectedLetter = OPTION_LETTERS[selectedIndex];
  const correctLetter = OPTION_LETTERS[correctIndex];

  const selectedText = explanations[selectedLetter]?.trim() ?? "";
  const correctText = explanations[correctLetter]?.trim() ?? "";

  return (
    <div className="mt-5 space-y-4">
      <div
        className={[
          "flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold",
          isCorrect ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
        ].join(" ")}
        role="status"
      >
        <span
          className={[
            "flex h-6 w-6 items-center justify-center rounded-full",
            isCorrect ? "bg-success text-accent-contrast" : "bg-danger text-accent-contrast",
          ].join(" ")}
        >
          {isCorrect ? <CheckIcon size={15} /> : <XIcon size={15} />}
        </span>
        {isCorrect ? "Correct!" : `Not quite — the answer is ${correctLetter}.`}
      </div>

      <section
        aria-label="Explanation"
        className="rounded-xl border border-subtle bg-surface-muted/50 p-4"
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-secondary">
            Explanation
          </h3>
          <span
            title="This question's answer key is checked by code for a single correct option and a matching explanation."
            className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400"
          >
            <CheckIcon size={11} />
            Code-verified
          </span>
        </div>

        {isCorrect ? (
          <ExplanationBody
            text={correctText}
            aiContext={aiContext}
            letter={correctLetter}
            kind="correct"
          />
        ) : (
          <div className="mt-2 space-y-3">
            <div>
              <p className="text-xs font-medium text-secondary">
                Why {selectedLetter} is incorrect
              </p>
              <ExplanationBody
                text={selectedText}
                aiContext={aiContext}
                letter={selectedLetter}
                kind="incorrect"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-secondary">
                Why {correctLetter} is correct
              </p>
              <ExplanationBody
                text={correctText}
                aiContext={aiContext}
                letter={correctLetter}
                kind="correct"
              />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

type OptionLetter = (typeof OPTION_LETTERS)[number];

function ExplanationBody({
  text,
  aiContext,
  letter,
  kind,
}: {
  text: string;
  aiContext?: FeedbackAiContext;
  letter: OptionLetter;
  kind: "correct" | "incorrect";
}) {
  const [aiText, setAiText] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function explainWithAi() {
    if (!aiContext || busy) return;
    setBusy(true);
    setError(null);
    const ask =
      kind === "correct"
        ? `In 2-4 concise sentences, explain why option ${letter} ("${aiContext.options[OPTION_LETTERS.indexOf(letter)] ?? ""}") is the correct answer. Show the key reasoning or math.`
        : `In 2-4 concise sentences, explain the specific misconception that makes option ${letter} ("${aiContext.options[OPTION_LETTERS.indexOf(letter)] ?? ""}") wrong.`;
    try {
      const reply = await sendTutorMessage({
        lessonTitle: aiContext.lessonTitle,
        questionText: aiContext.questionText,
        options: aiContext.options,
        selectedIndex: null,
        // The feedback panel only renders after the answer is checked, so the
        // tutor is allowed to discuss why options are right/wrong here.
        answered: true,
        messages: [{ role: "user", content: ask }],
      });
      setAiText(reply);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI explanation unavailable.");
    } finally {
      setBusy(false);
    }
  }

  if (text) {
    return (
      <div className="mt-1">
        <p className="text-sm leading-relaxed text-primary">{text}</p>
        {aiText && (
          <p className="mt-2 rounded-lg bg-accent/5 p-2 text-sm leading-relaxed text-secondary">
            {aiText}
          </p>
        )}
        {aiContext && !aiText && (
          <AiButton busy={busy} onClick={explainWithAi} label="Go deeper with AI" />
        )}
        {error && (
          <p className="mt-1 text-xs text-danger" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  // No authored text — generate one on demand so no question is ever blank.
  return (
    <div className="mt-1">
      {aiText ? (
        <p className="text-sm leading-relaxed text-primary">{aiText}</p>
      ) : (
        <p className="text-sm italic text-muted">
          {aiContext ? "Tap below for a tutor explanation." : "Explanation coming soon."}
        </p>
      )}
      {aiContext && !aiText && (
        <AiButton busy={busy} onClick={explainWithAi} label="Explain with AI" />
      )}
      {error && (
        <p className="mt-1 text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function AiButton({
  busy,
  onClick,
  label,
}: {
  busy: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="mt-2 rounded-full border border-accent/30 bg-accent/5 px-3 py-1 text-xs font-semibold text-accent transition hover:bg-accent/10 disabled:opacity-60"
    >
      {busy ? "Thinking…" : label}
    </button>
  );
}
