import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Thin wrapper around the browser Web Speech API (window.speechSynthesis) for
 * the narrated concept primer. No paid APIs, no keys, no dependencies.
 *
 * Degrades gracefully: when speech synthesis is unavailable, `supported` is
 * false and callers fall back to caption-only auto-advance.
 */
export interface SpeechController {
  supported: boolean;
  /** Speak `text`; `onEnd` fires when finished (or errors), unless superseded. */
  speak: (text: string, onEnd?: () => void) => void;
  /** Stop any current/queued speech. */
  cancel: () => void;
}

export function useSpeech(): SpeechController {
  const [supported] = useState(
    () => typeof window !== "undefined" && "speechSynthesis" in window,
  );
  // Token invalidates stale onend callbacks after a cancel / new utterance, so
  // a late-firing 'end' from a superseded utterance can't trigger an advance.
  const tokenRef = useRef(0);

  // Warm the voice list (some browsers populate it asynchronously).
  useEffect(() => {
    if (!supported) return;
    const warm = () => window.speechSynthesis.getVoices();
    warm();
    window.speechSynthesis.addEventListener?.("voiceschanged", warm);
    return () => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", warm);
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  const cancel = useCallback(() => {
    if (!supported) return;
    tokenRef.current += 1;
    window.speechSynthesis.cancel();
  }, [supported]);

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!supported) return;
      window.speechSynthesis.cancel();
      const myToken = (tokenRef.current += 1);
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.98;
      u.pitch = 1;
      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find((v) => /en[-_]US/i.test(v.lang) && /female|samantha|zira|aria/i.test(v.name)) ??
        voices.find((v) => /en[-_]US/i.test(v.lang)) ??
        voices.find((v) => /^en/i.test(v.lang));
      if (preferred) u.voice = preferred;
      const done = () => {
        if (myToken === tokenRef.current) onEnd?.();
      };
      u.onend = done;
      u.onerror = done;
      window.speechSynthesis.speak(u);
    },
    [supported],
  );

  return { supported, speak, cancel };
}
