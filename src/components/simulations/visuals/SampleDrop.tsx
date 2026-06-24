/**
 * A compact "last sample" indicator that drops in whenever `sampleId` changes,
 * connecting freshly generated values to the histogram.
 */
export function SampleDrop({
  value,
  sampleId,
  batch,
}: {
  value: number | null;
  sampleId: number;
  batch?: number;
}) {
  const label =
    value === null ? "No samples yet" : `Last sample value ${value}`;

  return (
    <div
      className="flex flex-col items-center gap-2"
      role="img"
      aria-label={label}
    >
      <div
        key={sampleId}
        className={[
          "flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-bold text-accent-contrast",
          sampleId > 0 && value !== null ? "pp-anim-drop" : "",
        ].join(" ")}
        style={
          value === null
            ? {
                background: "rgb(var(--color-surface-muted))",
                color: "rgb(var(--color-text-muted))",
              }
            : {
                background:
                  "radial-gradient(circle at 35% 28%, rgb(var(--chart-1) / 0.95), rgb(var(--chart-1) / 0.7))",
              }
        }
      >
        <span className="tabular-nums" aria-hidden="true">
          {value === null ? "—" : value}
        </span>
      </div>
      <span className="text-xs font-medium text-secondary">
        {value === null
          ? "Last sample"
          : batch
            ? `Last of +${batch}`
            : "Last sample"}
      </span>
    </div>
  );
}
