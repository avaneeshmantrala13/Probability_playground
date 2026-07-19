import type { RNG } from "../../rng";

export type ProblemMode = "proposition" | "numeric";
export type Family = "coin-flip" | "bayes";

/**
 * A fully-built problem instance including exact ground truth. The public API
 * strips the truth fields before sending to the browser (see toPublic) so the
 * answer can't be read off the network; the server reconstructs the full
 * instance from `seed` on submission to score it.
 */
export interface ProblemInstance {
  family: Family;
  problemType: string;
  mode: ProblemMode;
  title: string;
  prompt: string;

  // Exact ground truth.
  truthValue: string; // exact "a/b" (or integer) string
  truthDecimal: number; // decimal approximation (for charts / bounds)
  explanation: string; // worked solution, revealed after answering

  // Proposition mode only.
  proposition?: string; // the yes/no claim the user assigns a probability to
  threshold?: string; // exact threshold "a/b"
  resolvesTrue?: boolean; // exact resolution of the proposition

  // Numeric mode only.
  unit?: string; // e.g. "flips"
  suggestedMax?: number; // input upper bound hint for the interval UI

  // Provenance: JSON.stringify({ type, params }); deterministic rebuild key.
  seed: string;
}

/** Public payload: everything the solver needs, with the answer withheld. */
export interface PublicProblem {
  family: Family;
  problemType: string;
  mode: ProblemMode;
  title: string;
  prompt: string;
  proposition?: string;
  threshold?: string; // shown as part of the claim, safe to reveal
  unit?: string;
  suggestedMax?: number;
  seed: string;
}

export function toPublic(p: ProblemInstance): PublicProblem {
  return {
    family: p.family,
    problemType: p.problemType,
    mode: p.mode,
    title: p.title,
    prompt: p.prompt,
    proposition: p.proposition,
    threshold: p.threshold,
    unit: p.unit,
    suggestedMax: p.suggestedMax,
    seed: p.seed,
  };
}

/**
 * A problem template separates parameter sampling from instance building so
 * generation is deterministic and reproducible from a serialized seed.
 */
export interface ProblemTemplate<P> {
  type: string;
  family: Family;
  mode: ProblemMode;
  label: string;
  sample(rng: RNG): P;
  build(params: P): ProblemInstance;
}
