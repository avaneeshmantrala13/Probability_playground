import { Fraction, F, pct } from "../frac";
import { type RNG, randInt, choice } from "../../rng";

export interface Proposition {
  threshold: Fraction;
  direction: "greater" | "less";
  resolvesTrue: boolean;
  text: (quantity: string) => string;
}

/**
 * Turn an exact probability `value` into a crisp, unambiguously-resolvable
 * yes/no proposition of the form "P(...) is greater/less than t", where t is a
 * 5%-grid fraction chosen a step or two away from the truth so there is a
 * definite margin (resolution is computed with exact rational comparison, so
 * even a value that lands on the grid is handled correctly).
 */
export function makeProposition(value: Fraction, rng: RNG): Proposition {
  const v = value.valueOf(); // decimal in [0,1]
  const nearest = Math.round(v / 0.05); // nearest 5% grid line
  // Step 1-2 grid lines away, direction random, keep threshold in (0,1).
  let step = choice(rng, [-2, -1, 1, 2]);
  let count = nearest + step;
  if (count <= 0) count = nearest + Math.abs(step);
  if (count >= 20) count = nearest - Math.abs(step);
  if (count <= 0) count = 1;
  if (count >= 20) count = 19;

  let threshold = F(count, 20);
  // Guarantee a strict margin: if truth equals threshold exactly, nudge.
  let cmp = value.compare(threshold);
  if (cmp === 0) {
    count = count > 1 ? count - 1 : count + 1;
    threshold = F(count, 20);
    cmp = value.compare(threshold);
  }

  const direction: "greater" | "less" =
    randInt(rng, 0, 1) === 0 ? "greater" : "less";
  const resolvesTrue = direction === "greater" ? cmp > 0 : cmp < 0;

  const tPct = pct(threshold.valueOf(), 0);
  const text = (quantity: string) =>
    `${quantity} is ${direction} than ${tPct}.`;

  return { threshold, direction, resolvesTrue, text };
}
