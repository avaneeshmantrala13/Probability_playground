import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { verifyBearerToken } from "./_lib/firebase-auth";

/** Mirrors src/lib/payments/pricing.ts — kept inline for Vercel ESM bundling. */
const SP_TOKEN_PACK_AMOUNT = 1000;
const SP_TOKEN_PACK_PRICE_CENTS = 99;

type CheckoutKind = "sp_tokens" | "mp_buyin";

function multiplayerBuyInPriceCents(buyIn: number): number {
  if (buyIn <= 1000) return SP_TOKEN_PACK_PRICE_CENTS;
  const extraTokens = buyIn - 1000;
  const extraDollars = Math.ceil(extraTokens / 100);
  return SP_TOKEN_PACK_PRICE_CENTS + extraDollars * 100;
}

function getOrigin(req: VercelRequest): string {
  const proto = (req.headers["x-forwarded-proto"] as string) ?? "https";
  const host = req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost:5173";
  return `${proto}://${host}`;
}

function priceForKind(kind: CheckoutKind, tokenAmount: number): number {
  if (kind === "sp_tokens") return SP_TOKEN_PACK_PRICE_CENTS;
  return multiplayerBuyInPriceCents(tokenAmount);
}

// ---------------------------------------------------------------------------
// Subscription tier + one-time sprint billing.
//
// Mirrors src/lib/billing/plans.ts (PRICE_ENV_BY_KEY / CHECKOUT_MODE_BY_KEY) —
// kept inline because Vercel bundles api/ separately. Keep the two in sync.
// ---------------------------------------------------------------------------

type EntitlementLevel = "free" | "pro" | "interview_prep";
type EntitlementSource = "subscription" | "sprint";

interface BillingPrice {
  envVar: string;
  mode: "subscription" | "payment";
  plan: EntitlementLevel;
  source: EntitlementSource;
  /** Days of access for one-time sprints; undefined for subscriptions. */
  sprintDays?: number;
}

const BILLING_PRICES: Record<string, BillingPrice> = {
  pro_monthly: {
    envVar: "STRIPE_PRICE_PRO_MONTHLY",
    mode: "subscription",
    plan: "pro",
    source: "subscription",
  },
  pro_annual: {
    envVar: "STRIPE_PRICE_PRO_ANNUAL",
    mode: "subscription",
    plan: "pro",
    source: "subscription",
  },
  interview_monthly: {
    envVar: "STRIPE_PRICE_INTERVIEW_MONTHLY",
    mode: "subscription",
    plan: "interview_prep",
    source: "subscription",
  },
  interview_annual: {
    envVar: "STRIPE_PRICE_INTERVIEW_ANNUAL",
    mode: "subscription",
    plan: "interview_prep",
    source: "subscription",
  },
  sprint_2wk: {
    envVar: "STRIPE_PRICE_SPRINT_2WK",
    mode: "payment",
    plan: "interview_prep",
    source: "sprint",
    sprintDays: 14,
  },
  sprint_4wk: {
    envVar: "STRIPE_PRICE_SPRINT_4WK",
    mode: "payment",
    plan: "interview_prep",
    source: "sprint",
    sprintDays: 30,
  },
  sprint_firm: {
    envVar: "STRIPE_PRICE_SPRINT_FIRM",
    mode: "payment",
    plan: "interview_prep",
    source: "sprint",
    sprintDays: 30,
  },
};

/**
 * New billing flow: subscription tiers + one-time sprints.
 * Auth'd with a Firebase Bearer token; resolves priceKey → Stripe Price ID via
 * env var; writes the uid + entitlement intent into metadata for the webhook.
 */
async function handleEntitlementCheckout(
  req: VercelRequest,
  res: VercelResponse,
  stripe: Stripe,
): Promise<VercelResponse> {
  const session = await verifyBearerToken(req.headers.authorization);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const { priceKey, mode, targetFirmId } = req.body as {
    priceKey?: string;
    mode?: "subscription" | "payment";
    targetFirmId?: string;
  };

  if (!priceKey || !(priceKey in BILLING_PRICES)) {
    return res.status(400).json({ error: "Unknown or missing priceKey" });
  }

  const config = BILLING_PRICES[priceKey];
  if (mode && mode !== config.mode) {
    return res.status(400).json({
      error: `priceKey "${priceKey}" requires mode "${config.mode}"`,
    });
  }

  const priceId = process.env[config.envVar]?.trim() ?? "";
  if (!priceId) {
    return res.status(503).json({
      error: `This plan is not available yet — ${config.envVar} is not set on the server. Add the Stripe Price ID in Vercel → Settings → Environment Variables and redeploy.`,
    });
  }

  const origin = getOrigin(req);
  const metadata: Record<string, string> = {
    kind: "entitlement",
    uid: session.uid,
    priceKey,
    entitlementPlan: config.plan,
    entitlementSource: config.source,
    sprintDays: config.sprintDays != null ? String(config.sprintDays) : "",
    targetFirmId: typeof targetFirmId === "string" ? targetFirmId : "",
  };

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: config.mode,
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: session.uid,
    metadata,
    success_url: `${origin}/pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing?checkout=cancel`,
    allow_promotion_codes: true,
  };

  // Propagate uid/entitlement onto the subscription so renewal/cancellation
  // events (which don't carry the checkout metadata) can still be attributed.
  if (config.mode === "subscription") {
    params.subscription_data = { metadata };
  }

  const checkout = await stripe.checkout.sessions.create(params);
  return res.status(200).json({ url: checkout.url, sessionId: checkout.id });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
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

    // Route to the subscription/sprint flow when a priceKey is present.
    // Otherwise fall back to the legacy token-pack / multiplayer buy-in flow.
    if (req.body && typeof (req.body as { priceKey?: unknown }).priceKey === "string") {
      return await handleEntitlementCheckout(req, res, stripe);
    }

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
    console.error("create-checkout-session error:", err);
    const message = err instanceof Error ? err.message : "Failed to create checkout session";
    return res.status(500).json({ error: message });
  }
}
