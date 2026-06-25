import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import Stripe from "stripe";

/** Firebase Admin + token crediting — inline for Vercel ESM bundling. */
function parseServiceAccountJson(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const attempts = [trimmed, trimmed.replace(/^['"]|['"]$/g, "")];
  for (const candidate of attempts) {
    try {
      const parsed = JSON.parse(candidate) as Record<string, unknown>;
      if (parsed && typeof parsed.project_id === "string") return parsed;
    } catch {
      // try next
    }
  }
  return null;
}

function getAdminApp(): App | null {
  if (getApps().length) return getApps()[0];

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() ?? "";
  if (!raw) {
    console.error("[firebase-admin] FIREBASE_SERVICE_ACCOUNT_JSON is not set");
    return null;
  }

  const serviceAccount = parseServiceAccountJson(raw);
  if (!serviceAccount) {
    console.error(
      "[firebase-admin] FIREBASE_SERVICE_ACCOUNT_JSON is invalid JSON — paste the full service account file as one line (see PAYMENTS.md)",
    );
    return null;
  }

  try {
    return initializeApp({ credential: cert(serviceAccount as Parameters<typeof cert>[0]) });
  } catch (err) {
    console.error("[firebase-admin] init failed:", err);
    return null;
  }
}

interface CreditResult {
  ok: true;
  credited: boolean;
  newBalance: number;
  tokenAmount: number;
}

interface CreditFailure {
  ok: false;
  error: string;
}

type CreditOutcome = CreditResult | CreditFailure;

async function creditTokens(uid: string, amount: number, sessionId: string): Promise<CreditOutcome> {
  const app = getAdminApp();
  if (!app) {
    return {
      ok: false,
      error:
        "Firebase Admin not configured — set FIREBASE_SERVICE_ACCOUNT_JSON in Vercel and redeploy",
    };
  }

  const db = getFirestore(app);
  const purchaseRef = db.collection("tokenPurchases").doc(sessionId);
  const progressRef = db.collection("courseProgress").doc(uid);

  try {
    let credited = false;
    let newBalance = 0;

    await db.runTransaction(async (tx) => {
      const purchaseSnap = await tx.get(purchaseRef);
      if (purchaseSnap.exists) {
        const progressSnap = await tx.get(progressRef);
        newBalance = progressSnap.exists ? (progressSnap.data()?.tokens ?? 0) : 0;
        return;
      }

      const progressSnap = await tx.get(progressRef);
      const current = progressSnap.exists ? (progressSnap.data()?.tokens ?? 0) : 0;
      newBalance = current + amount;
      const peak = Math.max(progressSnap.data()?.peakTokens ?? 0, newBalance);
      const lifetime = (progressSnap.data()?.lifetimeTokens ?? 0) + amount;

      tx.set(purchaseRef, {
        uid,
        amount,
        sessionId,
        creditedAt: FieldValue.serverTimestamp(),
      });
      tx.set(
        progressRef,
        {
          tokens: newBalance,
          peakTokens: peak,
          lifetimeTokens: lifetime,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      credited = true;
    });

    console.info("[credit-tokens]", { sessionId, uid, amount, credited, newBalance });
    return { ok: true, credited, newBalance, tokenAmount: amount };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Firestore transaction failed";
    console.error("[credit-tokens] failed:", { sessionId, uid, amount, err });
    return { ok: false, error: message };
  }
}

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
