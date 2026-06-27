import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const STARTING_TOKENS = 1000;

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

function getAdminApp(): App | null {
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

function freshProgress() {
  return {
    currentLesson: null,
    currentQuestion: 0,
    completedLessons: [],
    lessonMastery: {},
    streak: 0,
    lastActiveDate: null,
    activeAttempt: null,
    lessonTimers: {},
    tokens: STARTING_TOKENS,
    pokerSeeded: true,
    peakTokens: STARTING_TOKENS,
    lifetimeTokens: STARTING_TOKENS,
    problemsCorrect: 0,
    ownedCosmetics: [
      "deck-classic",
      "table-classic-green",
      "accent-default",
      "chip-classic",
      "acc-none",
      "anim-none",
      "outfit-default",
    ],
    equipped: {
      deckSkin: "deck-classic",
      tableTheme: "table-classic-green",
      accentTheme: "accent-default",
      chipStyle: "chip-classic",
      avatarAccessory: "acc-none",
      animation: "anim-none",
      playerOutfit: "outfit-default",
    },
    pokerStats: { handsPlayed: 0, handsWon: 0, biggestPot: 0, bustCount: 0 },
    freePlayMinutesRemaining: 0,
    quizLives: 0,
    lastLoginRewardDate: null,
    pendingChest: null,
    loginHistory: {},
    chestBadgesEarned: [],
    chestStats: { opens: 0, tokensFromChests: 0, badgesFromChests: 0 },
    mentalMathBest: { easy: 0, medium: 0, hard: 0 },
    updatedAt: new Date(),
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret =
    process.env.ADMIN_RESET_SECRET?.trim() ||
    process.env.ADMIN_RESET_SECRET_KEY?.trim();
  if (!secret) {
    return res.status(503).json({
      error: "ADMIN_RESET_SECRET (or ADMIN_RESET_SECRET_KEY) is not configured.",
    });
  }

  const provided =
    (typeof req.headers["x-admin-secret"] === "string" && req.headers["x-admin-secret"]) ||
    (typeof req.body?.secret === "string" ? req.body.secret : "");
  if (provided !== secret) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const email =
    (typeof req.body?.email === "string" && req.body.email.trim().toLowerCase()) || "";
  if (!email) {
    return res.status(400).json({ error: "Missing email" });
  }

  const app = getAdminApp();
  if (!app) {
    return res.status(503).json({ error: "Firebase Admin is not configured." });
  }

  try {
    const auth = getAuth(app);
    const user = await auth.getUserByEmail(email);
    const db = getFirestore(app);
    const uid = user.uid;

    await db.collection("courseProgress").doc(uid).set(freshProgress(), { merge: false });

    const username =
      user.displayName ?? email.split("@")[0] ?? "Learner";

    await db.collection("leaderboard").doc(uid).set(
      {
        uid,
        username,
        lifetimeTokens: STARTING_TOKENS,
        streak: 0,
        problemsCorrect: 0,
        updatedAt: new Date(),
      },
      { merge: true },
    );

    await db.collection("mentalMathLeaderboard").doc(uid).set(
      {
        uid,
        username,
        bestEasy: 0,
        bestMedium: 0,
        bestHard: 0,
        updatedAt: new Date(),
      },
      { merge: true },
    );

    const attempts = await db.collection("lessonAttempts").doc(uid).collection("attempts").get();
    const batch = db.batch();
    for (const doc of attempts.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();

    return res.status(200).json({ ok: true, uid, email, tokens: STARTING_TOKENS });
  } catch (err) {
    console.error("admin-reset-progress error:", err);
    const message = err instanceof Error ? err.message : "Reset failed";
    return res.status(500).json({ error: message });
  }
}
