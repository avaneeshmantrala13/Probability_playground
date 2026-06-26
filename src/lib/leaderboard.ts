import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { CourseProgress } from "./progress";

export type LeaderboardSort = "tokens" | "streak" | "problems";

export interface LeaderboardEntry {
  uid: string;
  username: string;
  lifetimeTokens: number;
  streak: number;
  problemsCorrect: number;
}

function entryFromDoc(id: string, data: Record<string, unknown>): LeaderboardEntry {
  return {
    uid: (data.uid as string) ?? id,
    username: (data.username as string) ?? "Learner",
    lifetimeTokens: (data.lifetimeTokens as number) ?? 0,
    streak: (data.streak as number) ?? 0,
    problemsCorrect: (data.problemsCorrect as number) ?? 0,
  };
}

export function sortLeaderboard(
  entries: LeaderboardEntry[],
  sort: LeaderboardSort,
): LeaderboardEntry[] {
  const key: keyof LeaderboardEntry =
    sort === "tokens"
      ? "lifetimeTokens"
      : sort === "streak"
        ? "streak"
        : "problemsCorrect";
  return [...entries].sort((a, b) => {
    const diff = (b[key] as number) - (a[key] as number);
    if (diff !== 0) return diff;
    return a.username.localeCompare(b.username);
  });
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const snap = await getDocs(collection(db, "leaderboard"));
  return snap.docs.map((d) => entryFromDoc(d.id, d.data()));
}

/** Denormalized public stats for ranking — written by the owning user only. */
export async function syncLeaderboardEntry(
  uid: string,
  username: string,
  progress: CourseProgress,
): Promise<void> {
  await setDoc(
    doc(db, "leaderboard", uid),
    {
      uid,
      username,
      lifetimeTokens: progress.lifetimeTokens ?? 0,
      streak: progress.streak ?? 0,
      problemsCorrect: progress.problemsCorrect ?? 0,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export const SORT_LABELS: Record<LeaderboardSort, string> = {
  tokens: "Tokens earned",
  streak: "Login streak",
  problems: "Problems solved",
};

export function valueForSort(entry: LeaderboardEntry, sort: LeaderboardSort): number {
  if (sort === "tokens") return entry.lifetimeTokens;
  if (sort === "streak") return entry.streak;
  return entry.problemsCorrect;
}

export function formatSortValue(sort: LeaderboardSort, value: number): string {
  if (sort === "tokens") return value.toLocaleString();
  if (sort === "streak") return `${value} day${value === 1 ? "" : "s"}`;
  return value.toLocaleString();
}
