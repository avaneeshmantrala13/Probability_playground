import type { GeneratedQuestion } from "../ai/client";
import { rewordQuestionStem } from "../ai/client";
import { generateLocalQuestion } from "../templatedQuestions";
import { inferMethod, type Method } from "../templatedQuestions/method";

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
 * Relevance score between a target concept and a candidate concept. Combines a
 * METHOD-level signal (same solution method as the current question is the
 * strongest possible relevance) with shared word tokens and exact-string
 * equality. 0 means no overlap.
 */
function conceptScore(target: Set<string>, candidate: string, targetMethod: Method | null): number {
  if (target.size === 0) return 0;
  const norm = candidate.toLowerCase().trim();
  const cand = conceptTokens(candidate);
  let shared = 0;
  for (const t of target) if (cand.has(t)) shared++;
  // Same solution method dominates topic-word overlap so a same-topic but
  // different-method candidate (e.g. a dice-sum probability for a counting
  // question) can never out-score a true same-method one.
  const method = targetMethod && inferMethod(candidate) === targetMethod ? 1000 : 0;
  // Exact normalized equality is the next-strongest signal.
  const exact = norm === [...target].join(" ") ? 100 : 0;
  return method + exact + shared;
}

/**
 * Pick the curated questions most relevant to the current question. METHOD match
 * is preferred above all else: if any well-formed candidate shares the current
 * question's solution method, only same-method candidates are considered, so a
 * same-topic / different-method question is never served. Within that pool the
 * highest token-overlap candidates win. Falls back to the full set when no hint
 * is given so a bonus is always available.
 */
function selectRelevant<T extends { concept?: string; options: string[]; correctAnswer: number }>(
  questions: T[],
  conceptHint: string | undefined,
  targetMethod: Method | null = null,
): T[] {
  const wellFormed = questions.filter((q) => isWellFormed(q));
  if (!conceptHint || !conceptHint.trim()) return wellFormed;

  const target = conceptTokens(conceptHint);
  if (target.size === 0) return wellFormed;

  let best = 0;
  const scored = wellFormed.map((q) => {
    const s = conceptScore(target, q.concept ?? "", targetMethod);
    if (s > best) best = s;
    return { q, s };
  });
  if (best <= 0) return wellFormed; // no overlap anywhere — keep full pool
  return scored.filter((x) => x.s === best).map((x) => x.q);
}

/**
 * Curated candidates whose solution METHOD matches the current question's
 * method. Used as the second-choice source (after a same-method template):
 * human-vetted and served verbatim. Returns [] when no method is known or no
 * candidate matches, so the caller can fall through to other sources.
 */
function selectByMethod<T extends { concept?: string; options: string[]; correctAnswer: number }>(
  questions: T[],
  targetMethod: Method | null,
): T[] {
  if (!targetMethod) return [];
  return questions.filter((q) => isWellFormed(q) && inferMethod(q.concept ?? "") === targetMethod);
}

/** Structurally sound MCQ: valid index, 4 distinct option texts, no equal values. */
function isWellFormed(q: { options: string[]; correctAnswer: number }): boolean {
  if (q.options.length < 2) return false;
  if (q.correctAnswer < 0 || q.correctAnswer >= q.options.length) return false;
  if (new Set(q.options.map((o) => o.trim())).size !== q.options.length) return false;
  if (hasDuplicateValues(q.options)) return false;
  return true;
}

/** Reword a code-owned template's stem (LLM never owns the answer). Keeps the
 *  code wording unless the reword preserved every number exactly. */
async function rewordLocal(local: GeneratedQuestion): Promise<GeneratedQuestion> {
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

/** Serve a curated bank question verbatim (correctness is human-vetted). */
function toGenerated(q: {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  concept?: string;
  explanations: { A: string; B: string; C: string; D: string };
}): GeneratedQuestion {
  return {
    id: `bank-${q.id}-${Date.now()}`,
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
    concept: q.concept ?? "",
    kind: "standard",
    explanations: q.explanations,
  };
}

/**
 * Produce a bonus practice question whose correct answer is GUARANTEED present
 * and selected, via trusted sources only (free-form LLM answers are never used).
 *
 * The bonus must share the current question's CONCEPT *and METHOD* — only the
 * numbers/scenario change. Sources are tried in order of how well they preserve
 * that guarantee:
 *
 *   1. A same-METHOD code-computed template (answer owned by code; the LLM may
 *      only reword the stem with every number preserved).
 *   2. A same-METHOD human-vetted curated question (served verbatim).
 *   3. Any code-computed template for the lesson (still correct by construction)
 *      — preferred over a loosely-related, different-method curated pull.
 *   4. The most topically-relevant curated question (last resort).
 *
 * Throws if no trusted source exists.
 */
export async function getVerifiedBonusQuestion(
  opts: BonusQuestionOpts,
): Promise<GeneratedQuestion> {
  const targetMethod = inferMethod(opts.conceptHint) ?? inferMethod(opts.topic);

  // 1. Same-method template (strongest: correct by construction AND method-locked).
  const localStrict = generateLocalQuestion({ ...opts, strictMethod: true });
  if (localStrict && isWellFormed(localStrict)) return rewordLocal(localStrict);

  // Curated bank is lazy-loaded so the large JSON stays out of the main bundle
  // until a non-templated lesson needs it.
  const { getPracticeBank } = await import("../../content/practice");
  const bank = getPracticeBank(opts.lessonId);

  // 2. Same-method curated question (human-vetted, verbatim).
  if (bank && bank.questions.length) {
    const sameMethod = selectByMethod(bank.questions, targetMethod);
    if (sameMethod.length) {
      const q = sameMethod[Math.floor(Math.random() * sameMethod.length)];
      return toGenerated(q);
    }
  }

  // 3. Any template for this lesson — still correct by construction, and a better
  //    bonus than a different-method curated question.
  const localAny = generateLocalQuestion(opts);
  if (localAny && isWellFormed(localAny)) return rewordLocal(localAny);

  // 4. Topic-level curated relevance (last resort, never free-form LLM). Method
  //    is still preferred inside selectRelevant when any candidate matches.
  if (bank && bank.questions.length) {
    const relevant = selectRelevant(bank.questions, opts.conceptHint, targetMethod);
    const shuffled = [...relevant].sort(() => Math.random() - 0.5);
    for (const q of shuffled) {
      if (!isWellFormed(q)) continue;
      return toGenerated(q);
    }
  }

  throw new Error("No verified practice question is available for this lesson yet.");
}
