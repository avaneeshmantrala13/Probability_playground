import { useMemo, useState } from "react";
import { useProgress } from "../context/ProgressContext";
import { FlameIcon } from "../components/icons";
import { CalendarMonth } from "../components/calendar/CalendarMonth";
import { DayDetailPanel } from "../components/calendar/DayDetailPanel";
import {
  buildStreakSnapshot,
  getDaySummary,
  type ProgressWithStreak,
} from "../lib/streak";
import { todayKey } from "../lib/progress";

export function Calendar() {
  const { progress } = useProgress();
  const today = todayKey();
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(today);

  const streakProgress = progress as ProgressWithStreak;
  const snapshot = useMemo(() => buildStreakSnapshot(streakProgress), [streakProgress]);

  const selectedSummary = selectedDate
    ? getDaySummary(snapshot, streakProgress, selectedDate)
    : null;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
          Calendar
        </h1>
        <p className="mt-2 max-w-xl text-secondary">
          Track your daily login streak, see which days you were active, and review badges
          and tokens earned each day.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="pp-card inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary">
            <FlameIcon size={16} className="text-accent" />
            {snapshot.currentStreak}-day current streak
          </span>
          <span className="pp-card inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary">
            Longest:{" "}
            <span className="text-accent">{snapshot.longestStreak}</span> days
          </span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <CalendarMonth
          year={viewYear}
          month={viewMonth}
          snapshot={snapshot}
          progress={streakProgress}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onMonthChange={(y, m) => {
            setViewYear(y);
            setViewMonth(m);
          }}
        />
        <DayDetailPanel summary={selectedSummary} />
      </div>
    </div>
  );
}
