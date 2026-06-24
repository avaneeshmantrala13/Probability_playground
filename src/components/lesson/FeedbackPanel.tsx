import type { Explanations } from "../../content/types";
import { OPTION_LETTERS } from "../../content/types";
import { CheckIcon, XIcon } from "../icons";

interface FeedbackPanelProps {
  isCorrect: boolean;
  selectedIndex: number;
  correctIndex: number;
  explanations: Explanations;
}

/**
 * Immediate feedback after checking an answer, followed by the explanation
 * section. Per the Explanation Policy, explanation text is authored by the
 * product owner; until then these fields are empty and we show a neutral
 * placeholder. We NEVER invent explanation content here.
 */
export function FeedbackPanel({
  isCorrect,
  selectedIndex,
  correctIndex,
  explanations,
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
        <h3 className="text-xs font-semibold uppercase tracking-wide text-secondary">
          Explanation
        </h3>

        {isCorrect ? (
          <ExplanationBody text={correctText} />
        ) : (
          <div className="mt-2 space-y-3">
            <div>
              <p className="text-xs font-medium text-secondary">
                Why {selectedLetter} is incorrect
              </p>
              <ExplanationBody text={selectedText} />
            </div>
            <div>
              <p className="text-xs font-medium text-secondary">
                Why {correctLetter} is correct
              </p>
              <ExplanationBody text={correctText} />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function ExplanationBody({ text }: { text: string }) {
  if (!text) {
    return (
      <p className="mt-1 text-sm italic text-muted">
        Explanation coming soon.
      </p>
    );
  }
  return <p className="mt-1 text-sm leading-relaxed text-primary">{text}</p>;
}
