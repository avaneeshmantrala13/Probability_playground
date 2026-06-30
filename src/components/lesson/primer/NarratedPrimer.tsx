import { useCallback, useEffect, useRef, useState } from "react";
import type { NarrationSlide } from "../../../content/types";
import { useSpeech } from "../../../hooks/useSpeech";
import { ChevronRightIcon } from "../../icons";
import { PrimerVisualView } from "./PrimerVisualView";

/** Rough caption duration (ms) when speech audio is unavailable. */
function captionMs(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(4200, words * 360 + 800);
}

/**
 * An auto-advancing, narrated concept primer (the in-app "AI video"). Visuals +
 * synchronized Web Speech narration with always-on captions. Fully usable
 * without audio: when speech synthesis is unavailable, captions auto-advance on
 * a timer instead.
 *
 * Controls: play/pause, previous/next, replay, and skip.
 */
export function NarratedPrimer({
  slides,
  onClose,
  closeLabel = "Continue",
}: {
  slides: NarrationSlide[];
  /** Called when the learner skips or continues past the primer. */
  onClose: () => void;
  closeLabel?: string;
}) {
  const { supported, speak, cancel } = useSpeech();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  // Latest advance handler, kept in a ref so the speech onEnd callback always
  // calls the current logic without re-subscribing.
  const advanceRef = useRef<() => void>(() => {});

  const last = slides.length - 1;

  const advance = useCallback(() => {
    setIndex((i) => {
      if (i >= last) {
        setPlaying(false);
        setFinished(true);
        return i;
      }
      return i + 1;
    });
  }, [last]);
  advanceRef.current = advance;

  // Drive narration/auto-advance whenever the active slide or play state changes.
  useEffect(() => {
    if (!playing) return;
    const slide = slides[index];
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (supported) {
      speak(slide.caption, () => advanceRef.current());
    } else {
      timer = setTimeout(() => advanceRef.current(), captionMs(slide.caption));
    }
    return () => {
      cancel();
      if (timer) clearTimeout(timer);
    };
  }, [playing, index, supported, slides, speak, cancel]);

  // Stop any speech if the component unmounts.
  useEffect(() => () => cancel(), [cancel]);

  const togglePlay = useCallback(() => {
    setFinished(false);
    setPlaying((p) => !p);
  }, []);

  const goTo = useCallback((i: number) => {
    setFinished(false);
    setIndex(Math.min(Math.max(i, 0), slides.length - 1));
  }, [slides.length]);

  const replay = useCallback(() => {
    setFinished(false);
    setIndex(0);
    setPlaying(true);
  }, []);

  const skip = useCallback(() => {
    cancel();
    setPlaying(false);
    onClose();
  }, [cancel, onClose]);

  if (slides.length === 0) return null;
  const slide = slides[index];

  return (
    <div className="pp-card overflow-hidden">
      {/* Stage */}
      <div className="relative bg-gradient-to-br from-accent/10 via-surface to-surface px-6 py-8 sm:px-8 sm:py-10">
        <div className="mb-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent">
            <span className={playing ? "animate-pulse" : ""}>●</span>
            Concept primer
          </span>
          <span className="text-xs font-medium text-muted">
            {index + 1} / {slides.length}
          </span>
        </div>

        {slide.term && (
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            {slide.term}
          </p>
        )}
        <h2 className="mt-1 text-xl font-bold text-primary sm:text-2xl">{slide.title}</h2>

        {slide.visual && (
          <div className="mt-5">
            <PrimerVisualView visual={slide.visual} />
          </div>
        )}

        {slide.bullets && slide.bullets.length > 0 && (
          <ul className="mt-5 space-y-2">
            {slide.bullets.map((b, i) => (
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
        <p className="mt-1 leading-relaxed text-primary">{slide.caption}</p>
        {!supported && (
          <p className="mt-2 text-xs text-secondary">
            Narration audio isn&apos;t available in this browser — captions advance
            automatically.
          </p>
        )}
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5 px-6 pt-4">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={[
              "h-2 rounded-full transition-all",
              i === index ? "w-6 bg-accent" : "w-2 bg-subtle hover:bg-accent/50",
            ].join(" ")}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 sm:px-8">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="pp-btn-secondary"
            disabled={index === 0}
            onClick={() => goTo(index - 1)}
          >
            Prev
          </button>
          <button type="button" className="pp-btn-primary" onClick={togglePlay}>
            {playing ? "Pause" : finished ? "Replay" : "Play"}
          </button>
          {!finished && (
            <button
              type="button"
              className="pp-btn-secondary"
              disabled={index === last}
              onClick={() => goTo(index + 1)}
            >
              Next
            </button>
          )}
          {finished && (
            <button type="button" className="pp-btn-secondary" onClick={replay}>
              Replay
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={skip}
          className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline"
        >
          {finished ? closeLabel : "Skip primer"}
          <ChevronRightIcon size={16} />
        </button>
      </div>
    </div>
  );
}
