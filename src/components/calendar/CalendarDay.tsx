import { badgeById } from "../../lib/streak";
import type { DaySummary } from "../../lib/streak";

interface CalendarDayProps {
  date: string;
  dayOfMonth: number;
  summary: DaySummary;
  selected: boolean;
  isToday: boolean;
  onSelect: (date: string) => void;
}

export function CalendarDay({
  date,
  dayOfMonth,
  summary,
  selected,
  isToday,
  onSelect,
}: CalendarDayProps) {
  const badges = summary.badgeIds
    .map((id) => badgeById(id))
    .filter((b): b is NonNullable<typeof b> => b != null)
    .slice(0, 3);

  return (
    <button
      type="button"
      onClick={() => onSelect(date)}
      aria-label={`${date}${summary.active ? ", active" : ", inactive"}${
        badges.length ? `, ${badges.length} badge${badges.length > 1 ? "s" : ""}` : ""
      }`}
      aria-pressed={selected}
      className={[
        "group relative flex min-h-[3.25rem] flex-col items-center justify-start rounded-xl border px-1 py-1.5 text-sm transition sm:min-h-[4rem] sm:py-2",
        summary.active
          ? "border-amber-400/60 bg-gradient-to-b from-amber-300/90 to-amber-500/80 text-amber-950 shadow-sm dark:from-amber-400/30 dark:to-amber-600/25 dark:text-amber-100"
          : "border-subtle bg-surface-muted/60 text-muted",
        selected ? "ring-2 ring-accent ring-offset-2 ring-offset-bg" : "hover:brightness-105",
        isToday && !selected ? "outline outline-2 outline-accent/40 outline-offset-[-2px]" : "",
      ].join(" ")}
    >
      <span
        className={[
          "font-semibold leading-none",
          summary.active ? "text-amber-950 dark:text-amber-50" : "",
        ].join(" ")}
      >
        {dayOfMonth}
      </span>

      {badges.length > 0 && (
        <span className="mt-1 flex items-center justify-center gap-0.5">
          {badges.map((badge) => {
            const Icon = badge.icon;
            const [, to] = badge.gradient;
            return (
              <span
                key={badge.id}
                className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/80 shadow-sm dark:bg-black/30"
                title={badge.title}
              >
                <Icon size={10} style={{ color: to }} />
              </span>
            );
          })}
          {summary.badgeIds.length > 3 && (
            <span className="text-[9px] font-bold text-amber-900/80 dark:text-amber-100/80">
              +{summary.badgeIds.length - 3}
            </span>
          )}
        </span>
      )}
    </button>
  );
}
