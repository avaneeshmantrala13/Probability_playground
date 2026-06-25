import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import {
  SP_TOKEN_PACK_AMOUNT,
  SP_TOKEN_PACK_PRICE_CENTS,
  multiplayerBuyInPriceCents,
  type CheckoutKind,
} from "./_lib/pricing";

function getOrigin(req: VercelRequest): string {
  const proto = (req.headers["x-forwarded-proto"] as string) ?? "https";
  const host = req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost:5173";
  return `${proto}://${host}`;
}

function priceForKind(kind: CheckoutKind, tokenAmount: number): number {
  if (kind === "sp_tokens") return SP_TOKEN_PACK_PRICE_CENTS;
  return multiplayerBuyInPriceCents(tokenAmount);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  if (!stripeSecret) {
    return res.status(503).json({
      error:
        "STRIPE_SECRET_KEY is not set on the server. Add it in Vercel → Settings → Environment Variables (Production + Preview, no VITE_ prefix) and redeploy.",
    });
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" });
  const { kind, tokenAmount, uid, roomId, buyIn } = req.body as {
    kind?: CheckoutKind;
    tokenAmount?: number;
    uid?: string;
    roomId?: string;
    buyIn?: number;
  };

  if (!kind || !uid || typeof tokenAmount !== "number" || tokenAmount <= 0) {
    return res.status(400).json({ error: "Missing kind, uid, or tokenAmount" });
  }

  const amountCents = priceForKind(kind, tokenAmount);
  const origin = getOrigin(req);

  const productName =
    kind === "sp_tokens"
      ? `${SP_TOKEN_PACK_AMOUNT.toLocaleString()} Probability Playground Tokens`
      : `Multiplayer buy-in · ${tokenAmount.toLocaleString()} tokens`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: { name: productName },
          },
          quantity: 1,
        },
      ],
      metadata: {
        kind,
        uid,
        tokenAmount: String(kind === "sp_tokens" ? SP_TOKEN_PACK_AMOUNT : tokenAmount),
        roomId: roomId ?? "",
        buyIn: String(buyIn ?? tokenAmount),
      },
      success_url: `${origin}/poker?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/poker?checkout=cancel`,
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    const message = err instanceof Error ? err.message : "Failed to create checkout session";
    return res.status(500).json({ error: message });
  }
}
