import type { GeneratedQuestion } from "../ai/client";
import type { Method } from "./method";

/** Tiny RNG facade so templates read cleanly. Backed by Math.random. */
export interface RNG {
  int(lo: number, hi: number): number;
  pick<T>(arr: readonly T[]): T;
  shuffle<T>(arr: readonly T[]): T[];
}

export function makeRng(): RNG {
  const int = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));
  return {
    int,
    pick: <T>(arr: readonly T[]): T => arr[int(0, arr.length - 1)],
    shuffle: <T>(arr: readonly T[]): T[] => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = int(0, i);
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
  };
}

export interface Choice {
  text: string;
  why: string;
}

export interface BuiltQuestion {
  question: string;
  concept: string;
  correct: Choice;
  /** Provide 4+ candidate distractors; the engine selects 3 with distinct text. */
  distractors: Choice[];
}

export interface Template {
  id: string;
  /**
   * The SOLUTION METHOD this template exercises. Selection prefers a template
   * whose method matches the current question's method, so a counting-outcomes
   * question never yields an event-probability bonus and vice versa.
   */
  method: Method;
  /** Lesson ids this template is appropriate for. */
  lessons: string[];
  /** Lowercase substrings matched against lesson title/topics/conceptHint. */
  keywords: string[];
  build: (rng: RNG) => BuiltQuestion;
}

const LETTERS = ["A", "B", "C", "D"] as const;

/**
 * Turn a built question into a 4-option MCQ. Guarantees four DISTINCT option
 * texts (and since numeric options are canonical reduced fractions/integers,
 * distinct text means distinct value). Returns null if fewer than 3 distinct
 * distractors are available so the caller can fall back.
 */
export function assemble(
  lessonId: string,
  built: BuiltQuestion,
  rng: RNG,
): GeneratedQuestion | null {
  const correctText = built.correct.text.trim();
  const seen = new Set<string>([correctText]);
  const picks: Choice[] = [];
  for (const d of built.distractors) {
    const t = d.text.trim();
    if (seen.has(t)) continue;
    seen.add(t);
    picks.push({ text: t, why: d.why });
    if (picks.length === 3) break;
  }
  if (picks.length < 3) return null;

  const tagged = rng.shuffle([
    { text: correctText, why: built.correct.why, correct: true },
    ...picks.map((d) => ({ ...d, correct: false })),
  ]);

  const options = tagged.map((t) => t.text);
  const correctAnswer = tagged.findIndex((t) => t.correct);
  const explanations: Record<"A" | "B" | "C" | "D", string> = { A: "", B: "", C: "", D: "" };
  tagged.forEach((t, i) => {
    explanations[LETTERS[i]] = t.correct ? `Correct. ${t.why}` : t.why;
  });

  return {
    id: `tpl-${lessonId}-${Date.now()}-${rng.int(1000, 9999)}`,
    question: built.question,
    options,
    correctAnswer,
    concept: built.concept,
    kind: "standard",
    explanations,
  };
}
