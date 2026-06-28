/**
 * Texas Hold'em poker engine (client-only).
 *
 * Libraries / techniques used:
 *  - `pokersolver` for showdown hand EVALUATION (handles all rank/kicker/tie
 *    edge cases). See evaluator.ts.
 *  - `crypto.getRandomValues` + an unbiased Fisher–Yates (rejection sampling)
 *    for SHUFFLING the real deck. See shuffle.ts.
 *  - A Monte-Carlo EQUITY estimator that drives a pot-odds + position + persona
 *    aggression/bluff bot policy. See equity.ts and bot.ts.
 */

export * from "./types";
export * from "./deck";
export * from "./shuffle";
export * from "./evaluator";
export * from "./equity";
export * from "./personalities";
export * from "./engine";
export * from "./bot";
export * from "./multiplayer";
