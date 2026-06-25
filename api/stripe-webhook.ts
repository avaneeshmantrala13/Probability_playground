import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const stripeSecret = process.env.STRIPE_SECRET_KEY ?? "";
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

function getAdminApp(): App | null {
  if (getApps().length) return getApps()[0];
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json) return null;
  try {
    const serviceAccount = JSON.parse(json);
    return initializeApp({ credential: cert(serviceAccount) });
  } catch {
    return null;
  }
}

async function creditTokens(uid: string, amount: number, sessionId: string): Promise<void> {
  const app = getAdminApp();
  if (!app) {
    console.error("Firebase Admin not configured — cannot credit tokens");
    return;
  }
  const db = getFirestore(app);
  const purchaseRef = db.collection("tokenPurchases").doc(sessionId);
  const progressRef = db.collection("courseProgress").doc(uid);

  await db.runTransaction(async (tx) => {
    const purchaseSnap = await tx.get(purchaseRef);
    if (purchaseSnap.exists) return; // idempotent

    const progressSnap = await tx.get(progressRef);
    const current = progressSnap.exists ? (progressSnap.data()?.tokens ?? 0) : 0;
    const next = current + amount;
    const peak = Math.max(progressSnap.data()?.peakTokens ?? 0, next);
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
        tokens: next,
        peakTokens: peak,
        lifetimeTokens: lifetime,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });
}

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).send("Method not allowed");
  }

  if (!stripeSecret || !webhookSecret) {
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
    console.error("Webhook signature verification failed:", err);
    return res.status(400).send("Invalid signature");
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const uid = session.metadata?.uid;
    const tokenAmount = Number(session.metadata?.tokenAmount ?? 0);
    if (uid && tokenAmount > 0 && session.id) {
      await creditTokens(uid, tokenAmount, session.id);
    }
  }

  return res.status(200).json({ received: true });
}
