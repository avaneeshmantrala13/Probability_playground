import type { ReactNode } from "react";
import type { RenderableQuestion } from "../../content/types";
import { SimulationView } from "../simulations/SimulationView";
import { OptionButton, type OptionState } from "./OptionButton";

interface QuestionCardProps {
  question: RenderableQuestion;
  selected: number | null;
  onSelect: (index: number) => void;
  /** Resolve the visual state of each option (defaults to idle/selected). */
  getOptionState?: (index: number) => OptionState;
  /** Disable option selection (e.g. after the answer is checked). */
  locked?: boolean;
  /** Feedback / explanation content rendered below the options. */
  footer?: ReactNode;
}

export function QuestionCard({
  question,
  selected,
  onSelect,
  getOptionState,
  locked,
  footer,
}: QuestionCardProps) {
  const resolveState = (index: number): OptionState => {
    if (getOptionState) return getOptionState(index);
    return selected === index ? "selected" : "idle";
  };

  return (
    <div className="pp-card overflow-hidden">
      {question.simulation && (
        <div className="border-b border-subtle bg-surface-muted/40 p-4 sm:p-6">
          <SimulationView config={question.simulation} />
        </div>
      )}

      <div className="p-5 sm:p-6">
        <h2 className="text-lg font-semibold leading-snug text-primary sm:text-xl">
          {question.question}
        </h2>

        <div
          className="mt-5 grid gap-3"
          role="radiogroup"
          aria-label="Answer choices"
        >
          {question.options.map((opt, i) => (
            <OptionButton
              key={i}
              index={i}
              label={opt}
              state={resolveState(i)}
              disabled={locked}
              onSelect={onSelect}
            />
          ))}
        </div>

        {footer}
      </div>
    </div>
  );
}
