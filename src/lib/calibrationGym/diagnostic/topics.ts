import type { Family } from "../math/problems/types";

/**
 * A diagnostic "topic" is a teachable skill the seminar wants to verify before
 * the lecture. Each topic is backed by one or more of the existing generator
 * template types (see src/lib/calibrationGym/math/problems) — we do NOT invent
 * new problem logic here, we just group the existing templates into the six
 * lecture topics.
 *
 * The six topics are derived directly from the two existing problem families:
 *   Coin-flip:  (a) exactly-k / at-least-k heads
 *               (b) expected flips to the first head
 *               (c) expected flips to a run of r heads
 *   Bayes:      (d) base-rate / disease-testing posterior
 *               (e) Monty Hall (N doors)
 *               (f) two-child conditional
 */
export interface DiagnosticTopic {
  id: string;
  label: string;
  short: string;
  family: Family;
  blurb: string;
  /** Generator template types (from the existing registry) that feed this topic. */
  problemTypes: string[];
}

export const DIAGNOSTIC_TOPICS: DiagnosticTopic[] = [
  {
    id: "coin-counting",
    label: "Coin: exactly-k / at-least-k heads",
    short: "Head counts",
    family: "coin-flip",
    blurb: "Binomial probabilities of a given number of heads in n flips.",
    problemTypes: ["coin-exactly-k", "coin-at-least-k"],
  },
  {
    id: "coin-first-head",
    label: "Coin: expected flips to first head",
    short: "First head",
    family: "coin-flip",
    blurb: "Geometric waiting time, E = 1/p.",
    problemTypes: ["coin-first-success"],
  },
  {
    id: "coin-run",
    label: "Coin: expected flips to a run of heads",
    short: "Run of heads",
    family: "coin-flip",
    blurb: "Expected wait for r heads in a row.",
    problemTypes: ["coin-run"],
  },
  {
    id: "bayes-disease",
    label: "Bayes: disease testing / base rate",
    short: "Base rate",
    family: "bayes",
    blurb: "Posterior probability of disease after a positive test.",
    problemTypes: ["bayes-disease"],
  },
  {
    id: "monty-hall",
    label: "Bayes: Monty Hall (N doors)",
    short: "Monty Hall",
    family: "bayes",
    blurb: "Probability of winning by switching among N doors.",
    problemTypes: ["monty-hall"],
  },
  {
    id: "two-child",
    label: "Bayes: two-child conditional",
    short: "Two-child",
    family: "bayes",
    blurb: "Conditional probability that both children are boys.",
    problemTypes: ["two-child"],
  },
];

export const TOPIC_BY_ID = new Map<string, DiagnosticTopic>(
  DIAGNOSTIC_TOPICS.map((t) => [t.id, t]),
);

/** Reverse lookup: which topic owns a given generator template type. */
export const TOPIC_ID_BY_PROBLEM_TYPE = new Map<string, string>(
  DIAGNOSTIC_TOPICS.flatMap((t) => t.problemTypes.map((pt) => [pt, t.id])),
);
