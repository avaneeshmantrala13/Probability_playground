import { useProgress } from "../../context/ProgressContext";

/**
 * Global, non-intrusive warning shown when progress saves are failing. Turning a
 * silent dropped write into a visible, retryable state is what guarantees a
 * student never *thinks* their work is saved when it isn't.
 */
export function SaveStatusBanner() {
  const { saveFailed, retrySave } = useProgress();
  if (!saveFailed) return null;

  return (
    <div
      role="alert"
      className="sticky top-[4.25rem] z-20 border-b border-amber-500/30 bg-amber-500/15 backdrop-blur-md"
    >
      <div className="mx-auto flex w-full max-w-[90rem] flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm sm:px-6">
        <span className="font-medium text-amber-700 dark:text-amber-200">
          We couldn&apos;t save your latest progress. Keep this tab open and check your
          connection &mdash; we&apos;ll keep retrying automatically.
        </span>
        <button
          type="button"
          onClick={retrySave}
          className="shrink-0 rounded-lg border border-amber-500/40 px-3 py-1 font-semibold text-amber-700 transition-colors hover:bg-amber-500/20 dark:text-amber-100"
        >
          Retry now
        </button>
      </div>
    </div>
  );
}
