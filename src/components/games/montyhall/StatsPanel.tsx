import {
  gamesPlayed,
  winRate,
  type MontyHallStats,
  type StrategyRecord,
} from "./useMontyHallStats";

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function StrategyCard({
  title,
  record,
}: {
  title: string;
  record: StrategyRecord;
}) {
  const total = record.wins + record.losses;
  return (
    <div className="rounded-xl border border-subtle bg-surface-muted p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-primary">{title}</span>
        <span className="text-lg font-bold tabular-nums text-accent">
          {total > 0 ? pct(winRate(record)) : "—"}
        </span>
      </div>
      <div className="mt-1 text-xs text-secondary">
        {record.wins} won · {record.losses} lost
        {total > 0 ? ` · ${total} games` : ""}
      </div>
    </div>
  );
}

export function StatsPanel({
  stats,
  onReset,
}: {
  stats: MontyHallStats;
  onReset: () => void;
}) {
  const total = gamesPlayed(stats);

  return (
    <section className="pp-card p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-primary">
          Your session
          <span className="ml-2 text-sm font-normal text-secondary">
            {total} {total === 1 ? "game" : "games"} played
          </span>
        </h2>
        <button
          type="button"
          className="pp-btn-secondary px-3 py-1.5 text-xs"
          onClick={onReset}
          disabled={total === 0}
        >
          Reset
        </button>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <StrategyCard title="When you switched" record={stats.switch} />
        <StrategyCard title="When you stayed" record={stats.stay} />
      </div>
    </section>
  );
}
