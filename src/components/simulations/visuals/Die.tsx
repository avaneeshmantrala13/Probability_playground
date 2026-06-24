const PIP_LAYOUT: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 28], [72, 28], [28, 50], [72, 50], [28, 72], [72, 72]],
};

/**
 * A die that tumbles and settles on `value` (1-6). Re-animates whenever
 * `rollId` changes (remounted via key); the tumble is suppressed under
 * reduced-motion via CSS.
 */
export function Die({
  value,
  rollId,
  size = 88,
}: {
  value: number | null;
  rollId: number;
  size?: number;
}) {
  const face = value ?? 1;
  const pips = PIP_LAYOUT[face];
  const numeric = value !== null && pips === undefined;

  return (
    <div
      role="img"
      aria-label={value === null ? "Die ready to roll" : `Die showing ${value}`}
      style={{ width: size, height: size }}
    >
      <div
        key={rollId}
        className={rollId > 0 ? "pp-anim-die-roll" : undefined}
        style={{ width: "100%", height: "100%" }}
      >
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          <rect
            x="4"
            y="4"
            width="92"
            height="92"
            rx="18"
            fill="rgb(var(--color-surface-raised))"
            stroke="rgb(var(--color-border))"
            strokeWidth="3"
          />
          {value !== null && !numeric &&
            pips.map(([cx, cy], i) => (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r="9"
                fill="rgb(var(--color-accent))"
              />
            ))}
          {numeric && (
            <text
              x="50"
              y="50"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="44"
              fontWeight="700"
              fill="rgb(var(--color-accent))"
            >
              {value}
            </text>
          )}
        </svg>
      </div>
    </div>
  );
}
