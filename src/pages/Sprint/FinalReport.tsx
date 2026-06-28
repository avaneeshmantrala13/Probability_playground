import { Link } from "react-router-dom";
import type { CourseProgress } from "../../lib/progress";
import {
  computeAllFirmReadiness,
  computeFirmReadiness,
  getImprovementSuggestions,
  type FirmReadiness,
} from "../../lib/readiness";
import { FlagIcon } from "../../components/icons";

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

function FirmRow({ firm }: { firm: FirmReadiness }) {
  const measured = firm.measuredCount > 0;
  const tone = scoreTone(firm.overall);
  return (
    <div className="flex items-center gap-3">
      <span className="w-40 shrink-0 truncate text-sm font-medium text-secondary">
        {firm.firmName}
      </span>
      <div className="flex-1">
        <Bar value={firm.overall} measured={measured} />
      </div>
      <span
        className={`w-10 shrink-0 text-right text-sm font-bold tabular-nums ${
          measured ? tone.text : "text-muted"
        }`}
      >
        {measured ? `${firm.overall}` : "—"}
      </span>
    </div>
  );
}

/**
 * The end-of-sprint deliverable: an honest readiness snapshot built entirely
 * from the user's demonstrated in-app skill, plus the highest-impact things to
 * fix. Shown once the sprint window has elapsed (and as a preview near the end).
 */
export function FinalReport({
  progress,
  firmId,
  preview = false,
}: {
  progress: CourseProgress;
  firmId?: string;
  preview?: boolean;
}) {
  const allFirms = computeAllFirmReadiness(progress);
  const targetFirm = firmId ? computeFirmReadiness(progress, firmId) : null;
  // Anchor "what to improve" on the target firm, else the best-fit firm.
  const focusFirmId = firmId ?? allFirms[0]?.firmId;
  const suggestions = focusFirmId
    ? getImprovementSuggestions(progress, focusFirmId, 3)
    : [];
  const headlineFirm = targetFirm ?? allFirms[0] ?? null;
  const tone = headlineFirm ? scoreTone(headlineFirm.overall) : scoreTone(0);
  const topFirms = allFirms.slice(0, 5);

  return (
    <section className="space-y-6">
      <div className="pp-card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-subtle bg-gradient-to-br from-accent/10 to-transparent px-6 py-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <FlagIcon size={20} />
          </span>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-primary">
              {preview ? "Readiness report preview" : "Your final readiness report"}
            </h2>
            <p className="text-sm text-secondary">
              {preview
                ? "A live look at where you stand — it updates as you finish your last drills."
                : "Built from the skills you demonstrated during your sprint."}
            </p>
          </div>
        </div>

        <div className="p-6">
          {headlineFirm ? (
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  {targetFirm
                    ? `Estimated readiness — ${headlineFirm.firmName}`
                    : `Best-fit firm — ${headlineFirm.firmName}`}
                </p>
                <p className={`mt-1 text-5xl font-extrabold tabular-nums ${tone.text}`}>
                  {headlineFirm.measuredCount > 0 ? `${headlineFirm.overall}%` : "—"}
                </p>
              </div>
              <p className="max-w-xs text-xs leading-relaxed text-muted">
                A transparent weighted average of your demonstrated skill — not a
                hiring probability. Unmeasured skills are excluded, never scored
                as zero.
              </p>
            </div>
          ) : (
            <p className="text-sm text-secondary">
              Complete a few lessons or drills to generate your readiness report.
            </p>
          )}
        </div>
      </div>

      {topFirms.length > 0 && (
        <div className="pp-card p-5">
          <h3 className="text-sm font-bold uppercase tracking-wide text-muted">
            Readiness across firms
          </h3>
          <div className="mt-4 space-y-3">
            {topFirms.map((firm) => (
              <FirmRow key={firm.firmId} firm={firm} />
            ))}
          </div>
          <Link
            to="/readiness"
            className="mt-4 inline-flex text-sm font-semibold text-accent hover:underline"
          >
            See the full readiness dashboard →
          </Link>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="pp-card p-5">
          <h3 className="text-lg font-bold text-primary">What to improve next</h3>
          <p className="mt-1 text-xs text-secondary">
            Highest-impact moves to raise your
            {focusFirmId
              ? ` ${allFirms.find((f) => f.firmId === focusFirmId)?.firmName ?? ""} `
              : " "}
            readiness.
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
    </section>
  );
}
