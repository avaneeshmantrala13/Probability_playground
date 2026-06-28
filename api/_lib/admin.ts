import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Shared Firebase Admin initializer for the serverless `api/` bundle.
 *
 * Mirrors the inline init originally written in `api/stripe-webhook.ts`: parse
 * FIREBASE_SERVICE_ACCOUNT_JSON, init exactly once, and hand back a Firestore
 * handle. Stays resilient — returns null and logs when unconfigured — so
 * callers can fail open instead of hard-crashing the request.
 */
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

export function getAdminApp(): App | null {
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

/** Firestore handle, or null when Admin is unconfigured (callers fail open). */
export function getDb(): Firestore | null {
  const app = getAdminApp();
  if (!app) return null;
  return getFirestore(app);
}
