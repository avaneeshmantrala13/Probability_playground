/**
 * A token showing the latest single trial outcome (success / failure), popping
 * in whenever `trialId` changes. Connects an individual trial to the running
 * proportion line.
 */
export function OutcomeToken({
  success,
  trialId,
}: {
  success: boolean | null;
  trialId: number;
}) {
  const label =
    success === null
      ? "No trials yet"
      : `Last trial: ${success ? "success" : "failure"}`;

  const varName = success ? "var(--color-success)" : "var(--color-danger)";

  return (
    <div className="flex flex-col items-center gap-2" role="img" aria-label={label}>
      <div
        key={trialId}
        className={[
          "flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold text-accent-contrast",
          trialId > 0 ? "pp-anim-pop" : "",
        ].join(" ")}
        style={
          success === null
            ? {
                background: "rgb(var(--color-surface-muted))",
                color: "rgb(var(--color-text-muted))",
              }
            : {
                background: `radial-gradient(circle at 35% 30%, rgb(${varName} / 0.95), rgb(${varName} / 0.75))`,
              }
        }
      >
        <span aria-hidden="true">
          {success === null ? "?" : success ? "✓" : "✕"}
        </span>
      </div>
      <span className="text-xs font-medium text-secondary">
        {success === null ? "Latest trial" : success ? "Success" : "Failure"}
      </span>
    </div>
  );
}
