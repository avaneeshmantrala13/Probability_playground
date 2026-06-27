#!/usr/bin/env node
/**
 * Reset a user's course progress and set tokens to 1000.
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT_JSON='...' node scripts/reset-user-progress.mjs avaneesh.mantrala@alphaaiengineering.com
 */
import { readFileSync, existsSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const STARTING_TOKENS = 1000;
const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error("Usage: node scripts/reset-user-progress.mjs <email>");
  process.exit(1);
}

function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON.trim());
  }
  for (const path of [".env.local", ".env"]) {
    if (!existsSync(path)) continue;
    const text = readFileSync(path, "utf8");
    const match = text.match(/FIREBASE_SERVICE_ACCOUNT_JSON=(.+)/);
    if (match) {
      const raw = match[1].trim().replace(/^['"]|['"]$/g, "");
      return JSON.parse(raw);
    }
  }
  throw new Error("Set FIREBASE_SERVICE_ACCOUNT_JSON or add it to .env");
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

const serviceAccount = loadServiceAccount();
initializeApp({ credential: cert(serviceAccount) });

const auth = getAuth();
const db = getFirestore();

const user = await auth.getUserByEmail(email);
const uid = user.uid;
const username = user.displayName ?? email.split("@")[0] ?? "Learner";

await db.collection("courseProgress").doc(uid).set(freshProgress(), { merge: false });

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
for (const doc of attempts.docs) batch.delete(doc.ref);
await batch.commit();

console.log(`Reset complete for ${email} (uid: ${uid}) — tokens set to ${STARTING_TOKENS}`);
