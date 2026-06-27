import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProgress } from "../context/ProgressContext";
import { BrainIcon, CrownIcon, FlameIcon, MedalIcon, TargetIcon } from "../components/icons";
import {
  fetchLeaderboard,
  formatSortValue,
  SORT_LABELS,
  sortLeaderboard,
  valueForSort,
  type LeaderboardEntry,
  type LeaderboardSort,
} from "../lib/leaderboard";
import {
  fetchMentalMathLeaderboard,
  MENTAL_MATH_SORT_LABELS,
  sortMentalMathLeaderboard,
  valueForMentalMathSort,
  type MentalMathLeaderboardEntry,
  type MentalMathLeaderboardSort,
} from "../lib/mentalMathLeaderboard";
import { emptyMentalMathScores } from "../lib/mentalMath/types";

type BoardMode = "overall" | "mental-math";

const OVERALL_SORT: { id: LeaderboardSort; icon: typeof CrownIcon }[] = [
  { id: "tokens", icon: CrownIcon },
  { id: "streak", icon: FlameIcon },
  { id: "problems", icon: TargetIcon },
];

const MATH_SORT: MentalMathLeaderboardSort[] = ["easy", "medium", "hard"];

function rankBadge(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return String(rank);
}

export function Leaderboard() {
  const { user } = useAuth();
  const { progress } = useProgress();
  const [searchParams, setSearchParams] = useSearchParams();

  const board: BoardMode =
    searchParams.get("board") === "mental-math" ? "mental-math" : "overall";

  const [overallSort, setOverallSort] = useState<LeaderboardSort>("tokens");
  const [mathSort, setMathSort] = useState<MentalMathLeaderboardSort>("easy");

  const [overallEntries, setOverallEntries] = useState<LeaderboardEntry[]>([]);
  const [mathEntries, setMathEntries] = useState<MentalMathLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([fetchLeaderboard(), fetchMentalMathLeaderboard()])
      .then(([overall, math]) => {
        if (!cancelled) {
          setOverallEntries(overall);
          setMathEntries(math);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load the leaderboard. Try again in a moment.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const rankedOverall = useMemo(
    () => sortLeaderboard(overallEntries, overallSort),
    [overallEntries, overallSort],
  );

  const rankedMath = useMemo(() => {
    const sorted = sortMentalMathLeaderboard(mathEntries, mathSort);
    return sorted.filter((e) => valueForMentalMathSort(e, mathSort) > 0);
  }, [mathEntries, mathSort]);

  const myOverallRank = useMemo(() => {
    if (!user) return null;
    const idx = rankedOverall.findIndex((e) => e.uid === user.uid);
    return idx >= 0 ? idx + 1 : null;
  }, [rankedOverall, user]);

  const myMathRank = useMemo(() => {
    if (!user) return null;
    const idx = rankedMath.findIndex((e) => e.uid === user.uid);
    return idx >= 0 ? idx + 1 : null;
  }, [rankedMath, user]);

  const myBest = progress.mentalMathBest ?? emptyMentalMathScores();

  const myOverallValue = useMemo(() => {
    if (overallSort === "tokens") return progress.lifetimeTokens ?? 0;
    if (overallSort === "streak") return progress.streak ?? 0;
    return progress.problemsCorrect ?? 0;
  }, [progress, overallSort]);

  function setBoard(next: BoardMode) {
    if (next === "mental-math") setSearchParams({ board: "mental-math" });
    else setSearchParams({});
  }

  const ranked = board === "overall" ? rankedOverall : rankedMath;
  const myRank = board === "overall" ? myOverallRank : myMathRank;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
          Leaderboard
        </h1>
        <p className="mt-2 max-w-xl text-secondary">
          {board === "overall"
            ? "Rankings across tokens earned, login streak, and problems solved."
            : "Best mental math scores in a 120-second drill — ranked separately by difficulty."}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setBoard("overall")}
            className={[
              "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
              board === "overall"
                ? "bg-accent text-accent-contrast shadow-sm"
                : "pp-card text-secondary hover:text-primary",
            ].join(" ")}
          >
            <MedalIcon size={16} />
            Overall
          </button>
          <button
            type="button"
            onClick={() => setBoard("mental-math")}
            className={[
              "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
              board === "mental-math"
                ? "bg-orange-500 text-white shadow-sm"
                : "pp-card text-secondary hover:text-primary",
            ].join(" ")}
          >
            <BrainIcon size={16} className={board === "mental-math" ? "" : "text-orange-500"} />
            Mental Math
          </button>
          {board === "mental-math" && (
            <Link
              to="/mental-math"
              className="inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-semibold text-accent hover:text-accent-hover"
            >
              Play drills →
            </Link>
          )}
        </div>

        {myRank != null && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="pp-card inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary">
              <MedalIcon size={16} className="text-accent" />
              Your rank: <span className="text-accent">#{myRank}</span>
            </span>
            {board === "overall" ? (
              <span className="pp-card inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary">
                {SORT_LABELS[overallSort]}:{" "}
                <span className="text-accent">
                  {formatSortValue(overallSort, myOverallValue)}
                </span>
              </span>
            ) : (
              <span className="pp-card inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary">
                {MENTAL_MATH_SORT_LABELS[mathSort]} best:{" "}
                <span className="text-accent">{myBest[mathSort] || 0}</span>
              </span>
            )}
          </div>
        )}
      </header>

      <div className="mb-5 flex flex-wrap gap-2">
        {board === "overall"
          ? OVERALL_SORT.map(({ id, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setOverallSort(id)}
                className={[
                  "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
                  overallSort === id
                    ? "bg-accent text-accent-contrast shadow-sm"
                    : "pp-card text-secondary hover:text-primary",
                ].join(" ")}
              >
                <Icon size={16} />
                {SORT_LABELS[id]}
              </button>
            ))
          : MATH_SORT.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setMathSort(id)}
                className={[
                  "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
                  mathSort === id
                    ? "bg-orange-500 text-white shadow-sm"
                    : "pp-card text-secondary hover:text-primary",
                ].join(" ")}
              >
                {MENTAL_MATH_SORT_LABELS[id]}
              </button>
            ))}
      </div>

      {loading ? (
        <p className="text-muted">Loading rankings…</p>
      ) : error ? (
        <div className="pp-card p-6 text-center">
          <p className="text-danger">{error}</p>
        </div>
      ) : ranked.length === 0 ? (
        <div className="pp-card p-8 text-center">
          <p className="text-secondary">
            {board === "overall"
              ? "No players on the board yet."
              : "No mental math scores yet. Be the first!"}
          </p>
        </div>
      ) : board === "overall" ? (
        <OverallTable ranked={rankedOverall} sort={overallSort} userUid={user?.uid} />
      ) : (
        <MathTable ranked={rankedMath} sort={mathSort} userUid={user?.uid} />
      )}
    </div>
  );
}

function OverallTable({
  ranked,
  sort,
  userUid,
}: {
  ranked: LeaderboardEntry[];
  sort: LeaderboardSort;
  userUid?: string;
}) {
  return (
    <div className="pp-card overflow-hidden">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-x-4 border-b border-subtle bg-surface-muted/60 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted sm:px-5">
        <span>Rank</span>
        <span>Player</span>
        <span className="text-right">{SORT_LABELS[sort]}</span>
      </div>
      <ol className="divide-y divide-subtle">
        {ranked.map((entry, index) => {
          const rank = index + 1;
          const isMe = userUid === entry.uid;
          return (
            <li
              key={entry.uid}
              className={[
                "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 px-4 py-3.5 sm:px-5",
                isMe ? "bg-accent/10 ring-1 ring-inset ring-accent/30" : "",
              ].join(" ")}
            >
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-sm font-bold">
                {rankBadge(rank)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-primary">
                  {entry.username}
                  {isMe && (
                    <span className="ml-2 text-xs font-medium text-accent">(you)</span>
                  )}
                </p>
              </div>
              <span className="text-right text-sm font-semibold tabular-nums text-primary">
                {formatSortValue(sort, valueForSort(entry, sort))}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function MathTable({
  ranked,
  sort,
  userUid,
}: {
  ranked: MentalMathLeaderboardEntry[];
  sort: MentalMathLeaderboardSort;
  userUid?: string;
}) {
  return (
    <div className="pp-card overflow-hidden">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-x-4 border-b border-subtle bg-surface-muted/60 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted sm:px-5">
        <span>Rank</span>
        <span>Player</span>
        <span className="text-right">{MENTAL_MATH_SORT_LABELS[sort]}</span>
      </div>
      <ol className="divide-y divide-subtle">
        {ranked.map((entry, index) => {
          const rank = index + 1;
          const isMe = userUid === entry.uid;
          const value = valueForMentalMathSort(entry, sort);
          return (
            <li
              key={entry.uid}
              className={[
                "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 px-4 py-3.5 sm:px-5",
                isMe ? "bg-orange-500/10 ring-1 ring-inset ring-orange-500/30" : "",
              ].join(" ")}
            >
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-sm font-bold">
                {rankBadge(rank)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-primary">
                  {entry.username}
                  {isMe && (
                    <span className="ml-2 text-xs font-medium text-orange-500">(you)</span>
                  )}
                </p>
              </div>
              <span className="text-right text-sm font-semibold tabular-nums text-primary">
                {value}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
