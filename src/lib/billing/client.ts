/**
 * Client-side checkout helper. POSTs to /api/stripe-checkout with the Firebase
 * ID token and redirects the browser to the returned Stripe Checkout URL.
 */
import { auth } from "../firebase";
import type { BillingInterval, PaidPlanId, SprintId } from "./plans";

export interface StartCheckoutArgs {
  /** For subscriptions. Omit when buying a sprint. */
  plan?: PaidPlanId;
  /** Billing interval for subscriptions. Defaults to "monthly" server-side. */
  interval?: BillingInterval;
  /** For one-time sprint purchases. Omit when subscribing. */
  sprintId?: SprintId;
}

export type StartCheckoutResult =
  | { ok: true }
  | { ok: false; error: string; status?: number };

async function readError(res: Response): Promise<string> {
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
      return "Checkout API returned the app page instead of JSON. Redeploy and confirm /api/stripe-checkout is listed under Deployment → Functions on Vercel.";
    }
    if (text) return text.slice(0, 200);
  }
  if (res.status === 404) {
    return "Checkout API not found (404). Confirm /api/stripe-checkout is deployed.";
  }
  if (res.status === 503) {
    return "Payments are not configured yet. The owner needs to set the Stripe keys and price IDs.";
  }
  return `Checkout failed (HTTP ${res.status}).`;
}

/**
 * Begins a Stripe Checkout flow and redirects on success. Returns an error
 * result (rather than throwing) so callers can show inline messaging.
 */
export async function startCheckout(
  args: StartCheckoutArgs,
): Promise<StartCheckoutResult> {
  const user = auth.currentUser;
  if (!user) {
    return { ok: false, error: "Please sign in to upgrade." };
  }

  let token: string;
  try {
    token = await user.getIdToken();
  } catch {
    return { ok: false, error: "Could not verify your session. Try signing in again." };
  }

  let res: Response;
  try {
    res = await fetch("/api/stripe-checkout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
    });
  } catch {
    return { ok: false, error: "Network error reaching the checkout API." };
  }

  if (!res.ok) {
    return { ok: false, error: await readError(res), status: res.status };
  }

  let data: { url?: string };
  try {
    data = (await res.json()) as { url?: string };
  } catch {
    return { ok: false, error: "Checkout API returned invalid JSON." };
  }

  if (data.url) {
    window.location.href = data.url;
    return { ok: true };
  }
  return { ok: false, error: "Checkout API did not return a redirect URL." };
}
