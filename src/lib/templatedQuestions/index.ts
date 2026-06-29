import type { GeneratedQuestion } from "../ai/client";
import { assemble, makeRng } from "./engine";
import { TEMPLATES } from "./templates";

/**
 * Produce a code-computed practice question for the given lesson, or null if no
 * template applies (caller should fall back to the verified-LLM generator).
 *
 * Every question this returns has its answer key computed in code, so it is
 * correct by construction — no model is trusted for the math.
 */
export function generateLocalQuestion(opts: {
  lessonId: string;
  title?: string;
  topics?: string[];
  order?: number;
  conceptHint?: string;
}): GeneratedQuestion | null {
  const hay = [opts.title ?? "", ...(opts.topics ?? []), opts.conceptHint ?? ""]
    .join(" ")
    .toLowerCase();

  const matches = TEMPLATES.filter(
    (t) => t.lessons.includes(opts.lessonId) || t.keywords.some((k) => hay.includes(k)),
  );
  if (matches.length === 0) return null;

  const rng = makeRng();
  // Try a few picks so the rare "couldn't find 3 distinct distractors" case
  // doesn't bubble up as a failure.
  for (let i = 0; i < 8; i++) {
    const tpl = rng.pick(matches);
    const q = assemble(opts.lessonId, tpl.build(rng), rng);
    if (q) return q;
  }
  return null;
}

/** True if at least one template covers this lesson (for UI/copy decisions). */
export function hasLocalTemplate(lessonId: string): boolean {
  return TEMPLATES.some((t) => t.lessons.includes(lessonId));
}
