import { auth } from "../firebase";

const POLL_INTERVAL_MS = 1500;
const MAX_ATTEMPTS = 12;

export interface CheckoutVerifyResult {
  ok: true;
  tokenAmount: number;
  credited: boolean;
  newBalance: number;
}

export type CheckoutReturnResult =
  | CheckoutVerifyResult
  | { ok: false; error: string; pending?: boolean };

async function verifyCheckoutSession(sessionId: string, uid: string): Promise<CheckoutReturnResult> {
  let res: Response;
  try {
    res = await fetch("/api/verify-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, uid }),
    });
  } catch {
    return { ok: false, error: "Network error verifying payment." };
  }

  if (res.status === 409) {
    return { ok: false, error: "Payment still processing.", pending: true };
  }

  if (!res.ok) {
    try {
      const data = (await res.json()) as { error?: string };
      return { ok: false, error: data.error ?? `Verification failed (HTTP ${res.status}).` };
    } catch {
      return { ok: false, error: `Verification failed (HTTP ${res.status}).` };
    }
  }

  const data = (await res.json()) as CheckoutVerifyResult;
  return data;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * After Stripe redirect, verify the session and credit tokens (idempotent).
 * Retries while Stripe marks the session unpaid or the server is still catching up.
 */
export async function completeCheckoutReturn(sessionId: string): Promise<CheckoutReturnResult> {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return { ok: false, error: "Sign in to receive purchased tokens." };
  }

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const result = await verifyCheckoutSession(sessionId, uid);
    if (result.ok) return result;
    if (!result.pending) return result;
    if (attempt < MAX_ATTEMPTS - 1) await sleep(POLL_INTERVAL_MS);
  }

  return {
    ok: false,
    error: "Payment is taking longer than expected. Your balance should update soon — try refreshing.",
    pending: true,
  };
}
