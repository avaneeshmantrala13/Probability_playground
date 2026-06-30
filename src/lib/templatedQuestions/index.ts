import type { GeneratedQuestion } from "../ai/client";
import { assemble, makeRng } from "./engine";
import { inferMethod } from "./method";
import { TEMPLATES } from "./templates";

/**
 * Produce a code-computed practice question for the given lesson, or null if no
 * template applies (caller should fall back to the curated bank / verified-LLM
 * generator).
 *
 * Every question this returns has its answer key computed in code, so it is
 * correct by construction — no model is trusted for the math.
 *
 * Selection is METHOD-aware: when the current question's method can be inferred
 * (e.g. counting outcomes vs. event probability) we only serve templates that
 * use the SAME method, so a counting question never produces a probability bonus
 * and vice versa. With `strictMethod`, if no same-method template exists we
 * return null instead of falling back to a different method — letting the caller
 * try a same-method curated question first.
 */
export function generateLocalQuestion(opts: {
  lessonId: string;
  title?: string;
  topics?: string[];
  order?: number;
  conceptHint?: string;
  topic?: string;
  /** Return null rather than a different-method template when no method match. */
  strictMethod?: boolean;
}): GeneratedQuestion | null {
  const hay = [opts.title ?? "", ...(opts.topics ?? []), opts.topic ?? "", opts.conceptHint ?? ""]
    .join(" ")
    .toLowerCase();
  // The current question's concept/topic is the strongest relevance signal.
  const conceptHay = [opts.conceptHint ?? "", opts.topic ?? ""].join(" ").toLowerCase();
  const targetMethod = inferMethod(opts.conceptHint) ?? inferMethod(opts.topic);

  const matches = TEMPLATES.filter(
    (t) => t.lessons.includes(opts.lessonId) || t.keywords.some((k) => hay.includes(k)),
  );
  if (matches.length === 0) return null;

  // METHOD-level match is the strongest signal: same concept AND same method.
  const methodMatches = targetMethod ? matches.filter((t) => t.method === targetMethod) : [];

  let pickFrom: typeof matches;
  if (methodMatches.length > 0) {
    pickFrom = methodMatches;
  } else if (opts.strictMethod && targetMethod) {
    // A method was identified but no template uses it — defer to the caller so a
    // same-method curated question can be served instead of switching methods.
    return null;
  } else {
    // Fall back to keyword-level concept matching, then any lesson template.
    const conceptMatches = matches.filter((t) => t.keywords.some((k) => conceptHay.includes(k)));
    pickFrom = conceptMatches.length > 0 ? conceptMatches : matches;
  }

  const rng = makeRng();
  // Try a few picks so the rare "couldn't find 3 distinct distractors" case
  // doesn't bubble up as a failure.
  for (let i = 0; i < 8; i++) {
    const tpl = rng.pick(pickFrom);
    const q = assemble(opts.lessonId, tpl.build(rng), rng);
    if (q) return q;
  }
  return null;
}

/** True if at least one template covers this lesson (for UI/copy decisions). */
export function hasLocalTemplate(lessonId: string): boolean {
  return TEMPLATES.some((t) => t.lessons.includes(lessonId));
}
