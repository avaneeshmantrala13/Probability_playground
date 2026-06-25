/** Single-player token pack: 1000 tokens for $0.99 flat. */
export const SP_TOKEN_PACK_AMOUNT = 1000;
export const SP_TOKEN_PACK_PRICE_CENTS = 99;

/**
 * Multiplayer buy-in pricing:
 * - ≤1000 tokens: $0.99 flat
 * - >1000: $0.99 + $1 per 100 tokens above 1000
 *   e.g. 1500 buy-in = $0.99 + $5 = $5.99
 */
export function multiplayerBuyInPriceCents(buyIn: number): number {
  if (buyIn <= 1000) return SP_TOKEN_PACK_PRICE_CENTS;
  const extraTokens = buyIn - 1000;
  const extraDollars = Math.ceil(extraTokens / 100);
  return SP_TOKEN_PACK_PRICE_CENTS + extraDollars * 100;
}

export function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export type CheckoutKind = "sp_tokens" | "mp_buyin";

export interface CheckoutMetadata {
  kind: CheckoutKind;
  uid: string;
  tokenAmount: number;
  roomId?: string;
}
