const COLOR_VARS: Record<string, string> = {
  Red: "var(--color-danger)",
  Blue: "var(--chart-2)",
  Green: "var(--color-success)",
  Black: "var(--color-text-primary)",
};

const CARD_SUIT: Record<string, string> = {
  Red: "♥",
  Black: "♠",
};

/**
 * Shows the most recently drawn marble (colored sphere) or card (suited
 * rectangle), dropping in whenever `drawId` changes.
 */
export function DrawnItem({
  mode,
  name,
  drawId,
}: {
  mode: "marbles" | "cards";
  name: string | null;
  drawId: number;
}) {
  const animClass = drawId > 0 && name !== null ? "pp-anim-drop" : "";
  const label =
    name === null
      ? `No ${mode === "cards" ? "card" : "marble"} drawn yet`
      : `Drew ${name} ${mode === "cards" ? "card" : "marble"}`;

  if (name === null) {
    return (
      <div
        role="img"
        aria-label={label}
        className="flex h-24 w-20 items-center justify-center rounded-2xl border border-dashed border-subtle text-sm text-muted"
      >
        Draw
      </div>
    );
  }

  const varName = COLOR_VARS[name] ?? "var(--color-accent)";

  if (mode === "cards") {
    return (
      <div
        key={drawId}
        role="img"
        aria-label={label}
        className={[
          "flex h-28 w-20 flex-col justify-between rounded-xl bg-surface-raised p-2 shadow-card",
          animClass,
        ].join(" ")}
        style={{ border: "2px solid rgb(var(--color-border))" }}
      >
        <span
          className="text-lg font-bold leading-none"
          style={{ color: `rgb(${varName})` }}
        >
          A
        </span>
        <span
          className="text-center text-3xl leading-none"
          style={{ color: `rgb(${varName})` }}
          aria-hidden="true"
        >
          {CARD_SUIT[name] ?? "♦"}
        </span>
        <span
          className="rotate-180 text-lg font-bold leading-none"
          style={{ color: `rgb(${varName})` }}
        >
          A
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        key={drawId}
        role="img"
        aria-label={label}
        className={["h-20 w-20 rounded-full", animClass].join(" ")}
        style={{
          background: `radial-gradient(circle at 32% 28%, rgb(${varName} / 0.95), rgb(${varName} / 0.65))`,
          boxShadow: "inset -3px -4px 8px rgb(0 0 0 / 0.25)",
        }}
      />
      <span className="text-xs font-medium text-secondary">{name}</span>
    </div>
  );
}
