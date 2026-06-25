import { initializeApp, cert, getApps, type App } from "firebase-admin/app";

let initError: string | null = null;

/** Parse service account JSON from Vercel env (handles common paste mistakes). */
export function parseServiceAccountJson(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const attempts = [
    trimmed,
    trimmed.replace(/^['"]|['"]$/g, ""),
  ];

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

export function getAdminInitError(): string | null {
  return initError;
}

export function getAdminApp(): App | null {
  if (getApps().length) return getApps()[0];

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() ?? "";
  if (!raw) {
    initError = "FIREBASE_SERVICE_ACCOUNT_JSON is not set";
    console.error("[firebase-admin]", initError);
    return null;
  }

  const serviceAccount = parseServiceAccountJson(raw);
  if (!serviceAccount) {
    initError =
      "FIREBASE_SERVICE_ACCOUNT_JSON is invalid JSON — paste the full service account file as one line (see PAYMENTS.md)";
    console.error("[firebase-admin]", initError);
    return null;
  }

  try {
    initError = null;
    return initializeApp({ credential: cert(serviceAccount as Parameters<typeof cert>[0]) });
  } catch (err) {
    initError = err instanceof Error ? err.message : "Firebase Admin init failed";
    console.error("[firebase-admin] init failed:", err);
    return null;
  }
}
