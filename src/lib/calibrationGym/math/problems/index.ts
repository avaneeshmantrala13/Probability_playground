import { type RNG, mulberry32, choice } from "../../rng";
import type {
  Family,
  ProblemInstance,
  ProblemTemplate,
} from "./types";
import { coinTemplates } from "./coin";
import { bayesTemplates } from "./bayes";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ALL_TEMPLATES: ProblemTemplate<any>[] = [
  ...coinTemplates,
  ...bayesTemplates,
];

const BY_TYPE = new Map<string, ProblemTemplate<any>>(
  ALL_TEMPLATES.map((t) => [t.type, t]),
);

export const FAMILIES: { id: Family; label: string; blurb: string }[] = [
  {
    id: "coin-flip",
    label: "Coin-flip games",
    blurb:
      "Exact probabilities and expected waiting times for biased-coin experiments.",
  },
  {
    id: "bayes",
    label: "Conditional probability & Bayes",
    blurb:
      "Base-rate / disease-testing, Monty Hall, and two-child paradoxes with exact posteriors.",
  },
];

export function templatesForFamily(family?: Family) {
  return family ? ALL_TEMPLATES.filter((t) => t.family === family) : ALL_TEMPLATES;
}

export function templateInfo() {
  return ALL_TEMPLATES.map((t) => ({
    type: t.type,
    family: t.family,
    mode: t.mode,
    label: t.label,
  }));
}

/** Deterministically build a full instance (with ground truth) from a seed. */
export function buildFromSeed(seed: string): ProblemInstance {
  const parsed = JSON.parse(seed) as { type: string; params: unknown };
  const template = BY_TYPE.get(parsed.type);
  if (!template) throw new Error(`Unknown problem type: ${parsed.type}`);
  return template.build(parsed.params);
}

/**
 * Generate a fresh instance of a *specific* template type (not just a random
 * one from a family). Reuses the same sample()/build() pipeline as the rest of
 * the generator so there is no duplicated problem logic; the diagnostic uses
 * this to serve a fixed, per-topic set of items.
 */
export function generateProblemOfType(type: string, rng: RNG): ProblemInstance {
  const template = BY_TYPE.get(type);
  if (!template) throw new Error(`Unknown problem type: ${type}`);
  return template.build(template.sample(rng));
}

export function hasProblemType(type: string): boolean {
  return BY_TYPE.has(type);
}

/** Generate a fresh random instance, optionally restricted to a family. */
export function generateProblem(opts?: {
  family?: Family;
  rng?: RNG;
}): ProblemInstance {
  const rng = opts?.rng ?? mulberry32((Math.random() * 2 ** 32) >>> 0);
  const pool = templatesForFamily(opts?.family);
  const template = choice(rng, pool);
  const params = template.sample(rng);
  return template.build(params);
}

/** Deterministic batch (used by the LLM leaderboard and DATASET_REVIEW). */
export function generateBatch(n: number, seed = 12345, family?: Family): ProblemInstance[] {
  const rng = mulberry32(seed >>> 0);
  const out: ProblemInstance[] = [];
  const pool = templatesForFamily(family);
  for (let i = 0; i < n; i++) {
    const template = choice(rng, pool);
    const params = template.sample(rng);
    out.push(template.build(params));
  }
  return out;
}

export * from "./types";
