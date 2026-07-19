import type { ReactNode } from "react";

/**
 * Small pill used by the drill (ported from the Gym's Badge). The good/warn/bad
 * tones use the namespaced `cg-signal` palette; default/accent lean on
 * Playground's semantic tokens so the pill adapts to light/dark themes.
 */
export function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "good" | "warn" | "bad" | "accent";
}) {
  const map = {
    default: "border-subtle bg-surface-muted text-secondary",
    good: "border-cg-signal-good/30 bg-cg-signal-good/10 text-cg-signal-good",
    warn: "border-cg-signal-warn/30 bg-cg-signal-warn/10 text-cg-signal-warn",
    bad: "border-cg-signal-bad/30 bg-cg-signal-bad/10 text-cg-signal-bad",
    accent: "border-accent/40 bg-accent/10 text-accent",
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${map[tone]}`}
    >
      {children}
    </span>
  );
}
