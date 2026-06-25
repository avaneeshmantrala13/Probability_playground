import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { creditTokens } from "./lib/credit-tokens";

const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";

export const config = {
  api: { bodyParser: false },
};

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const uid = session.metadata?.uid?.trim();
  const tokenAmount = Number(session.metadata?.tokenAmount ?? 0);
  const sessionId = session.id;

  if (!sessionId) {
    console.error("[stripe-webhook] checkout.session.completed missing session.id");
    throw new Error("Missing session id");
  }

  if (!uid) {
    console.error("[stripe-webhook] checkout.session.completed missing metadata.uid", {
      sessionId,
      metadata: session.metadata,
    });
    throw new Error("Missing metadata.uid on checkout session");
  }

  if (!Number.isFinite(tokenAmount) || tokenAmount <= 0) {
    console.error("[stripe-webhook] invalid metadata.tokenAmount", {
      sessionId,
      uid,
      tokenAmount: session.metadata?.tokenAmount,
    });
    throw new Error("Invalid metadata.tokenAmount on checkout session");
  }

  if (session.payment_status !== "paid") {
    console.warn("[stripe-webhook] session not paid yet — skipping credit", {
      sessionId,
      uid,
      payment_status: session.payment_status,
    });
    return;
  }

  const result = await creditTokens(uid, tokenAmount, sessionId);
  if (!result.ok) {
    console.error("[stripe-webhook] creditTokens failed:", {
      sessionId,
      uid,
      tokenAmount,
      error: result.error,
    });
    throw new Error(result.error);
  }

  console.info("[stripe-webhook] checkout credited", {
    sessionId,
    uid,
    tokenAmount,
    credited: result.credited,
    newBalance: result.newBalance,
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).send("Method not allowed");
  }

  if (!stripeSecret || !webhookSecret) {
    console.error("[stripe-webhook] missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET");
    return res.status(503).send("Stripe webhook not configured");
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" });
  const sig = req.headers["stripe-signature"];
  if (!sig || typeof sig !== "string") {
    return res.status(400).send("Missing stripe-signature");
  }

  let event: Stripe.Event;
  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("[stripe-webhook] signature verification failed:", err);
    return res.status(400).send("Invalid signature");
  }

  try {
    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    } else {
      console.info("[stripe-webhook] ignored event type:", event.type);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook handler failed";
    console.error("[stripe-webhook] handler error:", { type: event.type, message, err });
    return res.status(500).json({ error: message });
  }

  return res.status(200).json({ received: true });
}
