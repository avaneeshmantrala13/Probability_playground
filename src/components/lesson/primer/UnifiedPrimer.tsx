import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { NarrationSlide, PrimerSection } from "../../../content/types";
import { useSpeech } from "../../../hooks/useSpeech";
import { ChevronRightIcon } from "../../icons";
import { PrimerSectionView } from "./PrimerSectionView";
import { PrimerVisualView } from "./PrimerVisualView";

/** Rough caption duration (ms) when speech audio is unavailable. */
function captionMs(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(4200, words * 360 + 800);
}

/** One page of the unified primer: either a narrated concept slide or a reading page. */
type PrimerPage =
  | { kind: "narration"; slide: NarrationSlide }
  | { kind: "reading"; section: PrimerSection };

/**
 * The single, unified pre-lesson primer. On the first pass it already contains
 * EVERYTHING — the narrated concept slides (Web Speech audio + captions) first,
 * then the reading / worked-example pages — under one shared "X of N" progress
 * counter. There is no chaining into a separate "primer 1 of N" layer.
 *
 * - A persistent "Skip to questions" control on every page calls `onStart`.
 * - Reaching the end (the last page) calls `onStart`.
 * - Narration auto-advances with audio; gracefully falls back to caption-only
 *   auto-advance when speech synthesis is unavailable. Reading pages are paced
 *   by the learner (no auto-advance).
 */
export function UnifiedPrimer({
  narration,
  sections,
  onStart,
  startLabel = "Start questions",
}: {
  narration: NarrationSlide[];
  sections: PrimerSection[];
  /** Called from any Skip control and when the learner finishes the last page. */
  onStart: () => void;
  /** Label for the final-page primary button. */
  startLabel?: string;
}) {
  const pages = useMemo<PrimerPage[]>(
    () => [
      ...narration.map((slide) => ({ kind: "narration" as const, slide })),
      ...sections.map((section) => ({ kind: "reading" as const, section })),
    ],
    [narration, sections],
  );

  const { supported, speak, cancel } = useSpeech();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);

  // Index of the final narrated slide (-1 when there is no narration). Audio
  // auto-advance stops here so it never bleeds into the reading pages.
  const lastNarrationIndex = narration.length - 1;

  // Latest advance handler kept in a ref so the speech onEnd callback always
  // runs current logic without re-subscribing.
  const advanceRef = useRef<() => void>(() => {});
  const advance = useCallback(() => {
    setIndex((i) => {
      if (i >= lastNarrationIndex) {
        setPlaying(false);
        setFinished(true);
        return i;
      }
      return i + 1;
    });
  }, [lastNarrationIndex]);
  advanceRef.current = advance;

  // Drive narration audio / auto-advance for narrated pages only.
  useEffect(() => {
    if (!playing) return;
    const page = pages[index];
    if (!page || page.kind !== "narration") return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (supported) {
      speak(page.slide.caption, () => advanceRef.current());
    } else {
      timer = setTimeout(() => advanceRef.current(), captionMs(page.slide.caption));
    }
    return () => {
      cancel();
      if (timer) clearTimeout(timer);
    };
  }, [playing, index, supported, pages, speak, cancel]);

  // Stop any speech if the component unmounts.
  useEffect(() => () => cancel(), [cancel]);

  // Defensive: with nothing to show, go straight to the questions.
  useEffect(() => {
    if (pages.length === 0) onStart();
  }, [pages.length, onStart]);

  const goTo = useCallback(
    (i: number) => {
      const clamped = Math.min(Math.max(i, 0), pages.length - 1);
      setFinished(false);
      setIndex(clamped);
      // Leaving a narrated slide for a reading page should silence audio.
      if (pages[clamped]?.kind !== "narration") setPlaying(false);
    },
    [pages],
  );

  const togglePlay = useCallback(() => {
    setFinished(false);
    setPlaying((p) => !p);
  }, []);

  const replay = useCallback(() => {
    setFinished(false);
    setIndex(0);
    setPlaying(true);
  }, []);

  if (pages.length === 0) return null;

  const page = pages[index];
  const isLast = index === pages.length - 1;
  const isNarration = page.kind === "narration";
  // The final narrated slide has been reached and audio has stopped.
  const narrationFinished = finished && index === lastNarrationIndex;

  const skip = (
    <button
      type="button"
      onClick={() => {
        cancel();
        setPlaying(false);
        onStart();
      }}
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-secondary hover:bg-surface-muted hover:text-primary"
    >
      Skip to questions
      <ChevronRightIcon size={14} />
    </button>
  );

  return (
    <div className="pp-card overflow-hidden">
      {/* Header: kind badge + shared progress counter + persistent skip. */}
      <div className="flex items-center justify-between gap-3 border-b border-subtle px-6 py-3 sm:px-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent">
          {isNarration ? (
            <>
              <span className={playing ? "animate-pulse" : ""}>●</span>
              Concept primer
            </>
          ) : (
            "Primer"
          )}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted">
            {index + 1} / {pages.length}
          </span>
          {skip}
        </div>
      </div>

      {/* Body */}
      {isNarration ? (
        <>
          <div className="relative bg-gradient-to-br from-accent/10 via-surface to-surface px-6 py-8 sm:px-8 sm:py-10">
            {page.slide.term && (
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                {page.slide.term}
              </p>
            )}
            <h2 className="mt-1 text-xl font-bold text-primary sm:text-2xl">
              {page.slide.title}
            </h2>

            {page.slide.visual && (
              <div className="mt-5">
                <PrimerVisualView visual={page.slide.visual} />
              </div>
            )}

            {page.slide.bullets && page.slide.bullets.length > 0 && (
              <ul className="mt-5 space-y-2">
                {page.slide.bullets.map((b, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-secondary">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <span className="leading-relaxed">{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Captions (always visible) */}
          <div className="border-t border-subtle bg-surface-muted/40 px-6 py-4 sm:px-8">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Captions</p>
            <p className="mt-1 leading-relaxed text-primary">{page.slide.caption}</p>
            {!supported && (
              <p className="mt-2 text-xs text-secondary">
                Narration audio isn&apos;t available in this browser — captions advance
                automatically.
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="px-6 py-7 sm:px-8">
          <PrimerSectionView section={page.section} />
        </div>
      )}

      {/* Progress dots across the whole unified sequence */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 px-6 pt-4">
        {pages.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to primer page ${i + 1}`}
            className={[
              "h-2 rounded-full transition-all",
              i === index
                ? "w-6 bg-accent"
                : p.kind === "narration"
                  ? "w-2 bg-subtle hover:bg-accent/50"
                  : "w-2 bg-subtle/70 hover:bg-accent/50",
            ].join(" ")}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 sm:px-8">
        <button
          type="button"
          className="pp-btn-secondary"
          disabled={index === 0}
          onClick={() => goTo(index - 1)}
        >
          Back
        </button>

        <div className="flex items-center gap-2">
          {isNarration && (
            <button
              type="button"
              className="pp-btn-secondary"
              onClick={narrationFinished ? replay : togglePlay}
            >
              {playing ? "Pause" : narrationFinished ? "Replay" : "Play"}
            </button>
          )}

          {isLast ? (
            <button type="button" className="pp-btn-primary" onClick={onStart}>
              {startLabel}
              <ChevronRightIcon size={16} />
            </button>
          ) : (
            <button type="button" className="pp-btn-primary" onClick={() => goTo(index + 1)}>
              Next
              <ChevronRightIcon size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
