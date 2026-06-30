import type { GeneratedQuestion } from "../ai/client";
import { rewordQuestionStem } from "../ai/client";
import { generateLocalQuestion } from "../templatedQuestions";

export interface BonusQuestionOpts {
  lessonId: string;
  title?: string;
  topics?: string[];
  order?: number;
  /**
   * The CURRENT question's concept tag. Used to keep the bonus topically
   * relevant: template selection keys off it, and the curated-bank fallback is
   * filtered to the closest-matching concept rather than a pure random shuffle.
   */
  conceptHint?: string;
  /** The current question's lesson topic (extra signal for template matching). */
  topic?: string;
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

/** Normalize a concept/topic tag into a set of comparable word tokens. */
function conceptTokens(raw: string): Set<string> {
  return new Set(
    raw
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter((w) => w.length > 1),
  );
}

/**
 * Relevance score between a target concept and a candidate concept: the number
 * of shared word tokens, with an exact-string match boosted so it always wins.
 * 0 means no overlap.
 */
function conceptScore(target: Set<string>, candidate: string): number {
  if (target.size === 0) return 0;
  const norm = candidate.toLowerCase().trim();
  const cand = conceptTokens(candidate);
  let shared = 0;
  for (const t of target) if (cand.has(t)) shared++;
  // Exact normalized equality is the strongest possible signal.
  const exact = norm === [...target].join(" ") ? 100 : 0;
  return shared + exact;
}

/**
 * Pick the curated questions most topically relevant to `conceptHint`. Returns
 * the highest-scoring well-formed questions; if nothing overlaps (or no hint was
 * given) it falls back to the full set so a bonus is still available.
 */
function selectRelevant<T extends { concept?: string; options: string[]; correctAnswer: number }>(
  questions: T[],
  conceptHint: string | undefined,
): T[] {
  const wellFormed = questions.filter((q) => isWellFormed(q));
  if (!conceptHint || !conceptHint.trim()) return wellFormed;

  const target = conceptTokens(conceptHint);
  if (target.size === 0) return wellFormed;

  let best = 0;
  const scored = wellFormed.map((q) => {
    const s = conceptScore(target, q.concept ?? "");
    if (s > best) best = s;
    return { q, s };
  });
  if (best <= 0) return wellFormed; // no overlap anywhere — keep full pool
  return scored.filter((x) => x.s === best).map((x) => x.q);
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
    // Filter to the questions whose concept best matches the current question's
    // concept, then shuffle WITHIN that relevant subset for variety. This keeps
    // the bonus on the same specific topic instead of a random same-lesson pull.
    const relevant = selectRelevant(bank.questions, opts.conceptHint);
    const shuffled = [...relevant].sort(() => Math.random() - 0.5);
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
