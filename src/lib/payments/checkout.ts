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

/**
 * Creates a Stripe Checkout session via our Vercel API route and redirects.
 * Returns false if the request failed (caller should show an error).
 */
export async function startCheckout(opts: StartCheckoutOpts): Promise<boolean> {
  const uid = auth.currentUser?.uid;
  if (!uid) return false;

  const res = await fetch("/api/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...opts, uid }),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { url?: string; sessionId?: string };
  if (data.url) {
    window.location.href = data.url;
    return true;
  }
  const stripe = await getStripe();
  if (stripe && data.sessionId) {
    const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
    return !error;
  }
  return false;
}
