import { formatFair } from "./fairValue";
import type { LevelConfig, Quote, Scenario, TradeResult } from "./types";

/** AI counterparty decides whether to trade against the player's quote. */
export function resolveTrade(
  quote: Quote,
  scenario: Scenario,
  level: LevelConfig,
  inventory: number,
): TradeResult {
  const fair = scenario.fairValue - inventory * level.inventorySkew * 0.05;
  const { bid, ask } = quote;

  const buyEdge = fair - ask;
  const sellEdge = bid - fair;

  const roll = Math.random();

  if (buyEdge > level.aiEdgeThreshold && roll < level.aiAggression) {
    const pnl = ask - fair;
    return {
      side: "buy",
      price: ask,
      pnl,
      explanation: `Counterparty lifted your ask at ${formatFair(ask)} (fair ≈ ${formatFair(fair)}). You sold; P&L = ${formatFair(pnl)}.`,
    };
  }

  if (sellEdge > level.aiEdgeThreshold && roll < level.aiAggression) {
    const pnl = fair - bid;
    return {
      side: "sell",
      price: bid,
      pnl,
      explanation: `Counterparty hit your bid at ${formatFair(bid)} (fair ≈ ${formatFair(fair)}). You bought; P&L = ${formatFair(pnl)}.`,
    };
  }

  return {
    side: "pass",
    price: 0,
    pnl: 0,
    explanation: "No trade — your quote was fair enough that the counterparty passed.",
  };
}

/** AI market maker quote for display in advanced modes (optional reference). */
export function aiQuote(scenario: Scenario, level: LevelConfig): Quote {
  const half = (level.minSpread + level.maxSpread) / 4;
  const fair = scenario.fairValue;
  return {
    bid: roundTick(fair - half),
    ask: roundTick(fair + half),
  };
}

function roundTick(x: number): number {
  return Math.round(x * 4) / 4;
}

export function isLevelCleared(
  level: LevelConfig,
  round: number,
  pnl: number,
  validQuotes: number,
): boolean {
  return round >= level.roundsToClear && pnl >= level.pnlTarget && validQuotes >= level.roundsToClear;
}
