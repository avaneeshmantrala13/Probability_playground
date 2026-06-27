import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import type { MentalMathBestScores, MentalMathDifficulty } from "./mentalMath/types";

export type MentalMathLeaderboardSort = MentalMathDifficulty;

export interface MentalMathLeaderboardEntry {
  uid: string;
  username: string;
  bestEasy: number;
  bestMedium: number;
  bestHard: number;
}

function entryFromDoc(id: string, data: Record<string, unknown>): MentalMathLeaderboardEntry {
  return {
    uid: (data.uid as string) ?? id,
    username: (data.username as string) ?? "Learner",
    bestEasy: (data.bestEasy as number) ?? 0,
    bestMedium: (data.bestMedium as number) ?? 0,
    bestHard: (data.bestHard as number) ?? 0,
  };
}

export function sortMentalMathLeaderboard(
  entries: MentalMathLeaderboardEntry[],
  sort: MentalMathLeaderboardSort,
): MentalMathLeaderboardEntry[] {
  const key =
    sort === "easy" ? "bestEasy" : sort === "medium" ? "bestMedium" : "bestHard";
  return [...entries].sort((a, b) => {
    const diff = b[key] - a[key];
    if (diff !== 0) return diff;
    return a.username.localeCompare(b.username);
  });
}

export async function fetchMentalMathLeaderboard(): Promise<MentalMathLeaderboardEntry[]> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");

  const token = await user.getIdToken();
  const res = await fetch("/api/mental-math-leaderboard", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.ok) {
    const data = (await res.json()) as { entries?: MentalMathLeaderboardEntry[] };
    return data.entries ?? [];
  }

  if (res.status === 404) {
    const snap = await getDocs(collection(db, "mentalMathLeaderboard"));
    return snap.docs.map((d) => entryFromDoc(d.id, d.data()));
  }

  let message = "Could not load the mental math leaderboard.";
  try {
    const body = (await res.json()) as { error?: string };
    if (body.error) message = body.error;
  } catch {
    // ignore
  }
  throw new Error(message);
}

export async function syncMentalMathLeaderboardEntry(
  uid: string,
  username: string,
  scores: MentalMathBestScores,
): Promise<void> {
  await setDoc(
    doc(db, "mentalMathLeaderboard", uid),
    {
      uid,
      username,
      bestEasy: scores.easy,
      bestMedium: scores.medium,
      bestHard: scores.hard,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function valueForMentalMathSort(
  entry: MentalMathLeaderboardEntry,
  sort: MentalMathLeaderboardSort,
): number {
  if (sort === "easy") return entry.bestEasy;
  if (sort === "medium") return entry.bestMedium;
  return entry.bestHard;
}

export const MENTAL_MATH_SORT_LABELS: Record<MentalMathLeaderboardSort, string> = {
  easy: "Easy mode",
  medium: "Medium mode",
  hard: "Hard mode",
};
