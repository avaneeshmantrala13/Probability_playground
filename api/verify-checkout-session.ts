import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { creditTokens } from "./lib/credit-tokens";

/**
 * Client fallback after Stripe Checkout redirect: verifies the session is paid,
 * then credits tokens (idempotent — safe if the webhook already ran).
 */
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
          "STRIPE_SECRET_KEY is not set on the server. Add it in Vercel and redeploy.",
      });
    }

    const { sessionId, uid } = req.body as { sessionId?: string; uid?: string };
    if (!sessionId || !uid) {
      return res.status(400).json({ error: "Missing sessionId or uid" });
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" });
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.metadata?.uid !== uid) {
      console.warn("[verify-checkout-session] uid mismatch", {
        sessionId,
        requestUid: uid,
        metadataUid: session.metadata?.uid,
      });
      return res.status(403).json({ error: "Session does not belong to this user" });
    }

    if (session.payment_status !== "paid") {
      return res.status(409).json({
        error: "Payment not completed yet",
        payment_status: session.payment_status,
      });
    }

    const tokenAmount = Number(session.metadata?.tokenAmount ?? 0);
    if (!Number.isFinite(tokenAmount) || tokenAmount <= 0) {
      console.error("[verify-checkout-session] invalid tokenAmount", {
        sessionId,
        uid,
        tokenAmount: session.metadata?.tokenAmount,
      });
      return res.status(500).json({ error: "Invalid token amount on checkout session" });
    }

    const result = await creditTokens(uid, tokenAmount, sessionId);
    if (!result.ok) {
      console.error("[verify-checkout-session] credit failed:", {
        sessionId,
        uid,
        error: result.error,
      });
      return res.status(500).json({ error: result.error });
    }

    return res.status(200).json({
      ok: true,
      tokenAmount: result.tokenAmount,
      credited: result.credited,
      newBalance: result.newBalance,
    });
  } catch (err) {
    console.error("[verify-checkout-session] error:", err);
    const message = err instanceof Error ? err.message : "Failed to verify checkout session";
    return res.status(500).json({ error: message });
  }
}
