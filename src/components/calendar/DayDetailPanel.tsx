import { FlameIcon, TrophyIcon } from "../icons";
import { badgeById } from "../../lib/streak";
import type { DaySummary } from "../../lib/streak";
import { TokenIcon } from "../store/TokenIcon";

interface DayDetailPanelProps {
  summary: DaySummary | null;
}

function formatDisplayDate(date: string): string {
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function DayDetailPanel({ summary }: DayDetailPanelProps) {
  if (!summary) {
    return (
      <div className="pp-card flex min-h-[12rem] flex-col items-center justify-center p-6 text-center">
        <TrophyIcon size={28} className="mb-3 text-muted" />
        <p className="text-sm text-secondary">Select a day to see activity details.</p>
      </div>
    );
  }

  const badges = summary.badgeIds
    .map((id) => badgeById(id))
    .filter((b): b is NonNullable<typeof b> => b != null);

  const netTokens = summary.tokensEarned - summary.tokensLost;

  return (
    <div className="pp-card p-5 sm:p-6">
      <header className="mb-5 border-b border-subtle pb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Day details</p>
        <h2 className="mt-1 text-lg font-bold text-primary sm:text-xl">
          {formatDisplayDate(summary.date)}
        </h2>
        <p className="mt-1 text-sm text-secondary">
          {summary.active ? "You logged in this day." : "No login recorded."}
        </p>
      </header>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-surface-muted/60 px-4 py-3">
          <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
            <FlameIcon size={14} className="text-accent" />
            Streak that day
          </dt>
          <dd className="mt-1 text-2xl font-bold text-accent">
            {summary.streakOnDay}
            <span className="ml-1 text-sm font-medium text-secondary">days</span>
          </dd>
        </div>
        <div className="rounded-xl bg-surface-muted/60 px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
            Longest streak (through this day)
          </dt>
          <dd className="mt-1 text-2xl font-bold text-primary">
            {summary.longestStreakThroughDay}
            <span className="ml-1 text-sm font-medium text-secondary">days</span>
          </dd>
        </div>
      </dl>

      <section className="mt-5">
        <h3 className="mb-2 text-sm font-semibold text-primary">Badges earned</h3>
        {badges.length === 0 ? (
          <p className="text-sm text-secondary">No badges recorded for this day.</p>
        ) : (
          <ul className="space-y-2">
            {badges.map((badge) => {
              const Icon = badge.icon;
              const [from, to] = badge.gradient;
              return (
                <li
                  key={badge.id}
                  className="flex items-center gap-3 rounded-xl border border-subtle bg-surface-muted/40 px-3 py-2.5"
                >
                  <span
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
                    style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
                  >
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-primary">{badge.title}</p>
                    <p className="text-xs text-secondary">{badge.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-5">
        <h3 className="mb-2 text-sm font-semibold text-primary">Tokens</h3>
        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-surface-muted/60 px-3 py-2 text-sm font-semibold text-primary">
            <TokenIcon size={16} />
            +{summary.tokensEarned} earned
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-surface-muted/60 px-3 py-2 text-sm font-semibold text-primary">
            <TokenIcon size={16} />
            −{summary.tokensLost} lost
          </span>
          <span
            className={[
              "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold",
              netTokens >= 0 ? "text-success" : "text-danger",
            ].join(" ")}
          >
            Net {netTokens >= 0 ? "+" : ""}
            {netTokens}
          </span>
        </div>
      </section>
    </div>
  );
}
