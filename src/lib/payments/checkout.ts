import { loadStripe } from "@stripe/stripe-js";
import { auth } from "../firebase";
import type { CheckoutKind } from "./pricing";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "";

let stripePromise: ReturnType<typeof loadStripe> | null = null;

export function isStripeConfigured(): boolean {
  return publishableKey.length > 0;
}

function getStripe() {
  if (!stripePromise && publishableKey) {
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

export interface StartCheckoutOpts {
  kind: CheckoutKind;
  tokenAmount: number;
  roomId?: string;
  buyIn?: number;
}

export type CheckoutResult =
  | { ok: true }
  | { ok: false; error: string; status?: number };

async function readApiError(res: Response): Promise<string> {
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) return data.error;
    } catch {
      // fall through
    }
  } else {
    const text = (await res.text()).trim();
    if (text.startsWith("<!DOCTYPE") || text.startsWith("<html")) {
      return "Checkout API returned the app page instead of JSON. Redeploy and confirm /api/create-checkout-session appears under Deployment → Functions.";
    }
    if (text) return text.slice(0, 200);
  }

  if (res.status === 404) {
    return "Checkout API not found (404). Confirm /api/create-checkout-session is listed under Deployment → Functions on Vercel.";
  }
  if (res.status === 503) {
    return "Stripe secret key missing on the server. Set STRIPE_SECRET_KEY (no VITE_ prefix) for Production and redeploy.";
  }
  return `Checkout failed (HTTP ${res.status}).`;
}

/**
 * Creates a Stripe Checkout session via our Vercel API route and redirects.
 */
export async function startCheckout(opts: StartCheckoutOpts): Promise<CheckoutResult> {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return { ok: false, error: "Sign in to purchase tokens." };
  }

  let res: Response;
  try {
    res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...opts, uid }),
    });
  } catch {
    return { ok: false, error: "Network error reaching checkout API." };
  }

  if (!res.ok) {
    return { ok: false, error: await readApiError(res), status: res.status };
  }

  let data: { url?: string; sessionId?: string };
  try {
    data = (await res.json()) as { url?: string; sessionId?: string };
  } catch {
    return {
      ok: false,
      error: "Checkout API returned invalid JSON. See Deployment → Functions on Vercel.",
    };
  }

  if (data.url) {
    window.location.href = data.url;
    return { ok: true };
  }

  const stripe = await getStripe();
  if (stripe && data.sessionId) {
    const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
    if (error) return { ok: false, error: error.message ?? "Stripe redirect failed." };
    return { ok: true };
  }

  return { ok: false, error: "Checkout API did not return a session URL." };
}
