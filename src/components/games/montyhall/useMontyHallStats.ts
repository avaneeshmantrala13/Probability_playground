import { useCallback, useEffect, useState } from "react";
import type { Decision } from "./logic";

const STORAGE_KEY = "pp-montyhall-stats";

/** Win/loss tally for a single strategy. */
export interface StrategyRecord {
  wins: number;
  losses: number;
}

export interface MontyHallStats {
  switch: StrategyRecord;
  stay: StrategyRecord;
}

const EMPTY: MontyHallStats = {
  switch: { wins: 0, losses: 0 },
  stay: { wins: 0, losses: 0 },
};

function isRecord(value: unknown): value is StrategyRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as StrategyRecord).wins === "number" &&
    typeof (value as StrategyRecord).losses === "number"
  );
}

function readStats(): MontyHallStats {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<MontyHallStats>;
    if (isRecord(parsed.switch) && isRecord(parsed.stay)) {
      return { switch: parsed.switch, stay: parsed.stay };
    }
  } catch {
    // Corrupt or unavailable storage: fall back to a clean slate.
  }
  return EMPTY;
}

export interface MontyHallStatsApi {
  stats: MontyHallStats;
  /** Record the outcome of a played round. */
  record: (decision: Decision, won: boolean) => void;
  /** Clear all persisted session stats. */
  reset: () => void;
}

export function gamesPlayed(stats: MontyHallStats): number {
  return (
    stats.switch.wins +
    stats.switch.losses +
    stats.stay.wins +
    stats.stay.losses
  );
}

export function winRate(record: StrategyRecord): number {
  const total = record.wins + record.losses;
  return total > 0 ? record.wins / total : 0;
}

export function useMontyHallStats(): MontyHallStatsApi {
  const [stats, setStats] = useState<MontyHallStats>(readStats);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch {
      // Ignore storage failures (e.g. private mode / quota).
    }
  }, [stats]);

  const record = useCallback((decision: Decision, won: boolean) => {
    setStats((prev) => {
      const key = decision === "switch" ? "switch" : "stay";
      const current = prev[key];
      return {
        ...prev,
        [key]: {
          wins: current.wins + (won ? 1 : 0),
          losses: current.losses + (won ? 0 : 1),
        },
      };
    });
  }, []);

  const reset = useCallback(() => setStats(EMPTY), []);

  return { stats, record, reset };
}
