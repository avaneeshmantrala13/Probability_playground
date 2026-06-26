import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useProgress } from "../context/ProgressContext";
import { CrownIcon, FlameIcon, MedalIcon, TargetIcon } from "../components/icons";
import {
  fetchLeaderboard,
  formatSortValue,
  SORT_LABELS,
  sortLeaderboard,
  valueForSort,
  type LeaderboardEntry,
  type LeaderboardSort,
} from "../lib/leaderboard";

const SORT_OPTIONS: { id: LeaderboardSort; icon: typeof CrownIcon }[] = [
  { id: "tokens", icon: CrownIcon },
  { id: "streak", icon: FlameIcon },
  { id: "problems", icon: TargetIcon },
];

function rankBadge(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return String(rank);
}

export function Leaderboard() {
  const { user } = useAuth();
  const { progress } = useProgress();
  const [sort, setSort] = useState<LeaderboardSort>("tokens");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchLeaderboard()
      .then((rows) => {
        if (!cancelled) setEntries(rows);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load the leaderboard. Try again in a moment.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const ranked = useMemo(() => sortLeaderboard(entries, sort), [entries, sort]);

  const myRank = useMemo(() => {
    if (!user) return null;
    const idx = ranked.findIndex((e) => e.uid === user.uid);
    return idx >= 0 ? idx + 1 : null;
  }, [ranked, user]);

  const myValue = useMemo(() => {
    if (sort === "tokens") return progress.lifetimeTokens ?? 0;
    if (sort === "streak") return progress.streak ?? 0;
    return progress.problemsCorrect ?? 0;
  }, [progress, sort]);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
          Leaderboard
        </h1>
        <p className="mt-2 max-w-xl text-secondary">
          See how you stack up against other players. Rankings update as you earn
          tokens, keep your streak alive, and solve problems across the site.
        </p>
        {myRank != null && (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="pp-card inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary">
              <MedalIcon size={16} className="text-accent" />
              Your rank: <span className="text-accent">#{myRank}</span>
            </span>
            <span className="pp-card inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary">
              {SORT_LABELS[sort]}:{" "}
              <span className="text-accent">{formatSortValue(sort, myValue)}</span>
            </span>
          </div>
        )}
      </header>

      <div className="mb-5 flex flex-wrap gap-2">
        {SORT_OPTIONS.map(({ id, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSort(id)}
            className={[
              "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
              sort === id
                ? "bg-accent text-accent-contrast shadow-sm"
                : "pp-card text-secondary hover:text-primary",
            ].join(" ")}
          >
            <Icon size={16} />
            {SORT_LABELS[id]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted">Loading rankings…</p>
      ) : error ? (
        <p className="text-danger">{error}</p>
      ) : ranked.length === 0 ? (
        <div className="pp-card p-8 text-center">
          <p className="text-secondary">
            No players on the board yet. Play a lesson or poker hand to appear here.
          </p>
        </div>
      ) : (
        <div className="pp-card overflow-hidden">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-x-4 border-b border-subtle bg-surface-muted/60 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted sm:px-5">
            <span>Rank</span>
            <span>Player</span>
            <span className="text-right">{SORT_LABELS[sort]}</span>
          </div>
          <ol className="divide-y divide-subtle">
            {ranked.map((entry, index) => {
              const rank = index + 1;
              const isMe = user?.uid === entry.uid;
              return (
                <li
                  key={entry.uid}
                  className={[
                    "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 px-4 py-3.5 sm:px-5",
                    isMe ? "bg-accent/10 ring-1 ring-inset ring-accent/30" : "",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "inline-flex h-8 w-8 shrink-0 items-center justify-center text-sm font-bold",
                      rank <= 3 ? "text-lg" : "text-secondary",
                    ].join(" ")}
                    aria-label={`Rank ${rank}`}
                  >
                    {rankBadge(rank)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-primary">
                      {entry.username}
                      {isMe && (
                        <span className="ml-2 text-xs font-medium text-accent">(you)</span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-muted sm:hidden">
                      {formatSortValue(sort, valueForSort(entry, sort))}
                    </p>
                  </div>
                  <span className="hidden text-right text-sm font-semibold tabular-nums text-primary sm:block">
                    {formatSortValue(sort, valueForSort(entry, sort))}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
