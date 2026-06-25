/** Shared pricing constants for serverless checkout (mirrors src/lib/payments/pricing.ts). */

export const SP_TOKEN_PACK_AMOUNT = 1000;
export const SP_TOKEN_PACK_PRICE_CENTS = 99;

export function multiplayerBuyInPriceCents(buyIn: number): number {
  if (buyIn <= 1000) return SP_TOKEN_PACK_PRICE_CENTS;
  const extraTokens = buyIn - 1000;
  const extraDollars = Math.ceil(extraTokens / 100);
  return SP_TOKEN_PACK_PRICE_CENTS + extraDollars * 100;
}

export type CheckoutKind = "sp_tokens" | "mp_buyin";
