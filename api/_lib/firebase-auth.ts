import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function parseServiceAccountJson(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed.replace(/^['"]|['"]$/g, "")) as Record<string, unknown>;
    if (parsed && typeof parsed.project_id === "string") return parsed;
  } catch {
    return null;
  }
  return null;
}

export function getAdminApp(): App | null {
  if (getApps().length) return getApps()[0];
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() ?? "";
  if (!raw) return null;
  const serviceAccount = parseServiceAccountJson(raw);
  if (!serviceAccount) return null;
  try {
    return initializeApp({
      credential: cert(serviceAccount as Parameters<typeof cert>[0]),
    });
  } catch {
    return null;
  }
}

export async function verifyBearerToken(
  authHeader: string | undefined,
): Promise<{ uid: string } | null> {
  const token =
    typeof authHeader === "string" && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;
  if (!token) return null;
  const app = getAdminApp();
  if (!app) return null;
  try {
    const decoded = await getAuth(app).verifyIdToken(token);
    return { uid: decoded.uid };
  } catch {
    return null;
  }
}
