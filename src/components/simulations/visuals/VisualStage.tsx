import type { ReactNode } from "react";

/**
 * Composes a physical animated visual alongside the existing chart inside the
 * SimFrame `visual` area: stacked on mobile, side-by-side on wider screens.
 */
export function VisualStage({
  physical,
  chart,
}: {
  physical: ReactNode;
  chart: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="flex flex-shrink-0 items-center justify-center">
        {physical}
      </div>
      <div className="w-full min-w-0 flex-1">{chart}</div>
    </div>
  );
}
