/**
 * Per-firm "readiness" scoring.
 *
 * HONESTY NOTE: This module is NOT a data-trained predictor and must never be
 * presented as a hiring probability. It is a transparent, deterministic rubric:
 *
 *   readiness% = weighted average of the user's DEMONSTRATED competency scores,
 *                using each firm's published competency weights, renormalized
 *                across only the competencies we have actually measured.
 *
 * Every number here is traceable back to concrete in-app performance signals
 * (lesson mastery, mental-math personal bests, etc.). Competencies with no
 * signal yet are reported as `measured: false` and are EXCLUDED from the
 * average so an untouched skill never unfairly tanks the percentage — instead
 * we surface how much of the firm's profile is still unmeasured via `coverage`.
 *
 * Pure + deterministic: no Firebase calls, no Date/Math.random, no side effects.
 */

import type { CourseProgress } from "../progress";
import {
  COMPETENCY_LABELS,
  FIRM_PROFILES,
  getFirmProfile,
  type Competency,
  type FirmProfile,
} from "../firms/profiles";

/** Canonical competency ordering used for stable output. */
export const COMPETENCY_ORDER: Competency[] = [
  "probability",
  "mentalMath",
  "combinatorics",
  "expectedValue",
  "marketMaking",
  "estimation",
  "brainteasers",
  "pokerTheory",
  "statistics",
  "programming",
];

/**
 * Maps each gated lesson id (quant, market-making, poker-theory) to the
 * competencies its mastery demonstrates. A lesson's best score (0–100) feeds
 * every competency it is mapped to. Lessons the user has never attempted simply
 * contribute nothing (they widen the "unmeasured" gap rather than scoring 0).
 */
export const LESSON_COMPETENCY_MAP: Record<string, Competency[]> = {
  // ----- Core quant curriculum (/lessons) -----
  lesson_1: ["probability", "expectedValue"], // Probability Basics
  lesson_2: ["combinatorics"], // Combinatorics & Counting
  lesson_3: ["probability"], // Conditional Probability & Bayes
  lesson_4: ["expectedValue", "probability"], // Random Variables & Expectation
  lesson_5: ["probability"], // Conditional Probability Foundations
  lesson_6: ["statistics"], // Introductory Statistics
  lesson_7: ["statistics"], // Variance, Covariance & LLN
  lesson_8: ["statistics", "estimation"], // Estimation & Confidence
  lesson_9: ["pokerTheory", "expectedValue"], // Game Theory & Strategic Thinking
  lesson_10: ["brainteasers", "estimation"], // Brain Teasers & Quant Estimation
  lesson_11: ["probability", "brainteasers", "expectedValue"], // Firm-Style Drills
  lesson_12: ["expectedValue", "probability"], // Conditional Expectation
  lesson_13: ["expectedValue", "probability"], // Martingales & Optional Stopping
  lesson_14: ["probability"], // Markov Chains
  lesson_15: ["probability", "expectedValue"], // Random Walks & Gambler's Ruin
  lesson_16: ["statistics", "probability"], // Order Statistics
  lesson_17: ["expectedValue"], // Kelly Criterion & Bet Sizing
  lesson_18: ["marketMaking", "expectedValue"], // Adverse Selection & Information

  // ----- Market-making course (/market-making/lessons) -----
  mm_bid_ask: ["marketMaking"],
  mm_spread: ["marketMaking"],
  mm_fair_value: ["marketMaking", "expectedValue"],
  mm_inventory: ["marketMaking"],
  mm_partial_info: ["marketMaking"],
  mm_interview: ["marketMaking", "expectedValue"],

  // ----- Poker theory course (/poker-theory) -----
  pt_fundamentals: ["pokerTheory"],
  pt_hand_rankings: ["pokerTheory"],
  pt_pot_odds: ["pokerTheory", "expectedValue"],
  pt_position: ["pokerTheory"],
  pt_ranges: ["pokerTheory"],
  pt_bluffing: ["pokerTheory"],
  pt_postflop: ["pokerTheory"],
};

/**
 * Strong, interview-grade target for correct answers in a 120s mental-math
 * drill, per difficulty (mirrors the server-side caps). Hitting the cap = 100%.
 */
export const MENTAL_MATH_CAPS: Record<"easy" | "medium" | "hard", number> = {
  easy: 120,
  medium: 90,
  hard: 70,
};

/** Minimum hands before poker-night play is treated as a real signal sample. */
const POKER_NIGHT_MIN_HANDS = 20;

/** Where the user can go to raise each competency, for "what to improve next". */
export const COMPETENCY_ACTIONS: Record<
  Competency,
  { route: string | null; actionLabel: string; how: string }
> = {
  probability: {
    route: "/lessons",
    actionLabel: "Train probability lessons",
    how: "Work through the probability & Bayes lessons (1, 3, 4, 5, 11).",
  },
  mentalMath: {
    route: "/mental-math",
    actionLabel: "Run a mental-math drill",
    how: "Beat your personal best in the 120-second speed drills.",
  },
  combinatorics: {
    route: "/lessons/lesson_2",
    actionLabel: "Train combinatorics",
    how: "Master the Combinatorics & Counting lesson.",
  },
  expectedValue: {
    route: "/lessons/lesson_4",
    actionLabel: "Train expected value",
    how: "Practice EV via Random Variables, Game Theory, and firm-style drills.",
  },
  marketMaking: {
    route: "/market-making/lessons",
    actionLabel: "Train market making",
    how: "Complete the market-making lessons on quoting, spread, and fair value.",
  },
  estimation: {
    route: "/lessons/lesson_8",
    actionLabel: "Train estimation",
    how: "Work through Estimation & Confidence and the Fermi brain-teaser drills.",
  },
  brainteasers: {
    route: "/lessons/lesson_10",
    actionLabel: "Train brain teasers",
    how: "Tackle the Brain Teasers and Firm-Style Probability Drills.",
  },
  pokerTheory: {
    route: "/poker-theory",
    actionLabel: "Train poker & game theory",
    how: "Pass the poker-theory lessons and the Game Theory lesson.",
  },
  statistics: {
    route: "/lessons/lesson_6",
    actionLabel: "Train statistics",
    how: "Complete Introductory Statistics, Variance/Covariance, and Estimation.",
  },
  programming: {
    route: null,
    actionLabel: "Not measurable in-app yet",
    how: "This app has no coding exercises yet, so programming can't be demonstrated here.",
  },
};

/** A single competency's transparent, demonstrated-skill score. */
export interface CompetencyScore {
  competency: Competency;
  label: string;
  /** 0–100. Always 0 when `measured` is false. */
  score: number;
  /** True only when at least one real progress signal fed this score. */
  measured: boolean;
  /** How many distinct in-app signals contributed (lessons, drills, etc.). */
  signalCount: number;
  /** Plain-language description of what produced this score. */
  detail: string;
}

/** One row of a firm's readiness breakdown. */
export interface ReadinessBreakdownItem {
  competency: Competency;
  label: string;
  /** The firm's published emphasis weight for this competency (0–1). */
  weight: number;
  /** The user's demonstrated score, 0–100. */
  score: number;
  measured: boolean;
  /**
   * Weight after renormalizing across measured competencies (0–1). 0 when this
   * competency is unmeasured. The measured rows' renormalized weights sum to 1.
   */
  effectiveWeight: number;
  /** effectiveWeight * score — this row's contribution to `overall`. */
  contribution: number;
}

/** Full, transparent readiness estimate for one firm. */
export interface FirmReadiness {
  firmId: string;
  firmName: string;
  blurb: string;
  emphasis: string;
  minBarHint?: string;
  /** Estimated readiness, 0–100, over MEASURED competencies (renormalized). */
  overall: number;
  /**
   * Share of the firm's emphasis profile that has been measured so far, 0–100.
   * (Firm weights sum to 1, so this is the summed weight of measured comps.)
   */
  coverage: number;
  measuredCount: number;
  totalCount: number;
  /** Sorted by the firm's weight (most-emphasized competency first). */
  breakdown: ReadinessBreakdownItem[];
}

/** A concrete, ranked suggestion for raising a firm's readiness. */
export interface ImprovementSuggestion {
  competency: Competency;
  label: string;
  weight: number;
  score: number;
  measured: boolean;
  /** Estimated readiness points unlockable by this competency for this firm. */
  potentialGain: number;
  route: string | null;
  actionLabel: string;
  reason: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return sum / values.length;
}

/**
 * Best demonstrated mental-math score, normalized to 0–100 against the
 * interview-grade caps. Uses the user's strongest difficulty (peak demonstrated
 * arithmetic speed). Returns null when no drill has ever been attempted.
 */
function mentalMathScore(progress: CourseProgress): number | null {
  const best = progress.mentalMathBest;
  if (!best) return null;
  const normalized = (["easy", "medium", "hard"] as const)
    .filter((d) => (best[d] ?? 0) > 0)
    .map((d) => clamp(((best[d] ?? 0) / MENTAL_MATH_CAPS[d]) * 100, 0, 100));
  if (normalized.length === 0) return null;
  return Math.max(...normalized);
}

/**
 * Computes every competency's demonstrated-skill score from the user's
 * progress. Deterministic; returns scores in `COMPETENCY_ORDER`.
 */
export function computeCompetencyScores(
  progress: CourseProgress,
): CompetencyScore[] {
  // Collect contributing 0–100 signals per competency.
  const signals: Record<Competency, number[]> = {
    probability: [],
    mentalMath: [],
    combinatorics: [],
    expectedValue: [],
    marketMaking: [],
    estimation: [],
    brainteasers: [],
    pokerTheory: [],
    statistics: [],
    programming: [],
  };

  // Lesson mastery signals (only lessons the user has actually attempted).
  const mastery = progress.lessonMastery ?? {};
  for (const [lessonId, comps] of Object.entries(LESSON_COMPETENCY_MAP)) {
    const record = mastery[lessonId];
    if (!record) continue;
    const best = clamp(record.bestScore ?? 0, 0, 100);
    for (const comp of comps) signals[comp].push(best);
  }

  // Mental-math drill personal bests.
  const mm = mentalMathScore(progress);
  if (mm !== null) signals.mentalMath.push(mm);

  // Build the scored output.
  const pokerHands = progress.pokerStats?.handsPlayed ?? 0;

  return COMPETENCY_ORDER.map((competency) => {
    const arr = signals[competency];
    const measured = arr.length > 0;
    const score = measured ? Math.round(mean(arr)) : 0;

    let detail: string;
    if (!measured) {
      detail =
        competency === "programming"
          ? "No coding exercises in the app yet — not measurable here."
          : "Not yet measured — complete the related lessons or drills.";
    } else if (competency === "mentalMath") {
      detail = `Based on your best 120-second drill score vs. the interview-grade target.`;
    } else {
      detail = `Average of your best scores across ${arr.length} completed ${
        arr.length === 1 ? "module" : "modules"
      }.`;
    }

    // Poker-night play is surfaced as context only; it does not inflate the
    // score (win rate vs. AI is not a clean competency metric).
    if (competency === "pokerTheory" && pokerHands >= POKER_NIGHT_MIN_HANDS) {
      detail += ` You've also played ${pokerHands} poker hands.`;
    }

    return {
      competency,
      label: COMPETENCY_LABELS[competency],
      score,
      measured,
      signalCount: arr.length,
      detail,
    };
  });
}

function buildFirmReadiness(
  firm: FirmProfile,
  scores: CompetencyScore[],
): FirmReadiness {
  const scoreByComp = new Map<Competency, CompetencyScore>(
    scores.map((s) => [s.competency, s]),
  );

  // Total weight of measured competencies (for renormalization + coverage).
  let measuredWeight = 0;
  for (const comp of COMPETENCY_ORDER) {
    const s = scoreByComp.get(comp);
    if (s?.measured) measuredWeight += firm.weights[comp];
  }

  const breakdown: ReadinessBreakdownItem[] = COMPETENCY_ORDER.map((comp) => {
    const s = scoreByComp.get(comp)!;
    const weight = firm.weights[comp];
    const effectiveWeight =
      s.measured && measuredWeight > 0 ? weight / measuredWeight : 0;
    return {
      competency: comp,
      label: s.label,
      weight,
      score: s.score,
      measured: s.measured,
      effectiveWeight,
      contribution: effectiveWeight * s.score,
    };
  }).sort((a, b) => b.weight - a.weight);

  const overall =
    measuredWeight > 0
      ? Math.round(breakdown.reduce((sum, b) => sum + b.contribution, 0))
      : 0;

  const measuredCount = breakdown.filter((b) => b.measured).length;

  return {
    firmId: firm.id,
    firmName: firm.name,
    blurb: firm.blurb,
    emphasis: firm.emphasis,
    minBarHint: firm.minBarHint,
    overall,
    coverage: Math.round(clamp(measuredWeight, 0, 1) * 100),
    measuredCount,
    totalCount: COMPETENCY_ORDER.length,
    breakdown,
  };
}

/**
 * Computes a single firm's transparent readiness estimate. `overall` is the
 * weighted average of demonstrated competency scores over MEASURED competencies
 * (firm weights renormalized so unmeasured skills don't penalize). Returns null
 * for an unknown firm id.
 */
export function computeFirmReadiness(
  progress: CourseProgress,
  firmId: string,
): FirmReadiness | null {
  const firm = getFirmProfile(firmId);
  if (!firm) return null;
  return buildFirmReadiness(firm, computeCompetencyScores(progress));
}

/**
 * Readiness for every firm, sorted best-fit first. Ties break on higher
 * coverage, then alphabetically by firm name for stable ordering.
 */
export function computeAllFirmReadiness(
  progress: CourseProgress,
): FirmReadiness[] {
  const scores = computeCompetencyScores(progress);
  return FIRM_PROFILES.map((firm) => buildFirmReadiness(firm, scores)).sort(
    (a, b) =>
      b.overall - a.overall ||
      b.coverage - a.coverage ||
      a.firmName.localeCompare(b.firmName),
  );
}

/**
 * Ranked, concrete next steps to raise a firm's readiness. Prioritizes
 * high-emphasis competencies where the user is weakest or has no signal yet.
 * `potentialGain` ≈ readiness points unlockable if that competency reached 100.
 */
export function getImprovementSuggestions(
  progress: CourseProgress,
  firmId: string,
  limit = 3,
): ImprovementSuggestion[] {
  const firm = getFirmProfile(firmId);
  if (!firm) return [];
  const readiness = buildFirmReadiness(firm, computeCompetencyScores(progress));

  return readiness.breakdown
    .filter((b) => b.weight > 0)
    .map((b) => {
      const action = COMPETENCY_ACTIONS[b.competency];
      // Measured: realizable gain is bounded by current renormalized weight.
      // Unmeasured: starting it both scores points AND expands coverage, so we
      // rank by the firm's raw emphasis on that competency.
      const potentialGain = b.measured
        ? Math.round(b.effectiveWeight * (100 - b.score))
        : Math.round(b.weight * 100);
      const reason = b.measured
        ? `You're at ${b.score}% on a competency this firm weights ${Math.round(
            b.weight * 100,
          )}%.`
        : `Not yet measured — worth ${Math.round(
            b.weight * 100,
          )}% of this firm's profile.`;
      return {
        competency: b.competency,
        label: b.label,
        weight: b.weight,
        score: b.score,
        measured: b.measured,
        potentialGain,
        route: action.route,
        actionLabel: action.actionLabel,
        reason,
      };
    })
    .sort(
      (a, b) =>
        // Surface unmeasured high-weight gaps and weak high-weight skills first.
        b.potentialGain - a.potentialGain ||
        b.weight - a.weight ||
        a.score - b.score,
    )
    .slice(0, limit);
}
