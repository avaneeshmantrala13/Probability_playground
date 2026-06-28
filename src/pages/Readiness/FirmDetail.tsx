import { Link } from "react-router-dom";
import type { CourseProgress } from "../../lib/progress";
import {
  computeFirmReadiness,
  getImprovementSuggestions,
} from "../../lib/readiness";

/** Tailwind text/bar color reflecting a 0–100 score band. */
function scoreTone(score: number): { text: string; bar: string } {
  if (score >= 70) return { text: "text-emerald-500", bar: "bg-emerald-500" };
  if (score >= 40) return { text: "text-amber-500", bar: "bg-amber-500" };
  return { text: "text-rose-500", bar: "bg-rose-500" };
}

function Bar({ value, measured }: { value: number; measured: boolean }) {
  if (!measured) {
    return (
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
        <div className="h-full w-full bg-[repeating-linear-gradient(45deg,rgb(var(--color-surface-muted)),rgb(var(--color-surface-muted))_6px,rgb(var(--color-text-muted)/0.25)_6px,rgb(var(--color-text-muted)/0.25)_12px)]" />
      </div>
    );
  }
  const tone = scoreTone(value);
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
      <div
        className={`h-full rounded-full ${tone.bar} transition-all`}
        style={{ width: `${Math.max(value, 2)}%` }}
      />
    </div>
  );
}

export function FirmDetail({
  progress,
  firmId,
  onBack,
}: {
  progress: CourseProgress;
  firmId: string;
  onBack?: () => void;
}) {
  const readiness = computeFirmReadiness(progress, firmId);
  if (!readiness) {
    return (
      <div className="pp-card p-6">
        <p className="text-secondary">Unknown firm.</p>
        {onBack && (
          <button onClick={onBack} className="pp-btn-secondary mt-4">
            Back
          </button>
        )}
      </div>
    );
  }

  const suggestions = getImprovementSuggestions(progress, firmId, 3);
  const tone = scoreTone(readiness.overall);

  return (
    <div className="mx-auto max-w-3xl">
      {onBack && (
        <button
          onClick={onBack}
          className="mb-4 inline-flex items-center text-sm font-semibold text-accent hover:text-accent-hover"
        >
          ← All firms
        </button>
      )}

      {/* Headline */}
      <div className="pp-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight text-primary">
              {readiness.firmName}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-secondary">
              {readiness.blurb}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-4xl font-extrabold tabular-nums ${tone.text}`}>
              {readiness.overall}%
            </p>
            <p className="text-xs font-medium text-muted">est. readiness</p>
          </div>
        </div>

        <div className="mt-5">
          <Bar value={readiness.overall} measured={readiness.measuredCount > 0} />
        </div>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
          <span>
            <span className="font-semibold text-secondary">
              {readiness.coverage}%
            </span>{" "}
            of this firm&apos;s profile measured so far
          </span>
          <span>
            <span className="font-semibold text-secondary">
              {readiness.measuredCount}/{readiness.totalCount}
            </span>{" "}
            competencies demonstrated
          </span>
        </div>

        <p className="mt-4 rounded-xl bg-surface-muted px-4 py-3 text-xs leading-relaxed text-secondary">
          This is an <span className="font-semibold">estimate of demonstrated
          skill</span> — a weighted average of your in-app scores using{" "}
          {readiness.firmName}&apos;s publicly-known emphasis. It is{" "}
          <span className="font-semibold">not</span> a hiring probability or a
          trained predictor. Unmeasured skills are excluded from the average, not
          scored as zero.
        </p>

        {readiness.minBarHint && (
          <p className="mt-3 text-xs italic text-muted">{readiness.minBarHint}</p>
        )}
      </div>

      {/* Breakdown table */}
      <div className="pp-card mt-6 overflow-hidden">
        <div className="border-b border-subtle px-5 py-4">
          <h2 className="text-lg font-bold text-primary">Competency breakdown</h2>
          <p className="mt-1 text-xs text-secondary">
            How each skill is weighted by {readiness.firmName} and what you&apos;ve
            demonstrated.
          </p>
        </div>
        <div className="divide-y divide-subtle">
          {readiness.breakdown.map((row) => {
            const rowTone = scoreTone(row.score);
            return (
              <div
                key={row.competency}
                className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-5 py-3.5 sm:grid-cols-[1.4fr_3rem_1fr_3.5rem]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-primary">
                    {row.label}
                  </p>
                  {!row.measured && (
                    <p className="text-xs text-muted">not yet measured</p>
                  )}
                </div>

                <div className="hidden text-right text-xs font-medium text-muted sm:block">
                  wt {Math.round(row.weight * 100)}%
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <Bar value={row.score} measured={row.measured} />
                </div>

                <div className="text-right text-sm font-bold tabular-nums">
                  {row.measured ? (
                    <span className={rowTone.text}>{row.score}</span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* What to improve next */}
      {suggestions.length > 0 && (
        <div className="pp-card mt-6 p-5">
          <h2 className="text-lg font-bold text-primary">What to improve next</h2>
          <p className="mt-1 text-xs text-secondary">
            Highest-impact moves to raise your {readiness.firmName} readiness.
          </p>
          <div className="mt-4 space-y-3">
            {suggestions.map((s) => (
              <div
                key={s.competency}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-subtle bg-surface-muted px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-primary">{s.label}</p>
                  <p className="text-xs text-secondary">{s.reason}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="whitespace-nowrap text-xs font-medium text-accent">
                    +{s.potentialGain} pts
                  </span>
                  {s.route ? (
                    <Link to={s.route} className="pp-btn-primary px-3 py-1.5 text-xs">
                      {s.actionLabel}
                    </Link>
                  ) : (
                    <span className="whitespace-nowrap rounded-lg bg-surface px-3 py-1.5 text-xs text-muted">
                      {s.actionLabel}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
