import { useMemo } from "react";
import { ChevronRightIcon } from "../icons";
import {
  getDaySummary,
  monthGrid,
  monthLabel,
  WEEKDAY_LABELS,
  type StreakSnapshot,
  type ProgressWithStreak,
} from "../../lib/streak";
import { todayKey } from "../../lib/progress";
import { CalendarDay } from "./CalendarDay";

interface CalendarMonthProps {
  year: number;
  month: number;
  snapshot: StreakSnapshot;
  progress: ProgressWithStreak;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onMonthChange: (year: number, month: number) => void;
}

export function CalendarMonth({
  year,
  month,
  snapshot,
  progress,
  selectedDate,
  onSelectDate,
  onMonthChange,
}: CalendarMonthProps) {
  const today = todayKey();
  const rows = useMemo(() => monthGrid(year, month), [year, month]);

  const goPrev = () => {
    const d = new Date(year, month - 1, 1);
    onMonthChange(d.getFullYear(), d.getMonth());
  };

  const goNext = () => {
    const d = new Date(year, month + 1, 1);
    onMonthChange(d.getFullYear(), d.getMonth());
  };

  return (
    <div className="pp-card p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={goPrev}
          className="pp-btn-secondary !px-2.5 !py-2"
          aria-label="Previous month"
        >
          <ChevronRightIcon size={18} className="rotate-180" />
        </button>
        <h2 className="text-lg font-bold text-primary sm:text-xl">{monthLabel(year, month)}</h2>
        <button
          type="button"
          onClick={goNext}
          className="pp-btn-secondary !px-2.5 !py-2"
          aria-label="Next month"
        >
          <ChevronRightIcon size={18} />
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wide text-muted sm:gap-1.5 sm:text-sm">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {rows.flat().map((date, idx) => {
          if (!date) {
            return <div key={`pad-${idx}`} aria-hidden className="min-h-[3.25rem] sm:min-h-[4rem]" />;
          }
          const summary = getDaySummary(snapshot, progress, date);
          const dayOfMonth = Number(date.slice(8, 10));
          return (
            <CalendarDay
              key={date}
              date={date}
              dayOfMonth={dayOfMonth}
              summary={summary}
              selected={selectedDate === date}
              isToday={date === today}
              onSelect={onSelectDate}
            />
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-secondary sm:text-sm">
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 rounded-md border border-amber-400/60 bg-gradient-to-b from-amber-300/90 to-amber-500/80 dark:from-amber-400/30 dark:to-amber-600/25" />
          Active / streak day
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 rounded-md border border-subtle bg-surface-muted/60" />
          Inactive
        </span>
      </div>
    </div>
  );
}
