import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAdminApp } from "./firebase-admin";

export interface CreditResult {
  ok: true;
  /** false when this session was already credited (idempotent skip). */
  credited: boolean;
  newBalance: number;
  tokenAmount: number;
}

export interface CreditFailure {
  ok: false;
  error: string;
}

export type CreditOutcome = CreditResult | CreditFailure;

export async function creditTokens(
  uid: string,
  amount: number,
  sessionId: string,
): Promise<CreditOutcome> {
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

    console.info("[credit-tokens]", {
      sessionId,
      uid,
      amount,
      credited,
      newBalance,
    });

    return { ok: true, credited, newBalance, tokenAmount: amount };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Firestore transaction failed";
    console.error("[credit-tokens] failed:", { sessionId, uid, amount, err });
    return { ok: false, error: message };
  }
}
