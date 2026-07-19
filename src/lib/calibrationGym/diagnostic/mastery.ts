// Per-topic mastery scoring for the Starting Diagnostic.
//
// We score every item on TWO dimensions and aggregate them per topic:
//   1. SKILL       - did the student get the answer right (accuracy within
//                    tolerance)? Summarised as a Beta-Binomial posterior over
//                    P(correct) so a lucky 2/2 is not read as certain mastery.
//   2. CALIBRATION - the Brier score of the student's stated confidence
//                    (0 = perfect, 0.25 = a 50/50 coin flip, 1 = confidently
//                    wrong). Lower is better.
//
// Both dimensions reuse the existing proper-scoring engine (see
// src/lib/calibrationGym/scoreInstance.ts and math/scoring.ts): proposition
// items are scored with the standard Brier score; numeric interval items are
// folded onto the same 0..1 Brier scale by treating the stated interval
// confidence as a forecast that the interval covers the truth.

import { betaBinomialPosterior, type BetaPosterior } from "./posterior";

export type MasteryBucket = "not-ready" | "developing" | "mastered";

/**
 * Centralized, documented thresholds. SKILL is measured as the Beta-Binomial
 * posterior MEAN of P(correct) (uncertainty-shrunk accuracy). CALIBRATION is
 * the mean Brier score over the topic's items.
 *
 * Rationale for the chosen numbers:
 *  - 0.25 Brier is exactly a 50/50 coin-flip forecast, so any "ready" student
 *    must be clearly better than chance (<= 0.25 to be Developing, <= 0.15 to
 *    be Mastered).
 *  - The posterior-mean skill cutoffs (0.80 / 0.55) mean that with the default
 *    3 items per topic a perfect 3/3 (posterior mean 4/5 = 0.80) just reaches
 *    Mastered, while 2/3 (0.60) lands in Developing and 0-1/3 is Not-ready.
 *    This deliberately makes single lucky answers insufficient for mastery.
 */
export const MASTERY_CONFIG = {
  mastered: { minSkill: 0.8, maxBrier: 0.15 },
  developing: { minSkill: 0.55, maxBrier: 0.25 },
  // Everything failing the Developing gate on either axis is Not-ready.
  prior: { alpha: 1, beta: 1 }, // uniform Beta(1,1) prior over correctness
  credibleMass: 0.9, // 90% central credible interval for display
  // A proposition forecast counts as "correct" (skill) when it lands on the
  // right side of 50% — i.e. the student committed to the true direction.
  propositionDecisionThreshold: 0.5,
} as const;

export interface ItemScoreInput {
  mode: "proposition" | "numeric";
  // proposition mode
  outcome?: 0 | 1; // did the claim resolve TRUE?
  forecastProb?: number; // stated P(claim true)
  // numeric mode
  covered?: boolean; // did the interval contain the truth?
  confidence?: number; // stated interval confidence
}

export interface ItemScore {
  correct: boolean; // SKILL: right answer within tolerance
  calibrationBrier: number; // CALIBRATION: Brier-scale value in [0,1]
}

/**
 * Score a single answered item on the skill + calibration axes. Pure function;
 * it consumes the outputs of the existing scoreInstance() rather than
 * re-deriving any ground truth.
 */
export function scoreDiagnosticItem(input: ItemScoreInput): ItemScore {
  if (input.mode === "proposition") {
    const outcome = input.outcome ?? 0;
    const p = clamp01(input.forecastProb ?? 0.5);
    // Directional correctness: did the student commit to the true side of 50%?
    const decided = p > MASTERY_CONFIG.propositionDecisionThreshold ? 1 : 0;
    const correct = decided === outcome && p !== MASTERY_CONFIG.propositionDecisionThreshold;
    const calibrationBrier = (p - outcome) ** 2;
    return { correct, calibrationBrier };
  }
  // Numeric interval item: SKILL = the truth fell inside the stated interval.
  const covered = input.covered ?? false;
  const c = clamp01(input.confidence ?? 0.9);
  // CALIBRATION: treat the stated confidence as P(interval covers truth) and
  // Brier-score it against the coverage outcome. A 90%-confident interval that
  // misses scores 0.9^2 = 0.81; one that covers scores (1-0.9)^2 = 0.01.
  const coveredInd = covered ? 1 : 0;
  const calibrationBrier = (c - coveredInd) ** 2;
  return { correct: covered, calibrationBrier };
}

export interface TopicResult {
  topicId: string;
  label: string;
  short: string;
  family: string;
  nItems: number;
  nCorrect: number;
  skillAccuracy: number; // raw nCorrect / nItems
  brier: number; // mean calibration Brier (lower is better)
  posterior: BetaPosterior; // uncertainty-aware skill estimate
  mastery: MasteryBucket;
}

/** Classify a topic from its (posterior-mean) skill and mean Brier. */
export function classifyMastery(
  skill: number,
  brier: number,
): MasteryBucket {
  const { mastered, developing } = MASTERY_CONFIG;
  if (skill >= mastered.minSkill && brier <= mastered.maxBrier) return "mastered";
  if (skill >= developing.minSkill && brier <= developing.maxBrier)
    return "developing";
  return "not-ready";
}

/** Aggregate a topic's answered items into a per-topic result. */
export function aggregateTopic(
  meta: { topicId: string; label: string; short: string; family: string },
  items: ItemScore[],
): TopicResult {
  const nItems = items.length;
  const nCorrect = items.filter((i) => i.correct).length;
  const skillAccuracy = nItems ? nCorrect / nItems : 0;
  const brier = nItems
    ? items.reduce((s, i) => s + i.calibrationBrier, 0) / nItems
    : 1;
  const posterior = betaBinomialPosterior(
    nCorrect,
    nItems,
    MASTERY_CONFIG.prior,
    MASTERY_CONFIG.credibleMass,
  );
  // Classification uses the uncertainty-shrunk posterior MEAN as the skill
  // estimate, so few-item topics can't reach Mastered on luck alone.
  const mastery = classifyMastery(posterior.mean, brier);
  return {
    ...meta,
    nItems,
    nCorrect,
    skillAccuracy,
    brier,
    posterior,
    mastery,
  };
}

export interface ReadinessReport {
  topics: TopicResult[];
  totalTopics: number;
  masteredCount: number;
  developingCount: number;
  notReadyCount: number;
  readiness: number; // fraction of topics at Mastered
  focusAreas: TopicResult[]; // not-mastered topics, weakest first
}

/** Build the overall readiness report from per-topic results. */
export function buildReadinessReport(topics: TopicResult[]): ReadinessReport {
  const totalTopics = topics.length;
  const masteredCount = topics.filter((t) => t.mastery === "mastered").length;
  const developingCount = topics.filter((t) => t.mastery === "developing").length;
  const notReadyCount = topics.filter((t) => t.mastery === "not-ready").length;
  const focusAreas = topics
    .filter((t) => t.mastery !== "mastered")
    // Weakest first: lowest posterior-mean skill, then highest (worst) Brier.
    .sort((a, b) => a.posterior.mean - b.posterior.mean || b.brier - a.brier);
  return {
    topics,
    totalTopics,
    masteredCount,
    developingCount,
    notReadyCount,
    readiness: totalTopics ? masteredCount / totalTopics : 0,
    focusAreas,
  };
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}
