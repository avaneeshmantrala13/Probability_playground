import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useProgress } from "../../context/ProgressContext";
import { FinalReport } from "./FinalReport";
import { getSprint } from "../../lib/billing/plans";
import {
  collectMockTasks,
  computeSprintProgress,
  curriculumForState,
  deriveSprintState,
  isTaskComplete,
  isTaskTrackable,
  type SprintDay,
  type SprintPhase,
  type SprintProgressLike,
  type SprintState,
  type SprintTask,
} from "../../lib/sprints";
import type { CourseProgress } from "../../lib/progress";
import {
  BookIcon,
  BrainIcon,
  ChartIcon,
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  GraduationCapIcon,
  HeartIcon,
  RocketIcon,
  TargetIcon,
  ZapIcon,
} from "../../components/icons";

const PHASE_META: Record<SprintPhase, { label: string; accent: string }> = {
  fundamentals: { label: "Fundamentals", accent: "text-sky-500" },
  practice: { label: "Practice", accent: "text-indigo-500" },
  mocks: { label: "Mock Interviews", accent: "text-rose-500" },
  review: { label: "Final Review", accent: "text-amber-500" },
};

const PHASE_ORDER: SprintPhase[] = ["fundamentals", "practice", "mocks", "review"];

function taskIcon(kind: SprintTask["kind"]) {
  switch (kind) {
    case "lesson":
      return BookIcon;
    case "pokerTheory":
      return HeartIcon;
    case "marketMaking":
      return ChartIcon;
    case "practice":
      return ZapIcon;
    case "mentalMath":
      return BrainIcon;
    case "mockInterview":
      return GraduationCapIcon;
    case "readiness":
      return TargetIcon;
    case "review":
      return ClockIcon;
  }
}

function pad2(n: number): string {
  return String(Math.floor(n)).padStart(2, "0");
}

function Countdown({ msRemaining }: { msRemaining: number }) {
  const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const cell = (value: string, label: string) => (
    <div className="flex flex-col items-center">
      <span className="text-2xl font-extrabold tabular-nums text-primary sm:text-3xl">
        {value}
      </span>
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted">
        {label}
      </span>
    </div>
  );
  return (
    <div className="flex items-center gap-3 sm:gap-4">
      {cell(String(days), days === 1 ? "day" : "days")}
      <span className="text-xl font-bold text-muted">:</span>
      {cell(pad2(hours), "hrs")}
      <span className="text-xl font-bold text-muted">:</span>
      {cell(pad2(minutes), "min")}
      <span className="text-xl font-bold text-muted">:</span>
      {cell(pad2(seconds), "sec")}
    </div>
  );
}

function MeterBar({ percent, accent }: { percent: number; accent: string }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
      <div
        className={`h-full rounded-full ${accent} transition-all`}
        style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
      />
    </div>
  );
}

function TaskRow({
  task,
  progress,
}: {
  task: SprintTask;
  progress: CourseProgress;
}) {
  const Icon = taskIcon(task.kind);
  const trackable = isTaskTrackable(task);
  const done = trackable && isTaskComplete(task, progress);
  return (
    <Link
      to={task.route}
      className="group flex items-center gap-3 rounded-xl border border-subtle bg-surface px-4 py-3 transition-colors hover:border-accent/60"
    >
      <span
        className={[
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          done ? "bg-emerald-500/15 text-emerald-500" : "bg-surface-muted text-accent",
        ].join(" ")}
      >
        {done ? <CheckIcon size={18} /> : <Icon size={18} />}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={[
            "truncate text-sm font-semibold",
            done ? "text-muted line-through" : "text-primary",
          ].join(" ")}
        >
          {task.label}
        </p>
        {task.detail && (
          <p className="truncate text-xs text-secondary">{task.detail}</p>
        )}
      </div>
      <span className="shrink-0 text-xs font-medium tabular-nums text-muted">
        {task.estMinutes}m
      </span>
      <ChevronRightIcon
        size={16}
        className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}

function PhaseTimeline({
  state,
  ranges,
}: {
  state: SprintState;
  ranges: Record<SprintPhase, { startDay: number; endDay: number }>;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {PHASE_ORDER.map((phase) => {
        const range = ranges[phase];
        const meta = PHASE_META[phase];
        const isCurrent =
          !state.isComplete &&
          state.currentDay >= range.startDay &&
          state.currentDay <= range.endDay;
        const isPast = state.isComplete || state.currentDay > range.endDay;
        return (
          <div
            key={phase}
            className={[
              "rounded-xl border px-3 py-2.5",
              isCurrent
                ? "border-accent/60 bg-accent/5"
                : "border-subtle bg-surface",
            ].join(" ")}
          >
            <div className="flex items-center justify-between gap-1">
              <span className={`text-xs font-bold ${meta.accent}`}>
                {meta.label}
              </span>
              {isPast && <CheckIcon size={14} className="text-emerald-500" />}
            </div>
            <p className="mt-1 text-[11px] text-muted">
              {range.startDay === range.endDay
                ? `Day ${range.startDay}`
                : `Days ${range.startDay}–${range.endDay}`}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function DaySchedule({
  day,
  progress,
}: {
  day: SprintDay;
  progress: CourseProgress;
}) {
  return (
    <div className="space-y-2">
      {day.tasks.map((task) => (
        <TaskRow key={task.id} task={task} progress={progress} />
      ))}
    </div>
  );
}

function NoSprint() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="pp-card p-8 text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
          <RocketIcon size={24} />
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight text-primary">
          Start an Interview Sprint
        </h1>
        <p className="mx-auto mt-2 max-w-md text-secondary">
          A guided, day-by-day program that ramps you from fundamentals to mock
          interviews and ends with an honest readiness report — timed to peak
          right when you interview.
        </p>
        <p className="mx-auto mt-4 max-w-md rounded-xl bg-surface-muted px-4 py-3 text-xs leading-relaxed text-secondary">
          Sprints are a <span className="font-semibold">one-time purchase</span> —
          no subscription, no auto-renew. You get full Interview Prep access for
          the length of your sprint, and that&apos;s it.
        </p>
        <Link to="/pricing" className="pp-btn-primary mt-6 inline-flex">
          See sprint options
        </Link>
      </div>
    </div>
  );
}

export function SprintDashboard() {
  const { progress } = useProgress();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const planLike = progress as unknown as SprintProgressLike;

  const state = useMemo(() => deriveSprintState(planLike, now), [planLike, now]);

  // Build the curriculum only when length/firm change, not every tick.
  const curriculum = useMemo(
    () => (state ? curriculumForState(state) : null),
    [state?.length, state?.firmId], // eslint-disable-line react-hooks/exhaustive-deps
  );

  if (!state || !curriculum) {
    return <NoSprint />;
  }

  const sprintProduct = getSprint(state.sprintId);
  const summary = computeSprintProgress(curriculum, progress);
  const today = curriculum.days[state.currentDay - 1];
  const timePercent = Math.round(
    Math.min(100, Math.max(0, ((state.currentDay - 1) / state.totalDays) * 100)),
  );
  const mocks = collectMockTasks(curriculum);
  const upcomingMocks = mocks.filter((m) =>
    state.isComplete ? false : m.day >= state.currentDay,
  );
  const showPreview = !state.isComplete && today?.phase === "review";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-accent">
            <RocketIcon size={14} />
            {sprintProduct?.name ?? "Interview Sprint"}
          </span>
          {curriculum.firmName && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-secondary">
              <TargetIcon size={14} />
              {curriculum.firmName}
            </span>
          )}
          <span className="inline-flex items-center rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-muted">
            One-time purchase · no auto-renew
          </span>
        </div>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
          {state.isComplete
            ? "Sprint complete"
            : `Day ${state.currentDay} of ${state.totalDays}`}
        </h1>
        <p className="mt-1 text-secondary">
          {state.isComplete
            ? "Your access window has ended. Here's how far you came."
            : today
              ? `${PHASE_META[today.phase].label} · ${today.focus}`
              : "Your guided interview-prep program."}
        </p>
        {state.inferred && (
          <p className="mt-2 text-xs italic text-muted">
            Schedule inferred from your remaining access. Exact day tracking
            activates once your purchase details sync.
          </p>
        )}
      </header>

      {/* Countdown + progress */}
      {!state.isComplete && (
        <div className="pp-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                <ClockIcon size={12} className="mr-1 inline" />
                Access remaining
              </p>
              <div className="mt-2">
                <Countdown msRemaining={Math.max(0, state.expiresAt - now)} />
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-semibold text-secondary">Program timeline</span>
                <span className="text-muted">{timePercent}%</span>
              </div>
              <MeterBar percent={timePercent} accent="bg-accent" />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-semibold text-secondary">Lessons mastered</span>
                <span className="text-muted">
                  {summary.completedTrackable}/{summary.totalTrackable}
                </span>
              </div>
              <MeterBar percent={summary.percent} accent="bg-emerald-500" />
            </div>
          </div>
        </div>
      )}

      {/* Phase timeline */}
      <PhaseTimeline state={state} ranges={curriculum.phaseRanges} />

      {/* Today's plan */}
      {!state.isComplete && today && (
        <section className="pp-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-primary">Today&apos;s plan</h2>
              <p className="text-xs text-secondary">
                {PHASE_META[today.phase].label} · about{" "}
                {today.tasks.reduce((s, t) => s + t.estMinutes, 0)} minutes
              </p>
            </div>
            <span className={`text-xs font-bold ${PHASE_META[today.phase].accent}`}>
              Day {today.day}
            </span>
          </div>
          <DaySchedule day={today} progress={progress} />
        </section>
      )}

      {/* Scheduled mock interviews */}
      {!state.isComplete && upcomingMocks.length > 0 && (
        <section className="pp-card p-5">
          <h2 className="text-lg font-bold text-primary">Scheduled mock interviews</h2>
          <p className="mt-1 text-xs text-secondary">
            Rehearse the real thing — questions change every session.
          </p>
          <div className="mt-4 space-y-2">
            {upcomingMocks.map(({ day, task }) => (
              <Link
                key={`${day}-${task.id}`}
                to={task.route}
                className="group flex items-center gap-3 rounded-xl border border-subtle bg-surface px-4 py-3 transition-colors hover:border-accent/60"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
                  <GraduationCapIcon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-primary">
                    {task.label}
                  </p>
                  <p className="text-xs text-secondary">
                    {day === state.currentDay ? "Scheduled today" : `Scheduled day ${day}`}
                  </p>
                </div>
                <ChevronRightIcon
                  size={16}
                  className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Final readiness report (full once complete, preview during review) */}
      {(state.isComplete || showPreview) && (
        <FinalReport
          progress={progress}
          firmId={state.firmId}
          preview={!state.isComplete}
        />
      )}

      {/* Full schedule */}
      <FullSchedule
        days={curriculum.days}
        currentDay={state.currentDay}
        isComplete={state.isComplete}
        progress={progress}
      />
    </div>
  );
}

function FullSchedule({
  days,
  currentDay,
  isComplete,
  progress,
}: {
  days: SprintDay[];
  currentDay: number;
  isComplete: boolean;
  progress: CourseProgress;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className="pp-card p-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <h2 className="text-lg font-bold text-primary">Full {days.length}-day program</h2>
          <p className="text-xs text-secondary">
            The complete day-by-day plan from fundamentals to final review.
          </p>
        </div>
        <ChevronRightIcon
          size={18}
          className={`text-muted transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {days.map((day) => {
            const isToday = !isComplete && day.day === currentDay;
            return (
              <div
                key={day.day}
                className={[
                  "rounded-xl border p-4",
                  isToday ? "border-accent/60 bg-accent/5" : "border-subtle",
                ].join(" ")}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-primary">
                    Day {day.day} · {day.focus}
                  </span>
                  <span className={`text-xs font-semibold ${PHASE_META[day.phase].accent}`}>
                    {PHASE_META[day.phase].label}
                  </span>
                </div>
                <DaySchedule day={day} progress={progress} />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
