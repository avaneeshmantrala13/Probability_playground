import type { GeneratedQuestion } from "../ai/client";
import { rewordQuestionStem } from "../ai/client";
import { generateLocalQuestion } from "../templatedQuestions";

export interface BonusQuestionOpts {
  lessonId: string;
  title?: string;
  topics?: string[];
  order?: number;
  conceptHint?: string;
}

/** Numeric value of an option (fraction/decimal/percent/money), else null. */
function optionValue(raw: string): number | null {
  let s = raw.trim().replace(/\s+/g, "");
  s = s.replace(/^-\$/, "-").replace(/^\$/, "");
  if (/^[-+]?\d*\.?\d+%$/.test(s)) return parseFloat(s) / 100;
  const frac = /^([-+]?\d+)\/(\d+)$/.exec(s);
  if (frac) {
    const d = Number(frac[2]);
    return d === 0 ? null : Number(frac[1]) / d;
  }
  if (/^[-+]?\d*\.?\d+$/.test(s)) return Number(s);
  return null;
}

/** True if any two options share the same numeric value (e.g. 1/5 and 2/10). */
function hasDuplicateValues(options: string[]): boolean {
  const vals = options.map(optionValue);
  for (let i = 0; i < vals.length; i++)
    for (let j = i + 1; j < vals.length; j++) {
      const a = vals[i];
      const b = vals[j];
      if (a !== null && b !== null && Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b)))
        return true;
    }
  return false;
}

/** Sorted multiset of numeric tokens in a string (used to confirm a reword kept every number). */
function numericTokens(s: string): string[] {
  return (s.match(/\d+(?:\.\d+)?/g) ?? []).slice().sort();
}

function sameNumbers(a: string, b: string): boolean {
  const x = numericTokens(a);
  const y = numericTokens(b);
  return x.length === y.length && x.every((v, i) => v === y[i]);
}

/** Structurally sound MCQ: valid index, 4 distinct option texts, no equal values. */
function isWellFormed(q: { options: string[]; correctAnswer: number }): boolean {
  if (q.options.length < 2) return false;
  if (q.correctAnswer < 0 || q.correctAnswer >= q.options.length) return false;
  if (new Set(q.options.map((o) => o.trim())).size !== q.options.length) return false;
  if (hasDuplicateValues(q.options)) return false;
  return true;
}

/**
 * Produce a bonus practice question whose correct answer is GUARANTEED present
 * and selected, via one of two trusted sources only:
 *
 *   1. A code-computed template (answer owned by code). The LLM may rephrase the
 *      wording for variety, but we keep the code options/answer and verify every
 *      number survived the reword — otherwise we keep the code wording.
 *   2. A human-vetted curated bank question (served verbatim).
 *
 * Free-form LLM answers are never used. Throws if no trusted source exists.
 */
export async function getVerifiedBonusQuestion(
  opts: BonusQuestionOpts,
): Promise<GeneratedQuestion> {
  // 1. Code-computed template (correct by construction).
  const local = generateLocalQuestion(opts);
  if (local && isWellFormed(local)) {
    try {
      const reworded = await rewordQuestionStem(local.question);
      if (
        reworded &&
        reworded.length >= 8 &&
        reworded.length <= local.question.length * 2 + 80 &&
        sameNumbers(local.question, reworded)
      ) {
        // Only the wording changed; options + answer remain code-owned.
        return { ...local, question: reworded };
      }
    } catch {
      /* keep the code wording */
    }
    return local;
  }

  // 2. Human-vetted curated bank (never free-form LLM). Lazy-loaded so the large
  // bank JSON stays out of the main bundle until a non-templated lesson needs it.
  const { getPracticeBank } = await import("../../content/practice");
  const bank = getPracticeBank(opts.lessonId);
  if (bank && bank.questions.length) {
    const shuffled = [...bank.questions].sort(() => Math.random() - 0.5);
    for (const q of shuffled) {
      if (!isWellFormed(q)) continue;
      return {
        id: `bank-${q.id}-${Date.now()}`,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        concept: q.concept,
        kind: "standard",
        explanations: q.explanations,
      };
    }
  }

  throw new Error("No verified practice question is available for this lesson yet.");
}
