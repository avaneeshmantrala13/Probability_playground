import { useState } from "react";
import { Link } from "react-router-dom";
import type { Lesson } from "../../../content/types";
import { ChevronRightIcon } from "../../icons";
import { UnifiedPrimer } from "./UnifiedPrimer";

/** True when a lesson has any pre-lesson learning content to show. */
export function hasPreLessonContent(lesson: Lesson): boolean {
  return (
    (lesson.primer?.length ?? 0) > 0 ||
    (lesson.primerNarration?.length ?? 0) > 0 ||
    (lesson.intro?.length ?? 0) > 0
  );
}

type Stage = "overview" | "primer";

/**
 * The integrated, paced pre-lesson experience. From the overview the learner
 * either starts a single, unified primer — narrated concept slides AND the
 * reading / worked-example pages under ONE shared progress counter — or skips
 * straight to the questions. There is no chaining into a separate "primer 1 of
 * N" reading layer: the first primer already contains everything, every Skip
 * control goes directly to the questions, and finishing the last page starts
 * the questions too. Falls back to the legacy `intro` paragraphs when a lesson
 * has no rich primer yet.
 */
export function PreLesson({
  lesson,
  backTo,
  backLabel,
  onStart,
  onPlacement,
  placementLabel = "Skip ahead — placement quiz",
}: {
  lesson: Lesson;
  backTo: string;
  backLabel: string;
  onStart: () => void;
  onPlacement?: () => void;
  placementLabel?: string;
}) {
  const narration = lesson.primerNarration ?? [];
  const sections = lesson.primer ?? [];
  const hasUnifiedPrimer = narration.length > 0 || sections.length > 0;
  const [stage, setStage] = useState<Stage>("overview");

  const back = (
    <div className="mb-5">
      <Link to={backTo} className="text-sm font-medium text-secondary hover:text-primary">
        &larr; {backLabel}
      </Link>
    </div>
  );

  if (stage === "primer" && hasUnifiedPrimer) {
    return (
      <div className="mx-auto max-w-2xl">
        {back}
        <UnifiedPrimer
          narration={narration}
          sections={sections}
          onStart={onStart}
          startLabel="Start questions"
        />
      </div>
    );
  }

  // Overview / landing.
  const primaryAction = hasUnifiedPrimer
    ? { label: "Start primer", run: () => setStage("primer") }
    : { label: "Begin lesson", run: onStart };

  return (
    <div className="mx-auto max-w-2xl">
      {back}
      <div className="pp-card p-6 sm:p-8">
        <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-secondary">
          Lesson {lesson.order}
        </span>
        <h1 className="mt-3 text-2xl font-bold text-primary">{lesson.title}</h1>
        {lesson.subtitle && <p className="mt-1 text-secondary">{lesson.subtitle}</p>}

        {lesson.topics.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              What you&apos;ll learn
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {lesson.topics.map((t, i) => (
                <span
                  key={i}
                  className="rounded-full border border-subtle bg-surface-muted/60 px-3 py-1 text-sm text-secondary"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* When there is no rich primer, show the legacy intro paragraphs. */}
        {!hasUnifiedPrimer && lesson.intro && lesson.intro.length > 0 && (
          <div className="mt-5 space-y-3 leading-relaxed text-secondary">
            {lesson.intro.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}

        {hasUnifiedPrimer && (
          <p className="mt-5 leading-relaxed text-secondary">
            One paced primer walks you through the key terms, the solving method, and
            worked examples — all in a single sequence. Jump to the questions whenever
            you&apos;re ready.
          </p>
        )}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button type="button" className="pp-btn-primary" onClick={primaryAction.run} autoFocus>
            {primaryAction.label}
            <ChevronRightIcon size={16} />
          </button>

          {hasUnifiedPrimer && (
            <button type="button" className="pp-btn-secondary" onClick={onStart}>
              Skip to questions
            </button>
          )}

          {onPlacement && (
            <button type="button" className="pp-btn-secondary" onClick={onPlacement}>
              {placementLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
