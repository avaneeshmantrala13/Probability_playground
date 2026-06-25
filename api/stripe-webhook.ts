import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import Stripe from "stripe";

/** Stripe needs the raw request body for signature verification. */
export const config = {
  api: { bodyParser: false },
};

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
  try {
    const method = req.method?.toUpperCase() ?? "";
    if (method === "OPTIONS") {
      res.setHeader("Allow", "POST, OPTIONS");
      return res.status(204).end();
    }

    if (method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
    if (!stripeSecret || !webhookSecret) {
      console.error("[stripe-webhook] missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET");
      return res.status(503).json({ error: "Stripe webhook not configured" });
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" });
    const sig = req.headers["stripe-signature"];
    if (!sig || typeof sig !== "string") {
      return res.status(400).json({ error: "Missing stripe-signature" });
    }

    const rawBody = await readRawBody(req);
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
      console.error("[stripe-webhook] signature verification failed:", err);
      return res.status(400).json({ error: "Invalid signature" });
    }

    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    } else {
      console.info("[stripe-webhook] ignored event type:", event.type);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook handler failed";
    console.error("[stripe-webhook] handler error:", message, err);
    return res.status(500).json({ error: message });
  }
}
