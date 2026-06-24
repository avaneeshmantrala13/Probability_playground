import type { ReactNode } from "react";

/** Outer frame: a chart/visual area on top, controls + stats below. */
export function SimFrame({
  visual,
  controls,
  stats,
}: {
  visual: ReactNode;
  controls: ReactNode;
  stats?: ReactNode;
}) {
  return (
    <div className="w-full space-y-4">
      <div className="rounded-xl border border-subtle bg-surface p-3 sm:p-4">{visual}</div>
      {stats}
      <div className="flex flex-col gap-3">{controls}</div>
    </div>
  );
}

export function SimButton({
  children,
  onClick,
  variant = "primary",
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={variant === "primary" ? "pp-btn-primary" : "pp-btn-secondary"}
    >
      {children}
    </button>
  );
}

export function TrialSlider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex justify-between text-sm font-medium text-secondary">
        <span>{label}</span>
        <span className="tabular-nums text-primary">{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="pp-range w-full"
        aria-label={label}
      />
    </label>
  );
}

export function ToggleControl({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-secondary">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          "relative h-6 w-11 flex-shrink-0 rounded-full transition-colors",
          checked ? "bg-accent" : "bg-surface-muted",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow transition-transform",
            checked ? "translate-x-[1.375rem]" : "translate-x-0.5",
          ].join(" ")}
        />
      </button>
      {label}
    </label>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{children}</div>
  );
}

export function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl bg-surface-muted px-3 py-2.5 text-center">
      <div
        className={[
          "text-lg font-bold tabular-nums",
          accent ? "text-accent" : "text-primary",
        ].join(" ")}
      >
        {value}
      </div>
      <div className="text-xs text-secondary">{label}</div>
    </div>
  );
}

/** Shared inline style for Recharts tooltips so they follow the theme. */
export const tooltipStyle = {
  background: "rgb(var(--color-surface-raised))",
  border: "1px solid rgb(var(--color-border))",
  borderRadius: "0.75rem",
  color: "rgb(var(--color-text-primary))",
  fontSize: "0.8125rem",
  boxShadow: "0 4px 16px rgb(0 0 0 / 0.12)",
} as const;

export const tooltipLabelStyle = {
  color: "rgb(var(--color-text-secondary))",
  fontWeight: 600,
} as const;
