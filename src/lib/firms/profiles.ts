/**
 * Authoritative data module describing what top quant trading firms look for
 * in a QUANT TRADER role. Used to score a candidate's "readiness" per firm.
 *
 * Sourcing note: this module is built from legitimately public information only
 * (firms' own careers/role pages, widely-known public skill expectations, and
 * the *types* of skills covered by published interview-prep references). It
 * contains no proprietary interview questions or ToS-protected content — only
 * skill-requirement signals, which are facts and not copyrightable. Weights are
 * a defensible, honest estimate of relative emphasis, not an official rubric.
 */

/** Measurable competencies the app can assess. */
export type Competency =
  | "probability"
  | "mentalMath"
  | "combinatorics"
  | "expectedValue"
  | "marketMaking"
  | "estimation"
  | "brainteasers"
  | "pokerTheory"
  | "statistics"
  | "programming";

export interface FirmProfile {
  id: string;
  name: string;
  /** Short, honest description of the firm. */
  blurb: string;
  /** What the firm is publicly known for emphasizing. */
  emphasis: string;
  /** Relative emphasis per competency. Weights sum to exactly 1.0. */
  weights: Record<Competency, number>;
  /** Honest, non-authoritative hint about the typical bar. */
  minBarHint?: string;
}

/** Human-readable labels for each competency. */
export const COMPETENCY_LABELS: Record<Competency, string> = {
  probability: "Probability",
  mentalMath: "Mental Math",
  combinatorics: "Combinatorics",
  expectedValue: "Expected Value",
  marketMaking: "Market Making",
  estimation: "Estimation / Fermi",
  brainteasers: "Brainteasers / Logic",
  pokerTheory: "Poker & Game Theory",
  statistics: "Statistics",
  programming: "Programming",
};

export const FIRM_PROFILES: FirmProfile[] = [
  {
    id: "jane-street",
    name: "Jane Street",
    blurb:
      "Quantitative trading firm with a strong probabilistic-reasoning and games culture, well known for its functional-programming (OCaml) engineering and a heavy focus on clear thinking under uncertainty.",
    emphasis:
      "Probability puzzles, expected-value reasoning, sequential games/market-making, and crisp logic. Less emphasis on raw coding speed for the trader track.",
    weights: {
      probability: 0.2,
      mentalMath: 0.1,
      combinatorics: 0.08,
      expectedValue: 0.15,
      marketMaking: 0.12,
      estimation: 0.05,
      brainteasers: 0.15,
      pokerTheory: 0.07,
      statistics: 0.03,
      programming: 0.05,
    },
    minBarHint:
      "Strong, fast probabilistic reasoning and comfort 'pricing' bets in live games are expected.",
  },
  {
    id: "citadel-securities",
    name: "Citadel / Citadel Securities",
    blurb:
      "Large hedge fund (Citadel) and a leading electronic market maker (Citadel Securities). Trading roles span systematic and discretionary work with high quantitative rigor.",
    emphasis:
      "Broad, rigorous quant skills: probability, statistics, and programming alongside trading intuition and EV reasoning.",
    weights: {
      probability: 0.18,
      mentalMath: 0.1,
      combinatorics: 0.07,
      expectedValue: 0.13,
      marketMaking: 0.1,
      estimation: 0.05,
      brainteasers: 0.07,
      pokerTheory: 0.02,
      statistics: 0.13,
      programming: 0.15,
    },
    minBarHint:
      "Expect strong all-around quant ability; weak spots in stats or coding are hard to hide.",
  },
  {
    id: "two-sigma",
    name: "Two Sigma",
    blurb:
      "Technology- and data-driven systematic investment manager. Research and engineering are central, with heavy use of statistics, machine learning, and large-scale software.",
    emphasis:
      "Statistics, data analysis, and programming dominate; pure mental-math/market-making drills matter less than modeling and code.",
    weights: {
      probability: 0.14,
      mentalMath: 0.06,
      combinatorics: 0.05,
      expectedValue: 0.08,
      marketMaking: 0.03,
      estimation: 0.04,
      brainteasers: 0.05,
      pokerTheory: 0.01,
      statistics: 0.27,
      programming: 0.27,
    },
    minBarHint:
      "Solid statistics and real coding ability are typically prerequisites.",
  },
  {
    id: "optiver",
    name: "Optiver",
    blurb:
      "Global market maker in options and other derivatives, known publicly for a fast-paced trading-floor culture and a famously demanding timed mental-arithmetic assessment.",
    emphasis:
      "Lightning mental math, market-making intuition, and quick estimation under time pressure are the headline skills.",
    weights: {
      probability: 0.1,
      mentalMath: 0.27,
      combinatorics: 0.04,
      expectedValue: 0.1,
      marketMaking: 0.22,
      estimation: 0.13,
      brainteasers: 0.05,
      pokerTheory: 0.02,
      statistics: 0.02,
      programming: 0.05,
    },
    minBarHint:
      "A high score on fast, accurate mental arithmetic (e.g. the well-known timed test) is essentially table stakes.",
  },
  {
    id: "sig",
    name: "SIG (Susquehanna International Group)",
    blurb:
      "Global quantitative trading firm publicly known for teaching new traders poker and game theory as a tool for decision-making under uncertainty and risk.",
    emphasis:
      "Expected-value and game-theoretic decision making, probability, market making, and a distinctive poker-driven training culture.",
    weights: {
      probability: 0.15,
      mentalMath: 0.1,
      combinatorics: 0.05,
      expectedValue: 0.18,
      marketMaking: 0.15,
      estimation: 0.07,
      brainteasers: 0.08,
      pokerTheory: 0.15,
      statistics: 0.04,
      programming: 0.03,
    },
    minBarHint:
      "Strong EV/decision-making instincts and comfort with poker-style reasoning are highly valued.",
  },
  {
    id: "hrt",
    name: "Hudson River Trading (HRT)",
    blurb:
      "Algorithmic and high-frequency trading firm with a deeply technical, research-and-engineering-led culture across many markets.",
    emphasis:
      "Programming and statistics are central, paired with probability; reflects an automated, code-driven trading approach.",
    weights: {
      probability: 0.16,
      mentalMath: 0.08,
      combinatorics: 0.06,
      expectedValue: 0.08,
      marketMaking: 0.07,
      estimation: 0.04,
      brainteasers: 0.06,
      pokerTheory: 0.01,
      statistics: 0.14,
      programming: 0.3,
    },
    minBarHint:
      "Strong programming ability is typically essential even for trading-adjacent roles.",
  },
  {
    id: "jump-trading",
    name: "Jump Trading",
    blurb:
      "Quantitative and high-frequency trading firm known publicly for low-latency systems and a research-heavy, technology-forward approach.",
    emphasis:
      "Programming, statistics, and probability for fast, automated strategies; latency-aware engineering culture.",
    weights: {
      probability: 0.15,
      mentalMath: 0.09,
      combinatorics: 0.05,
      expectedValue: 0.09,
      marketMaking: 0.08,
      estimation: 0.04,
      brainteasers: 0.05,
      pokerTheory: 0.01,
      statistics: 0.16,
      programming: 0.28,
    },
    minBarHint:
      "Technical depth in coding and quantitative methods is expected.",
  },
  {
    id: "drw",
    name: "DRW",
    blurb:
      "Diversified principal trading firm active across many asset classes and strategies, blending discretionary and quantitative trading.",
    emphasis:
      "Well-rounded trading skills: probability, EV, and market making with supporting quantitative and coding ability.",
    weights: {
      probability: 0.16,
      mentalMath: 0.12,
      combinatorics: 0.06,
      expectedValue: 0.15,
      marketMaking: 0.16,
      estimation: 0.08,
      brainteasers: 0.08,
      pokerTheory: 0.04,
      statistics: 0.06,
      programming: 0.09,
    },
    minBarHint:
      "Balanced trading intuition with solid quantitative fundamentals is the norm.",
  },
  {
    id: "imc",
    name: "IMC Trading",
    blurb:
      "Global technology-driven market maker, particularly in options and ETFs, with a fast trading-floor culture.",
    emphasis:
      "Mental math and market-making intuition with strong probability; similar profile to other options market makers.",
    weights: {
      probability: 0.13,
      mentalMath: 0.22,
      combinatorics: 0.05,
      expectedValue: 0.11,
      marketMaking: 0.2,
      estimation: 0.1,
      brainteasers: 0.06,
      pokerTheory: 0.02,
      statistics: 0.03,
      programming: 0.08,
    },
    minBarHint:
      "Fast mental math and quoting intuition are central to the trader screen.",
  },
  {
    id: "akuna",
    name: "Akuna Capital",
    blurb:
      "Derivatives-focused market maker specializing in options, with a technology-driven trading culture.",
    emphasis:
      "Options market making, mental math, probability, and EV reasoning around derivatives pricing.",
    weights: {
      probability: 0.14,
      mentalMath: 0.2,
      combinatorics: 0.05,
      expectedValue: 0.14,
      marketMaking: 0.2,
      estimation: 0.08,
      brainteasers: 0.06,
      pokerTheory: 0.03,
      statistics: 0.03,
      programming: 0.07,
    },
    minBarHint:
      "Comfort with options intuition and fast mental math is expected on the trading track.",
  },
];

/** Look up a firm profile by its stable `id`. */
export function getFirmProfile(id: string): FirmProfile | undefined {
  return FIRM_PROFILES.find((firm) => firm.id === id);
}
