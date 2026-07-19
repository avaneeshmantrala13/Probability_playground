// Shared elicitation widgets for the Calibration Gym drill (ported from the
// Gym's src/components/forecastInputs.tsx). Restyled to use Playground's `pp-`
// component classes + semantic color tokens so the drill matches the rest of
// the app in both light and dark themes.

export function ProbabilityInput({
  prob,
  setProb,
  onSubmit,
  submitting,
  submitLabel = "Lock in forecast",
}: {
  prob: number;
  setProb: (n: number) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitLabel?: string;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="pp-label">Your probability the claim is TRUE</div>
      <div className="mt-3 text-center">
        <span className="font-mono text-5xl font-bold tabular-nums text-primary">
          {prob}
          <span className="text-2xl text-muted">%</span>
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={99}
        value={prob}
        onChange={(e) => setProb(Number(e.target.value))}
        className="pp-range mt-5 w-full"
      />
      <div className="mt-1 flex justify-between font-mono text-[11px] text-muted">
        <span>certainly false</span>
        <span>50/50</span>
        <span>certainly true</span>
      </div>
      <div className="mt-4 grid grid-cols-5 gap-2">
        {[10, 30, 50, 70, 90].map((p) => (
          <button
            key={p}
            onClick={() => setProb(p)}
            className="rounded-lg border border-subtle bg-surface-muted py-1.5 text-xs font-medium text-secondary hover:border-accent hover:text-primary"
          >
            {p}%
          </button>
        ))}
      </div>
      <button
        onClick={onSubmit}
        disabled={submitting}
        className="pp-btn-primary mt-6 w-full"
      >
        {submitting ? "Scoring…" : submitLabel}
      </button>
    </div>
  );
}

export function IntervalInput({
  lo,
  hi,
  setLo,
  setHi,
  confidence,
  setConfidence,
  suggestedMax,
  unit,
  valid,
  onSubmit,
  submitting,
  submitLabel = "Lock in interval",
}: {
  lo: string;
  hi: string;
  setLo: (s: string) => void;
  setHi: (s: string) => void;
  confidence: number;
  setConfidence: (n: number) => void;
  suggestedMax?: number;
  unit?: string;
  valid: boolean;
  onSubmit: () => void;
  submitting: boolean;
  submitLabel?: string;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="pp-label">Your prediction interval ({unit})</div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <div className="mb-1 text-xs text-secondary">Low</div>
          <input
            className="pp-input font-mono"
            inputMode="decimal"
            placeholder="0"
            value={lo}
            onChange={(e) => setLo(e.target.value)}
          />
        </div>
        <div>
          <div className="mb-1 text-xs text-secondary">High</div>
          <input
            className="pp-input font-mono"
            inputMode="decimal"
            placeholder={suggestedMax ? String(suggestedMax) : "10"}
            value={hi}
            onChange={(e) => setHi(e.target.value)}
          />
        </div>
      </div>
      <div className="pp-label mt-5">Confidence</div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {[0.8, 0.9, 0.95].map((c) => (
          <button
            key={c}
            onClick={() => setConfidence(c)}
            className={`rounded-lg border py-2 text-sm font-semibold transition ${
              confidence === c
                ? "border-accent bg-accent/15 text-primary"
                : "border-subtle bg-surface-muted text-secondary hover:text-primary"
            }`}
          >
            {Math.round(c * 100)}%
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">
        A {Math.round(confidence * 100)}% interval should contain the true value
        about {Math.round(confidence * 100)}% of the time. Scored with the
        Winkler interval score.
      </p>
      <button
        onClick={onSubmit}
        disabled={submitting || !valid}
        className="pp-btn-primary mt-6 w-full"
      >
        {submitting ? "Scoring…" : submitLabel}
      </button>
    </div>
  );
}
