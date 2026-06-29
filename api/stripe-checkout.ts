import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { verifyBearerToken } from "./_lib/firebase-auth.js";

/**
 * Creates a Stripe Checkout Session for a subscription tier or a one-time
 * "sprint" product. Price IDs are read from env vars (never hardcoded), so the
 * same code works in Stripe test and live modes.
 *
 * Config below mirrors src/lib/billing/plans.ts but is kept inline for reliable
 * Vercel ESM bundling (same approach as create-checkout-session.ts).
 */

type PaidPlanId = "pro" | "interview_prep";
type BillingInterval = "monthly" | "annual";
type SprintId = "sprint_1wk" | "sprint_2wk" | "sprint_4wk" | "sprint_firm";

const PLAN_PRICE_ENV: Record<PaidPlanId, Record<BillingInterval, string>> = {
  pro: {
    monthly: "STRIPE_PRICE_PRO_MONTHLY",
    annual: "STRIPE_PRICE_PRO_ANNUAL",
  },
  interview_prep: {
    monthly: "STRIPE_PRICE_INTERVIEW_MONTHLY",
    annual: "STRIPE_PRICE_INTERVIEW_ANNUAL",
  },
};

const SPRINT_CONFIG: Record<SprintId, { priceEnvVar: string; durationDays: number }> = {
  sprint_1wk: { priceEnvVar: "STRIPE_PRICE_SPRINT_1WK", durationDays: 7 },
  sprint_2wk: { priceEnvVar: "STRIPE_PRICE_SPRINT_2WK", durationDays: 14 },
  sprint_4wk: { priceEnvVar: "STRIPE_PRICE_SPRINT_4WK", durationDays: 28 },
  sprint_firm: { priceEnvVar: "STRIPE_PRICE_SPRINT_FIRM", durationDays: 28 },
};

function isPaidPlan(value: unknown): value is PaidPlanId {
  return value === "pro" || value === "interview_prep";
}

function isInterval(value: unknown): value is BillingInterval {
  return value === "monthly" || value === "annual";
}

function isSprintId(value: unknown): value is SprintId {
  return (
    value === "sprint_1wk" ||
    value === "sprint_2wk" ||
    value === "sprint_4wk" ||
    value === "sprint_firm"
  );
}

function getOrigin(req: VercelRequest): string {
  const proto = (req.headers["x-forwarded-proto"] as string) ?? "https";
  const host = req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost:5173";
  return `${proto}://${host}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await verifyBearerToken(req.headers.authorization);
  if (!session) return res.status(401).json({ error: "Unauthorized" });
  const uid = session.uid;

  const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  if (!stripeSecret) {
    return res.status(503).json({
      error:
        "Payments are not configured. Set STRIPE_SECRET_KEY (no VITE_ prefix) in Vercel and redeploy.",
    });
  }

  const body = (req.body ?? {}) as {
    plan?: unknown;
    interval?: unknown;
    sprintId?: unknown;
  };

  const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" });
  const origin = getOrigin(req);
  const successUrl = `${origin}/pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/pricing?checkout=cancel`;

  try {
    // ----- One-time sprint purchase -----
    if (body.sprintId !== undefined) {
      if (!isSprintId(body.sprintId)) {
        return res.status(400).json({ error: "Unknown sprintId" });
      }
      const sprint = SPRINT_CONFIG[body.sprintId];
      const priceId = process.env[sprint.priceEnvVar]?.trim() ?? "";
      if (!priceId) {
        return res.status(503).json({
          error: `Missing Stripe Price ID. Set ${sprint.priceEnvVar} in Vercel and redeploy.`,
        });
      }

      const checkout = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [{ price: priceId, quantity: 1 }],
        client_reference_id: uid,
        metadata: {
          kind: "sprint",
          uid,
          sprintId: body.sprintId,
          durationDays: String(sprint.durationDays),
        },
        // Mirror onto the PaymentIntent so it's recoverable from payment events too.
        payment_intent_data: {
          metadata: {
            kind: "sprint",
            uid,
            sprintId: body.sprintId,
            durationDays: String(sprint.durationDays),
          },
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      return res.status(200).json({ url: checkout.url });
    }

    // ----- Subscription purchase -----
    if (!isPaidPlan(body.plan)) {
      return res.status(400).json({ error: "Missing or invalid plan" });
    }
    const interval: BillingInterval = isInterval(body.interval) ? body.interval : "monthly";
    const priceEnvVar = PLAN_PRICE_ENV[body.plan][interval];
    const priceId = process.env[priceEnvVar]?.trim() ?? "";
    if (!priceId) {
      return res.status(503).json({
        error: `Missing Stripe Price ID. Set ${priceEnvVar} in Vercel and redeploy.`,
      });
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: uid,
      metadata: {
        kind: "subscription",
        uid,
        plan: body.plan,
        interval,
      },
      // Stamp the subscription so subscription.updated/deleted can resolve uid.
      subscription_data: {
        metadata: {
          kind: "subscription",
          uid,
          plan: body.plan,
          interval,
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return res.status(200).json({ url: checkout.url });
  } catch (err) {
    console.error("stripe-checkout error:", err);
    const message = err instanceof Error ? err.message : "Failed to create checkout session";
    return res.status(500).json({ error: message });
  }
}
