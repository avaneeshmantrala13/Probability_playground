import { formatFair } from "./fairValue";
import type { LevelConfig, Quote, QuoteFeedback, QuoteIssue } from "./types";

const ISSUE_MESSAGES: Record<QuoteIssue, (ctx: Ctx) => string> = {
  bid_above_ask: () => "Your bid must be strictly below your ask — otherwise you'd lose money on every round trip.",
  mid_off_fair: (c) =>
    `Your mid-price (${formatFair(c.mid)}) is too far from fair value (${formatFair(c.fairValue)}). Center the market near expected value.`,
  spread_too_wide: (c) =>
    `Spread of ${formatFair(c.spread)} is too wide for this level. Tighten your quotes — you're leaving edge on the table.`,
  spread_too_tight: (c) =>
    `Spread of ${formatFair(c.spread)} is too tight given the uncertainty. Widen slightly to protect against adverse selection.`,
  bid_too_high: (c) =>
    `Bid ${formatFair(c.bid)} is above fair value (${formatFair(c.fairValue)}). A counterparty would sell to you instantly — bad for inventory.`,
  ask_too_low: (c) =>
    `Ask ${formatFair(c.ask)} is below fair value (${formatFair(c.fairValue)}). You'd be giving away edge to buyers.`,
};

interface Ctx {
  bid: number;
  ask: number;
  mid: number;
  spread: number;
  fairValue: number;
}

export function validateQuote(
  quote: Quote,
  fairValue: number,
  level: Pick<LevelConfig, "fairTolerance" | "minSpread" | "maxSpread">,
  inventory = 0,
  inventorySkew = 0,
): QuoteFeedback {
  const { bid, ask } = quote;
  const mid = (bid + ask) / 2;
  const spread = ask - bid;
  const ctx: Ctx = { bid, ask, mid, spread, fairValue };

  const issues: QuoteIssue[] = [];

  if (bid >= ask) issues.push("bid_above_ask");

  const skew = inventory * inventorySkew * 0.05;
  const adjustedFair = fairValue - skew;

  if (Math.abs(mid - adjustedFair) > level.fairTolerance) {
    issues.push("mid_off_fair");
  }
  if (spread > level.maxSpread) issues.push("spread_too_wide");
  if (spread < level.minSpread) issues.push("spread_too_tight");
  if (bid > adjustedFair + level.fairTolerance * 0.5) issues.push("bid_too_high");
  if (ask < adjustedFair - level.fairTolerance * 0.5) issues.push("ask_too_low");

  const messages = issues.map((i) => ISSUE_MESSAGES[i](ctx));

  return {
    ok: issues.length === 0,
    issues,
    messages,
    fairValue: adjustedFair,
    mid,
    spread,
  };
}

export function validateQuoteForTutorial(
  quote: Quote,
  fairValue: number,
  checks: QuoteIssue[],
  level: Pick<LevelConfig, "fairTolerance" | "minSpread" | "maxSpread">,
): QuoteFeedback {
  const full = validateQuote(quote, fairValue, level);
  const issues = full.issues.filter((i) => checks.includes(i));
  return {
    ...full,
    ok: issues.length === 0,
    issues,
    messages: issues.map((i) => ISSUE_MESSAGES[i]({
      bid: quote.bid,
      ask: quote.ask,
      mid: full.mid,
      spread: full.spread,
      fairValue,
    })),
  };
}
