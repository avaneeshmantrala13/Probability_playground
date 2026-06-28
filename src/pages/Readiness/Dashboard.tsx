import { useMemo, useState } from "react";
import { useProgress } from "../../context/ProgressContext";
import {
  computeAllFirmReadiness,
  computeCompetencyScores,
  type FirmReadiness,
} from "../../lib/readiness";
import { FirmDetail } from "./FirmDetail";

function scoreTone(score: number): { text: string; bar: string } {
  if (score >= 70) return { text: "text-emerald-500", bar: "bg-emerald-500" };
  if (score >= 40) return { text: "text-amber-500", bar: "bg-amber-500" };
  return { text: "text-rose-500", bar: "bg-rose-500" };
}

function ReadinessBar({ value, measured }: { value: number; measured: boolean }) {
  if (!measured) {
    return (
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
        <div className="h-full w-full bg-[repeating-linear-gradient(45deg,rgb(var(--color-surface-muted)),rgb(var(--color-surface-muted))_6px,rgb(var(--color-text-muted)/0.25)_6px,rgb(var(--color-text-muted)/0.25)_12px)]" />
      </div>
    );
  }
  const tone = scoreTone(value);
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
      <div
        className={`h-full rounded-full ${tone.bar} transition-all`}
        style={{ width: `${Math.max(value, 2)}%` }}
      />
    </div>
  );
}

function FirmCard({
  firm,
  onSelect,
}: {
  firm: FirmReadiness;
  onSelect: () => void;
}) {
  const tone = scoreTone(firm.overall);
  const hasData = firm.measuredCount > 0;
  // Top three competencies by the firm's emphasis weight.
  const topComps = firm.breakdown.slice(0, 3);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="pp-card group flex flex-col p-5 text-left transition-transform hover:-translate-y-0.5 hover:border-accent/60"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-bold text-primary">{firm.firmName}</h2>
        <div className="text-right">
          <p className={`text-2xl font-extrabold tabular-nums ${tone.text}`}>
            {hasData ? `${firm.overall}%` : "—"}
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
            est. readiness
          </p>
        </div>
      </div>

      <div className="mt-3">
        <ReadinessBar value={firm.overall} measured={hasData} />
      </div>

      <p className="mt-3 line-clamp-2 text-xs text-secondary">{firm.emphasis}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {topComps.map((c) => (
          <span
            key={c.competency}
            className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-secondary"
          >
            {c.label}
            <span className={c.measured ? scoreTone(c.score).text : "text-muted"}>
              {c.measured ? c.score : "·"}
            </span>
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-subtle pt-3 text-xs">
        <span className="text-muted">
          <span className="font-semibold text-secondary">{firm.coverage}%</span>{" "}
          of profile measured
        </span>
        <span className="font-semibold text-accent group-hover:underline">
          Details →
        </span>
      </div>
    </button>
  );
}

export function Readiness() {
  const { progress } = useProgress();
  const [selectedFirmId, setSelectedFirmId] = useState<string | null>(null);

  const firms = useMemo(() => computeAllFirmReadiness(progress), [progress]);
  const competencies = useMemo(
    () => computeCompetencyScores(progress),
    [progress],
  );

  const measuredCount = competencies.filter((c) => c.measured).length;
  const hasAnyData = measuredCount > 0;

  if (selectedFirmId) {
    return (
      <FirmDetail
        progress={progress}
        firmId={selectedFirmId}
        onBack={() => setSelectedFirmId(null)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
          Firm Readiness
        </h1>
        <p className="mt-2 max-w-2xl text-secondary">
          A transparent, honest estimate of how prepared you are for each quant
          firm&apos;s trader interview, based on the skills you&apos;ve actually
          demonstrated in this app.
        </p>
        <p className="mt-3 max-w-2xl rounded-xl bg-surface-muted px-4 py-3 text-xs leading-relaxed text-secondary">
          Each percentage is a weighted average of your demonstrated competency
          scores, using each firm&apos;s publicly-known emphasis. It is{" "}
          <span className="font-semibold">not</span> a hiring probability and{" "}
          <span className="font-semibold">not</span> a trained ML predictor —
          just a rubric you can fully inspect. Skills you haven&apos;t practiced
          yet are excluded from the average (and flagged), never scored as zero.
        </p>
      </header>

      {!hasAnyData && (
        <div className="pp-card mb-6 p-6 text-center">
          <h2 className="text-lg font-bold text-primary">No data yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-secondary">
            Complete some lessons or mental-math drills and your readiness across
            firms will appear here. Until then, every firm&apos;s profile is fully
            unmeasured.
          </p>
        </div>
      )}

      {/* Your measured skills snapshot */}
      <section className="pp-card mb-6 p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
            Your demonstrated skills
          </h2>
          <span className="text-xs text-muted">
            {measuredCount}/{competencies.length} measured
          </span>
        </div>
        <div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {competencies.map((c) => (
            <div key={c.competency} className="flex items-center gap-3">
              <span className="w-32 shrink-0 truncate text-xs font-medium text-secondary">
                {c.label}
              </span>
              <div className="flex-1">
                <ReadinessBar value={c.score} measured={c.measured} />
              </div>
              <span
                className={`w-8 shrink-0 text-right text-xs font-bold tabular-nums ${
                  c.measured ? scoreTone(c.score).text : "text-muted"
                }`}
              >
                {c.measured ? c.score : "—"}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Firm grid, best-fit first */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {firms.map((firm) => (
          <FirmCard
            key={firm.firmId}
            firm={firm}
            onSelect={() => setSelectedFirmId(firm.firmId)}
          />
        ))}
      </div>
    </div>
  );
}
