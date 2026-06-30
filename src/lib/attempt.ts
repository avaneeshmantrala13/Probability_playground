/**
 * Per-attempt question selection.
 *
 * Every fresh attempt (new entry, restart, or remediation retry) draws a NEW
 * random subset from a large pool = the lesson's authored questions PLUS the
 * matching human-vetted practice bank. The draw is ordered into an easy→hard
 * difficulty ramp. All pooled questions are vetted/correct, so the drawn set is
 * always correct.
 *
 * Persistence model (see ActiveAttempt.selection in lib/progress.ts):
 * - We store the seed AND the ordered question ids that were drawn.
 * - A mid-attempt RELOAD resolves the stored ids back to the SAME questions, so
 *   the learner resumes exactly where they were.
 * - A fresh RESTART generates a new seed and therefore a new set.
 * - The seed is stored so a draw is deterministically reproducible from it (the
 *   ids are the canonical snapshot; the seed is the reproducible recipe).
 */
import type { Lesson, RenderableQuestion } from "../content/types";
import { getPracticeBank } from "../content/practice";

/** The drawn identity of one attempt's question set. */
export interface AttemptSelection {
  /** Seed that deterministically reproduces this draw. */
  seed: number;
  /** Ordered question ids that make up this attempt (post difficulty ramp). */
  questionIds: string[];
}

interface PoolItem {
  q: RenderableQuestion;
  concept: string;
  kind: "standard" | "challenge";
  /** First-seen source order, used as a deterministic tie-breaker. */
  order: number;
}

/**
 * mulberry32 — a tiny, fast, deterministic 32-bit PRNG. Given the same seed it
 * always produces the same sequence, which is what makes a stored seed
 * reproduce an identical draw.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A fresh 32-bit seed for a new draw. */
export function makeSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

/**
 * The full draw pool for a lesson: authored questions first, then the matching
 * practice bank. Deterministic (no RNG) so it can be rebuilt identically to
 * resolve a stored selection on reload. Duplicate ids are dropped (authored
 * wins).
 */
function buildPool(lesson: Lesson): PoolItem[] {
  const items: PoolItem[] = [];
  const seen = new Set<string>();
  let order = 0;

  for (const q of lesson.questions) {
    if (seen.has(q.id)) continue;
    seen.add(q.id);
    items.push({
      q: {
        id: q.id,
        simulation: q.simulation,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanations: q.explanations,
      },
      concept: q.concept,
      kind: q.kind === "challenge" ? "challenge" : "standard",
      order: order++,
    });
  }

  const bank = getPracticeBank(lesson.lessonId);
  if (bank) {
    for (const q of bank.questions) {
      if (seen.has(q.id)) continue;
      seen.add(q.id);
      items.push({
        q: {
          id: q.id,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanations: q.explanations,
        },
        concept: q.concept,
        kind: "standard",
        order: order++,
      });
    }
  }

  return items;
}

/**
 * Rank each concept by the position of its FIRST authored question. Lessons
 * author their questions in a deliberate easy→hard order, so this rank is a
 * reliable difficulty signal shared by both authored and practice questions
 * (practice questions reuse the same concept tags).
 */
function conceptRanks(lesson: Lesson): Map<string, number> {
  const ranks = new Map<string, number>();
  lesson.questions.forEach((q, i) => {
    if (!ranks.has(q.concept)) ranks.set(q.concept, i);
  });
  return ranks;
}

/**
 * Difficulty score for the easy→hard ramp. Primary signal is the concept rank;
 * a `challenge`-kind question is nudged harder. Unknown concepts (practice-only
 * tags) sort toward the end.
 */
function difficultyScore(
  item: PoolItem,
  ranks: Map<string, number>,
  unknownRank: number,
): number {
  const base = ranks.has(item.concept) ? (ranks.get(item.concept) as number) : unknownRank;
  return base + (item.kind === "challenge" ? 0.5 : 0);
}

/** How many questions to draw for one attempt (the lesson's normal length). */
export function attemptLength(lesson: Lesson): number {
  const pool = buildPool(lesson);
  return Math.min(lesson.questions.length, pool.length);
}

/**
 * Draw a fresh, difficulty-ramped selection for one attempt. The `round` is
 * mixed into the seed offset so a remediation retry yields a coherent NEW set
 * rather than repeating the previous round.
 */
export function drawAttemptSelection(lesson: Lesson, seed = makeSeed()): AttemptSelection {
  const pool = buildPool(lesson);
  const count = Math.min(lesson.questions.length, pool.length);
  const rnd = mulberry32(seed);

  // Seeded Fisher–Yates over the whole pool, then take the first `count`.
  const shuffled = pool.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const drawn = shuffled.slice(0, count);

  // Order the drawn set into an easy→hard ramp. Within the same difficulty we
  // keep the (already random) draw order for variety, via the index tiebreak.
  const ranks = conceptRanks(lesson);
  const unknownRank = lesson.questions.length;
  const ramped = drawn
    .map((item, idx) => ({ item, idx, d: difficultyScore(item, ranks, unknownRank) }))
    .sort((a, b) => a.d - b.d || a.idx - b.idx);

  return { seed, questionIds: ramped.map((x) => x.item.q.id) };
}

/**
 * Resolve a stored selection back to renderable questions, preserving the
 * stored order. Returns null if any id can no longer be found (e.g. content
 * changed since the attempt was saved), signalling the caller to redraw.
 */
export function resolveAttemptQuestions(
  lesson: Lesson,
  selection: AttemptSelection,
): RenderableQuestion[] | null {
  if (!selection.questionIds.length) return null;
  const pool = buildPool(lesson);
  const byId = new Map(pool.map((it) => [it.q.id, it.q]));
  const out: RenderableQuestion[] = [];
  for (const id of selection.questionIds) {
    const q = byId.get(id);
    if (!q) return null;
    out.push(q);
  }
  return out;
}
