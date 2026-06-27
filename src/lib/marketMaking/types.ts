/** Core types for market-making interview games. */

export type ScenarioKind =
  | "single_die"
  | "two_dice"
  | "die_plus_fixed"
  | "coin_flips"
  | "card_draw"
  | "cards_with_reveal";

export interface Scenario {
  id: string;
  kind: ScenarioKind;
  title: string;
  description: string;
  /** Human-readable clues shown to the player. */
  clues: string[];
  /** Resolved values used to compute fair value (hidden in play mode). */
  params: Record<string, number | number[] | string[]>;
  fairValue: number;
}

export interface Quote {
  bid: number;
  ask: number;
}

export type QuoteIssue =
  | "bid_above_ask"
  | "mid_off_fair"
  | "spread_too_wide"
  | "spread_too_tight"
  | "bid_too_high"
  | "ask_too_low";

export interface QuoteFeedback {
  ok: boolean;
  issues: QuoteIssue[];
  /** Plain-language hints keyed by issue. */
  messages: string[];
  fairValue: number;
  mid: number;
  spread: number;
}

export type TradeSide = "buy" | "sell" | "pass";

export interface TradeResult {
  side: TradeSide;
  price: number;
  pnl: number;
  explanation: string;
}

export interface LevelConfig {
  id: string;
  name: string;
  tier: "standard" | "firm";
  description: string;
  /** Max |mid - fairValue| allowed. */
  fairTolerance: number;
  /** Min acceptable spread. */
  minSpread: number;
  /** Max acceptable spread. */
  maxSpread: number;
  /** Round timer in seconds (0 = no timer). */
  roundSeconds: number;
  /** Rounds needed to advance / win level. */
  roundsToClear: number;
  /** Target cumulative P&L to clear. */
  pnlTarget: number;
  /** AI aggressiveness 0–1 (probability of trading when edge exists). */
  aiAggression: number;
  /** Minimum edge AI requires before trading. */
  aiEdgeThreshold: number;
  /** Scenario pool ids. */
  scenarioPool: ScenarioKind[];
  /** Starting inventory penalty weight. */
  inventorySkew: number;
}

export interface TutorialStep {
  id: string;
  title: string;
  body: string;
  scenario: Scenario;
  /** Suggested bid/ask for reference (learn mode only). */
  hint?: Quote;
  /** Which fields to validate strictly. */
  checks: QuoteIssue[];
}

export interface PlayRoundState {
  round: number;
  pnl: number;
  inventory: number;
  scenario: Scenario;
  quote?: Quote;
  lastTrade?: TradeResult;
}
