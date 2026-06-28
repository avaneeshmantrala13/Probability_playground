/**
 * Single source of truth for Probability Playground monetization.
 *
 * This file defines the pricing tiers, one-time "sprint" products, the
 * entitlement model, and the mapping from a logical `priceKey` to the
 * environment variable that holds its Stripe Price ID.
 *
 * IMPORTANT — the actual Stripe Price IDs are NEVER hard-coded here. The
 * frontend only ever sends a `priceKey` (e.g. "pro_monthly") to
 * `/api/create-checkout-session`; the serverless function resolves it to a
 * Price ID via the matching env var (see `PRICE_ENV_BY_KEY`). The api files
 * mirror `PRICE_ENV_BY_KEY` / `CHECKOUT_MODE_BY_KEY` inline (Vercel bundles
 * `api/` separately), so keep the two in sync if you change keys here.
 */

// ---------------------------------------------------------------------------
// Entitlement levels
// ---------------------------------------------------------------------------

/** Ordered access tiers. Higher rank ⇒ strictly more access. */
export type EntitlementLevel = "free" | "pro" | "interview_prep";

/** Numeric rank for comparison. Keep ascending order of access. */
export const ENTITLEMENT_RANK: Record<EntitlementLevel, number> = {
  free: 0,
  pro: 1,
  interview_prep: 2,
};

/**
 * Compare two entitlement levels.
 * Returns a negative number if `a < b`, 0 if equal, positive if `a > b`.
 */
export function compareEntitlement(a: EntitlementLevel, b: EntitlementLevel): number {
  return ENTITLEMENT_RANK[a] - ENTITLEMENT_RANK[b];
}

/** True when `current` grants at least the access of `required`. */
export function meetsEntitlement(
  current: EntitlementLevel,
  required: EntitlementLevel,
): boolean {
  return ENTITLEMENT_RANK[current] >= ENTITLEMENT_RANK[required];
}

// ---------------------------------------------------------------------------
// Billing intervals + price keys
// ---------------------------------------------------------------------------

export type BillingInterval = "monthly" | "annual";

/** Stripe Checkout mode for a given purchase. */
export type CheckoutMode = "subscription" | "payment";

/**
 * Logical price identifiers sent from the client to the checkout endpoint.
 * The server maps each to a Stripe Price ID via `PRICE_ENV_BY_KEY`.
 */
export type PriceKey =
  | "pro_monthly"
  | "pro_annual"
  | "interview_monthly"
  | "interview_annual"
  | "sprint_1wk"
  | "sprint_2wk"
  | "sprint_4wk"
  | "sprint_firm";

/** priceKey → name of the env var holding its Stripe Price ID. */
export const PRICE_ENV_BY_KEY: Record<PriceKey, string> = {
  pro_monthly: "STRIPE_PRICE_PRO_MONTHLY",
  pro_annual: "STRIPE_PRICE_PRO_ANNUAL",
  interview_monthly: "STRIPE_PRICE_INTERVIEW_MONTHLY",
  interview_annual: "STRIPE_PRICE_INTERVIEW_ANNUAL",
  sprint_1wk: "STRIPE_PRICE_SPRINT_1WK",
  sprint_2wk: "STRIPE_PRICE_SPRINT_2WK",
  sprint_4wk: "STRIPE_PRICE_SPRINT_4WK",
  sprint_firm: "STRIPE_PRICE_SPRINT_FIRM",
};

/** priceKey → Stripe Checkout mode. Subscriptions recur; sprints are one-time. */
export const CHECKOUT_MODE_BY_KEY: Record<PriceKey, CheckoutMode> = {
  pro_monthly: "subscription",
  pro_annual: "subscription",
  interview_monthly: "subscription",
  interview_annual: "subscription",
  sprint_1wk: "payment",
  sprint_2wk: "payment",
  sprint_4wk: "payment",
  sprint_firm: "payment",
};

/** All env var names the owner must set in Vercel for Stripe Price IDs. */
export const STRIPE_PRICE_ENV_VARS: string[] = Object.values(PRICE_ENV_BY_KEY);

// ---------------------------------------------------------------------------
// Entitlement flags + free-tier limits
// ---------------------------------------------------------------------------

export type MentalMathMode = "arith" | "estimation" | "brainteasers";

/** What a given plan unlocks. Used for marketing + (later) enforcement. */
export interface PlanEntitlements {
  unlimitedPractice: boolean;
  fullPokerNight: boolean;
  /** Either a specific allow-list of modes, or "all". */
  mentalMathModes: MentalMathMode[] | "all";
  unlimitedAiTutor: boolean;
  allLessons: boolean;
  readinessDashboard: "none" | "full";
  liveMockInterviews: boolean;
  perFirmDiagnostics: boolean;
}

/**
 * Client-enforceable acquisition limits for the free tier. These are intended
 * to be read by feature code (the orchestrator wires enforcement); nothing here
 * enforces them on its own.
 */
export interface FreeLimits {
  dailyQuestionLimit: number;
  mentalMathModes: MentalMathMode[];
  pokerNightPerDay: number;
  aiTutorPerDay: number;
  lessons: "first-of-each-track";
}

export const FREE_LIMITS: FreeLimits = {
  dailyQuestionLimit: 10,
  mentalMathModes: ["arith"],
  pokerNightPerDay: 1,
  aiTutorPerDay: 5,
  lessons: "first-of-each-track",
};

// ---------------------------------------------------------------------------
// Subscription tiers
// ---------------------------------------------------------------------------

export interface PlanPrice {
  /** Monthly subscription price in whole USD. */
  monthly: number;
  /** Total charged once per year in whole USD (markets as "2 months free"). */
  annualTotal: number;
  /** Env var holding the Stripe Price ID for the monthly cadence. */
  priceEnvMonthly: string;
  /** Env var holding the Stripe Price ID for the annual cadence. */
  priceEnvAnnual: string;
  /** Logical price keys passed to the checkout endpoint. */
  priceKeyMonthly: PriceKey;
  priceKeyAnnual: PriceKey;
}

export interface Plan {
  id: EntitlementLevel;
  name: string;
  tagline: string;
  /** Access level this plan grants. */
  entitlement: EntitlementLevel;
  /** null for the free tier. */
  price: PlanPrice | null;
  /** Marketing feature bullets, in display order. */
  features: string[];
  /** Structured entitlement flags. */
  entitlements: PlanEntitlements;
  /** Highlighted as the recommended tier ("Most Popular"). */
  highlight?: boolean;
  badge?: string;
  /** Free-tier limits (only present on the free plan). */
  limits?: FreeLimits;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Start sharpening for free.",
    entitlement: "free",
    price: null,
    limits: FREE_LIMITS,
    entitlements: {
      unlimitedPractice: false,
      fullPokerNight: false,
      mentalMathModes: ["arith"],
      unlimitedAiTutor: false,
      allLessons: false,
      readinessDashboard: "none",
      liveMockInterviews: false,
      perFirmDiagnostics: false,
    },
    features: [
      `${FREE_LIMITS.dailyQuestionLimit} practice questions per day`,
      "Arithmetic mental-math drills",
      "First lesson of each track",
      `${FREE_LIMITS.aiTutorPerDay} AI tutor messages per day`,
      `${FREE_LIMITS.pokerNightPerDay} Poker Night session per day`,
      "Leaderboards included",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Learn & practice — unlimited access across the whole platform.",
    entitlement: "pro",
    price: {
      monthly: 19,
      annualTotal: 144,
      priceEnvMonthly: PRICE_ENV_BY_KEY.pro_monthly,
      priceEnvAnnual: PRICE_ENV_BY_KEY.pro_annual,
      priceKeyMonthly: "pro_monthly",
      priceKeyAnnual: "pro_annual",
    },
    entitlements: {
      unlimitedPractice: true,
      fullPokerNight: true,
      mentalMathModes: "all",
      unlimitedAiTutor: true,
      allLessons: true,
      readinessDashboard: "full",
      liveMockInterviews: false,
      perFirmDiagnostics: false,
    },
    features: [
      "Unlimited practice questions",
      "Full Poker Night (no daily cap)",
      "Full mental-math arena — arithmetic, estimation & brainteasers",
      "Unlimited AI tutor",
      "Every lesson in every track",
      "Full readiness dashboard",
    ],
  },
  {
    id: "interview_prep",
    name: "Interview Prep",
    tagline: "Get the offer — live mock interviews + per-firm diagnostics.",
    entitlement: "interview_prep",
    highlight: true,
    badge: "Most Popular",
    price: {
      monthly: 39,
      annualTotal: 279,
      priceEnvMonthly: PRICE_ENV_BY_KEY.interview_monthly,
      priceEnvAnnual: PRICE_ENV_BY_KEY.interview_annual,
      priceKeyMonthly: "interview_monthly",
      priceKeyAnnual: "interview_annual",
    },
    entitlements: {
      unlimitedPractice: true,
      fullPokerNight: true,
      mentalMathModes: "all",
      unlimitedAiTutor: true,
      allLessons: true,
      readinessDashboard: "full",
      liveMockInterviews: true,
      perFirmDiagnostics: true,
    },
    features: [
      "Everything in Pro",
      "Unlimited AI live mock interviews",
      "Per-firm readiness diagnostics",
      "Personalized prep path",
    ],
  },
];

// ---------------------------------------------------------------------------
// One-time "sprint" products
// ---------------------------------------------------------------------------

export interface SprintProduct {
  id: "sprint_1wk" | "sprint_2wk" | "sprint_4wk" | "sprint_firm";
  name: string;
  /** One-time price in whole USD. */
  priceOneTime: number;
  /** Days of access granted from the moment of purchase. */
  durationDays: number;
  /** Access level granted for the duration (sprints grant interview_prep). */
  grants: EntitlementLevel;
  /** Env var holding the Stripe Price ID. */
  priceEnv: string;
  /** Logical price key passed to the checkout endpoint. */
  priceKey: PriceKey;
  /** Short outcome-focused description. */
  description: string;
  /** Marketing feature bullets. */
  features: string[];
  badge?: string;
  /** True when the plan is built around a single target firm. */
  firmTargeted?: boolean;
}

export const SPRINTS: SprintProduct[] = [
  {
    id: "sprint_1wk",
    name: "1-Week Final Prep",
    priceOneTime: 49,
    durationDays: 7,
    grants: "interview_prep",
    priceEnv: PRICE_ENV_BY_KEY.sprint_1wk,
    priceKey: "sprint_1wk",
    description: "Interview in days? A guided 7-day program to peak right on time.",
    features: [
      "7 days of full Interview Prep access",
      "Day-by-day cram curriculum",
      "Scheduled mock interviews",
      "Final readiness report",
      "One-time purchase — no auto-renew",
    ],
  },
  {
    id: "sprint_2wk",
    name: "2-Week Crunch",
    priceOneTime: 89,
    durationDays: 14,
    grants: "interview_prep",
    priceEnv: PRICE_ENV_BY_KEY.sprint_2wk,
    priceKey: "sprint_2wk",
    description: "Interview in two weeks? A structured 14-day program with guided mocks.",
    features: [
      "14 days of full Interview Prep access",
      "Day-by-day 2-week curriculum",
      "Scheduled mock interviews",
      "Final readiness report",
      "One-time purchase — no auto-renew",
    ],
  },
  {
    id: "sprint_4wk",
    name: "4-Week Interview Sprint",
    priceOneTime: 129,
    durationDays: 28,
    grants: "interview_prep",
    priceEnv: PRICE_ENV_BY_KEY.sprint_4wk,
    priceKey: "sprint_4wk",
    badge: "Most Popular",
    description: "The complete runway: build fluency, then drill mock interviews to mastery.",
    features: [
      "28 days of full Interview Prep access",
      "Day-by-day 4-week curriculum",
      "Scheduled mock interviews with progress tracking",
      "Final readiness report",
      "One-time purchase — no auto-renew",
    ],
  },
  {
    id: "sprint_firm",
    name: "Firm-Focused Sprint",
    priceOneTime: 149,
    durationDays: 28,
    grants: "interview_prep",
    priceEnv: PRICE_ENV_BY_KEY.sprint_firm,
    priceKey: "sprint_firm",
    firmTargeted: true,
    description: "Everything in the 4-week sprint, tuned to one specific target firm.",
    features: [
      "28 days of full Interview Prep access",
      "Day-by-day curriculum targeted to one firm",
      "Firm-specific mock interviews & diagnostics",
      "Final readiness report",
      "One-time purchase — no auto-renew",
    ],
  },
];

// ---------------------------------------------------------------------------
// Pricing math helpers
// ---------------------------------------------------------------------------

/** Annual total divided across 12 months (e.g. 190 / 12 ≈ 15.83). */
export function monthlyEquivalent(price: PlanPrice): number {
  return price.annualTotal / 12;
}

/**
 * Percentage saved by paying annually vs. 12 monthly charges.
 * e.g. monthly 19 → 228/yr, annual 190 → ~17% savings.
 */
export function annualSavingsPercent(price: PlanPrice): number {
  const fullYear = price.monthly * 12;
  if (fullYear <= 0) return 0;
  return ((fullYear - price.annualTotal) / fullYear) * 100;
}

/** Whole-dollar amount saved per year by paying annually. */
export function annualSavingsAmount(price: PlanPrice): number {
  return price.monthly * 12 - price.annualTotal;
}

/** Format a USD amount; drops the decimals for whole-dollar values. */
export function formatUsd(amount: number): string {
  const whole = Number.isInteger(amount);
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  });
}

/** Resolve a plan by its id. */
export function getPlan(id: EntitlementLevel): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

/** Resolve a sprint by its id. */
export function getSprint(id: SprintProduct["id"]): SprintProduct | undefined {
  return SPRINTS.find((s) => s.id === id);
}

// ---------------------------------------------------------------------------
// Convenience aliases + feature gating map (consumed by RequirePlan / Pricing)
// ---------------------------------------------------------------------------

/** Alias: a plan id is just an entitlement level. */
export type PlanId = EntitlementLevel;

/** Paid subscription tiers (excludes free). */
export type PaidPlanId = Exclude<EntitlementLevel, "free">;

/** One-time sprint product ids. */
export type SprintId = SprintProduct["id"];

/** Display names per plan. */
export const PLAN_NAMES: Record<PlanId, string> = {
  free: "Free",
  pro: "Pro",
  interview_prep: "Interview Prep",
};

/** Gateable product features. */
export type Feature =
  | "unlimited_practice"
  | "all_lessons"
  | "full_mental_math"
  | "full_poker_night"
  | "ai_tutor"
  | "readiness_dashboard"
  | "mock_interview"
  | "firm_diagnostics";

/** Minimum plan required for each feature. */
export const FEATURE_MIN_PLAN: Record<Feature, PaidPlanId> = {
  unlimited_practice: "pro",
  all_lessons: "pro",
  full_mental_math: "pro",
  full_poker_night: "pro",
  ai_tutor: "pro",
  readiness_dashboard: "pro",
  mock_interview: "interview_prep",
  firm_diagnostics: "interview_prep",
};

/** Human labels for features (used in upsell copy). */
export const FEATURE_LABELS: Record<Feature, string> = {
  unlimited_practice: "Unlimited practice",
  all_lessons: "Every lesson",
  full_mental_math: "Full mental-math arena",
  full_poker_night: "Full Poker Night",
  ai_tutor: "AI tutor",
  readiness_dashboard: "Readiness dashboard",
  mock_interview: "AI mock interviews",
  firm_diagnostics: "Per-firm diagnostics",
};
