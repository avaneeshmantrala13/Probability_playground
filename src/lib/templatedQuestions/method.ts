/**
 * METHOD-level (sub-concept) taxonomy.
 *
 * A bonus question must share not only the broad TOPIC of the current question
 * but the actual SOLUTION METHOD. "How many outcomes when you flip 5 coins?"
 * (counting outcomes via the product rule, answer 2^5) and "What is P(sum = 7)
 * with two dice?" (an event-probability calculation) live in the same topic but
 * use different methods, so the latter must never be served as a bonus for the
 * former.
 *
 * `inferMethod` maps a raw concept/topic signal (a curated concept tag like
 * "sample_space", or free-form lesson text) to one of these methods. Templates
 * carry an explicit `method` (see engine.ts) so selection can match on method,
 * not just shared words.
 */
export type Method =
  | "counting-outcomes" // size of a sample space via the product/multiplication rule (2^k, m^n, a^L, …)
  | "permutations" // ordered arrangements P(n,k), n!, circular/multiset permutations
  | "combinations" // unordered selections C(n,k), stars-and-bars
  | "inclusion-exclusion" // |A ∪ B| counting (not a probability)
  | "event-probability" // probability of an event in an equally-likely space
  | "complement" // complement rule / complementary counting
  | "conditional-probability" // conditional probability, drawing without replacement, Bayes
  | "expected-value" // expected value / expectation
  | "mean" // arithmetic mean
  | "median" // median
  | "fair-value" // market-making: mid price
  | "spread" // market-making: bid-ask spread
  | "pot-odds"; // poker: pot odds / break-even equity / EV of a call

/** Normalize a signal to a lowercase, space-delimited string for substring tests. */
function norm(signal: string): string {
  return ` ${signal.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;
}

/**
 * Infer the solution METHOD from a concept tag or free-form topic string.
 * Returns null when no method can be determined (caller then falls back to
 * topic-level matching). Order matters: more specific signals are checked first
 * so e.g. "counting_for_probability" resolves to event-probability (it computes
 * a probability) while "sample_space" resolves to counting-outcomes.
 */
export function inferMethod(signal: string | undefined | null): Method | null {
  if (!signal || !signal.trim()) return null;
  const s = norm(signal);
  const has = (...needles: string[]) => needles.some((n) => s.includes(n));

  // Expected value first — "expected_value_two_dice" etc. would otherwise be
  // grabbed by the dice/probability rules below.
  if (has("expected value", "expectation") || / ev /.test(s) || has("expected")) return "expected-value";

  if (has("median")) return "median";
  if (has("mean", "average")) return "mean";

  // Complement (incl. complementary counting) before the generic counting rule.
  if (has("complement")) return "complement";

  if (has("conditional", "without replacement", "replacement", "bayes", "restricted sample"))
    return "conditional-probability";

  // Anything explicitly about a PROBABILITY (or equally-likely outcomes) is an
  // event-probability calculation — this is what keeps dice-sum probabilities
  // ("counting_for_probability", "equally_likely_outcomes") out of pure-counting
  // bonuses.
  if (has("probability", "equally likely", "likely", "axiom", "disjoint", "bounds", "odds of"))
    return "event-probability";

  if (has("inclusion", "exclusion")) return "inclusion-exclusion";

  if (has("permutation", "factorial", "arrangement", "arrange")) return "permutations";

  if (has("combination", "combo", "stars", "choose", "committee", "selection")) return "combinations";

  // Pure counting of outcomes (size of the sample space) via the product rule.
  if (
    has(
      "sample space",
      "multiplication rule",
      "product rule",
      "counting principle",
      "counting outcomes",
      "possible outcomes",
      "how many outcomes",
      "number of outcomes",
      "outcomes",
    )
  )
    return "counting-outcomes";

  // Market making.
  if (has("fair value", "mid price", "midpoint", "fair price", "mid")) return "fair-value";
  if (has("spread", "bid", "ask", "offer")) return "spread";

  // Poker pot odds family.
  if (has("pot", "odds", "equity", "breakeven", "break even", "outs", "implied")) return "pot-odds";

  return null;
}
