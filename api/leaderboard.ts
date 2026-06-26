import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

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
    console.error("[firebase-admin] FIREBASE_SERVICE_ACCOUNT_JSON is invalid JSON");
    return null;
  }

  try {
    return initializeApp({
      credential: cert(serviceAccount as Parameters<typeof cert>[0]),
    });
  } catch (err) {
    console.error("[firebase-admin] init failed:", err);
    return null;
  }
}

interface LeaderboardRow {
  uid: string;
  username: string;
  lifetimeTokens: number;
  streak: number;
  problemsCorrect: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const app = getAdminApp();
    if (!app) {
      return res.status(503).json({
        error: "Leaderboard unavailable — Firebase Admin is not configured on the server.",
      });
    }

    const authHeader = req.headers.authorization;
    const token =
      typeof authHeader === "string" && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;
    if (!token) {
      return res.status(401).json({ error: "Missing auth token" });
    }

    try {
      await getAuth(app).verifyIdToken(token);
    } catch {
      return res.status(401).json({ error: "Invalid auth token" });
    }

    const db = getFirestore(app);
    const [progressSnap, usersSnap] = await Promise.all([
      db.collection("courseProgress").get(),
      db.collection("users").get(),
    ]);

    const usernames = new Map<string, string>();
    for (const userDoc of usersSnap.docs) {
      const data = userDoc.data();
      const name =
        (typeof data.username === "string" && data.username) ||
        (typeof data.email === "string" ? data.email.split("@")[0] : null) ||
        "Learner";
      usernames.set(userDoc.id, name);
    }

    const entries: LeaderboardRow[] = progressSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: doc.id,
        username: usernames.get(doc.id) ?? "Learner",
        lifetimeTokens: typeof data.lifetimeTokens === "number" ? data.lifetimeTokens : 0,
        streak: typeof data.streak === "number" ? data.streak : 0,
        problemsCorrect:
          typeof data.problemsCorrect === "number" ? data.problemsCorrect : 0,
      };
    });

    return res.status(200).json({ entries });
  } catch (err) {
    console.error("leaderboard API error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return res.status(500).json({ error: message });
  }
}
