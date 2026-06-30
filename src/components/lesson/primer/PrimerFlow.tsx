import { useEffect, useState } from "react";
import type { PrimerSection } from "../../../content/types";
import { ChevronRightIcon } from "../../icons";
import { PrimerSectionView } from "./PrimerSectionView";

/**
 * A paced, multi-page primer reader: one concept per page, Back/Next, progress
 * dots, and a final call-to-action. Used both in the pre-lesson flow and in the
 * standalone Learn library.
 */
export function PrimerFlow({
  sections,
  ctaLabel,
  onComplete,
  onExit,
  initialIndex = 0,
}: {
  sections: PrimerSection[];
  /** Label for the final-page primary button (e.g. "Start questions"). */
  ctaLabel: string;
  onComplete: () => void;
  /** Optional secondary action available on every page (e.g. "Skip"). */
  onExit?: () => void;
  initialIndex?: number;
}) {
  const [index, setIndex] = useState(
    Math.min(Math.max(initialIndex, 0), Math.max(sections.length - 1, 0)),
  );

  // Reset to the top whenever the underlying primer changes (e.g. navigating
  // between lessons in the Learn library).
  useEffect(() => {
    setIndex(0);
  }, [sections]);

  if (sections.length === 0) return null;

  const isLast = index === sections.length - 1;
  const section = sections[index];

  return (
    <div className="pp-card p-6 sm:p-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-muted">
          Primer · {index + 1} of {sections.length}
        </span>
        {onExit && (
          <button
            type="button"
            onClick={onExit}
            className="rounded-full px-2.5 py-1 text-xs font-medium text-secondary hover:bg-surface-muted hover:text-primary"
          >
            Skip to questions
          </button>
        )}
      </div>

      <PrimerSectionView section={section} />

      {/* Progress dots */}
      <div className="mt-7 flex items-center justify-center gap-1.5" aria-hidden>
        {sections.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Go to primer page ${i + 1}`}
            className={[
              "h-2 rounded-full transition-all",
              i === index ? "w-6 bg-accent" : "w-2 bg-subtle hover:bg-accent/50",
            ].join(" ")}
          />
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          className="pp-btn-secondary"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          Back
        </button>

        {isLast ? (
          <button type="button" className="pp-btn-primary" onClick={onComplete}>
            {ctaLabel}
            <ChevronRightIcon size={16} />
          </button>
        ) : (
          <button
            type="button"
            className="pp-btn-primary"
            onClick={() => setIndex((i) => Math.min(sections.length - 1, i + 1))}
          >
            Next
            <ChevronRightIcon size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
