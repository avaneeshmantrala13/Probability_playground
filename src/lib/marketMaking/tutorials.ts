import { singleCardFairValue } from "./fairValue";
import type { TutorialStep } from "./types";

const CARD_TUT_FAIR = Math.round(singleCardFairValue(["2", "3"]) * 100) / 100;

export const TUTORIALS: TutorialStep[] = [
  {
    id: "intro",
    title: "What is a two-sided quote?",
    body:
      "As market maker you publish a bid (price you'll buy at) and an ask (price you'll sell at). " +
      "Your spread compensates you for risk. Start with a simple die: fair value is 3.5.",
    scenario: {
      id: "tut_intro",
      kind: "single_die",
      title: "Single fair die",
      description: "Quote a market on one die roll.",
      clues: ["One fair six-sided die.", "Each face 1–6 equally likely."],
      params: {},
      fairValue: 3.5,
    },
    hint: { bid: 3, ask: 4 },
    checks: ["bid_above_ask", "mid_off_fair"],
  },
  {
    id: "spread",
    title: "Choosing a spread",
    body:
      "A reasonable spread brackets fair value without being absurdly wide. " +
      "For a single die, something like 3–4 or 2.5–4.5 often works in practice.",
    scenario: {
      id: "tut_spread",
      kind: "single_die",
      title: "Single fair die",
      description: "Quote with an appropriate spread.",
      clues: ["Fair value = 3.5.", "Avoid quoting 1–10 — that's giving away free options."],
      params: {},
      fairValue: 3.5,
    },
    hint: { bid: 3, ask: 4 },
    checks: ["bid_above_ask", "spread_too_wide", "spread_too_tight", "mid_off_fair"],
  },
  {
    id: "two_dice",
    title: "Sum of two dice",
    body:
      "Two independent dice have expected sum 7. The distribution is triangular — " +
      "extremes (2 and 12) are rare. Center near 7.",
    scenario: {
      id: "tut_two",
      kind: "two_dice",
      title: "Two dice sum",
      description: "Quote on the sum of two dice.",
      clues: ["Two fair dice.", "Expected sum = 7."],
      params: {},
      fairValue: 7,
    },
    hint: { bid: 6, ask: 8 },
    checks: ["bid_above_ask", "mid_off_fair", "spread_too_wide"],
  },
  {
    id: "conditional",
    title: "Known offset",
    body:
      "When part of the outcome is known, add its contribution to the random part's expectation. " +
      "Here: known 4 + random die (3.5) = 7.5.",
    scenario: {
      id: "tut_cond",
      kind: "die_plus_fixed",
      title: "Die + 4",
      description: "One die plus a known constant.",
      clues: ["A fair die is rolled and added to 4.", "Expected value = 4 + 3.5 = 7.5."],
      params: { fixed: 4 },
      fairValue: 7.5,
    },
    hint: { bid: 7, ask: 8 },
    checks: ["bid_above_ask", "mid_off_fair", "bid_too_high", "ask_too_low"],
  },
  {
    id: "coins",
    title: "Coin flip markets",
    body:
      "Five fair coins → expected heads = 2.5. Binomial uncertainty is moderate; " +
      "a spread of about 1–2 points around 2.5 is sensible.",
    scenario: {
      id: "tut_coins",
      kind: "coin_flips",
      title: "Five coin flips",
      description: "Quote on head count.",
      clues: ["5 fair coins flipped.", "E[heads] = 2.5."],
      params: { count: 5 },
      fairValue: 2.5,
    },
    hint: { bid: 2, ask: 3 },
    checks: ["bid_above_ask", "mid_off_fair", "spread_too_wide"],
  },
  {
    id: "cards",
    title: "Card expected value",
    body:
      "One card from a full deck: average rank is 7. Removing low cards shifts fair value up. " +
      "Here a 2 and a 3 are out — recompute the remaining deck average (~7.15).",
    scenario: {
      id: "tut_cards",
      kind: "card_draw",
      title: "Card with removals",
      description: "Single draw after removals.",
      clues: [
        "Cards removed: 2, 3 (both suits shown as removed ranks).",
        "Ace = 1 through King = 13.",
      ],
      params: { revealed: ["2", "3"] },
      fairValue: CARD_TUT_FAIR,
    },
    hint: { bid: CARD_TUT_FAIR - 0.65, ask: CARD_TUT_FAIR + 0.6 },
    checks: ["bid_above_ask", "mid_off_fair", "bid_too_high", "ask_too_low"],
  },
  {
    id: "inventory",
    title: "Skew for inventory",
    body:
      "If you're long (positive inventory), shade quotes lower to attract sellers. " +
      "Practice centering near 3.5 with a balanced book — bid 3, ask 4 still works.",
    scenario: {
      id: "tut_inv",
      kind: "single_die",
      title: "Inventory awareness",
      description: "Quote as if flat inventory.",
      clues: [
        "Assume you start flat (no position).",
        "Fair value remains 3.5.",
      ],
      params: {},
      fairValue: 3.5,
    },
    hint: { bid: 3, ask: 4 },
    checks: ["bid_above_ask", "mid_off_fair", "spread_too_tight"],
  },
];
