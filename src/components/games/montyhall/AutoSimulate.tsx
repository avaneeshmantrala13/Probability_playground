import { useState } from "react";
import { simulateMany, type SimulationOutcome } from "./logic";

const GAME_OPTIONS = [100, 500, 1000] as const;

interface Results {
  switch: SimulationOutcome;
  stay: SimulationOutcome;
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/** A single labelled bar whose height encodes the win rate. */
function ResultBar({
  label,
  outcome,
  colorVar,
}: {
  label: string;
  outcome: SimulationOutcome | null;
  colorVar: string;
}) {
  const rate = outcome ? outcome.winRate : 0;
  return (
    <div className="flex flex-1 flex-col items-center">
      <div className="flex h-44 w-full items-end justify-center">
        <div
          className="flex w-2/3 max-w-[5rem] items-start justify-center rounded-t-lg transition-[height] duration-700 ease-out motion-reduce:transition-none"
          style={{
            height: `${Math.max(rate * 100, 2)}%`,
            background: `rgb(var(${colorVar}))`,
          }}
        >
          {outcome && (
            <span className="mt-1 text-xs font-bold text-accent-contrast">
              {Math.round(rate * 100)}%
            </span>
          )}
        </div>
      </div>
      <div className="mt-2 text-center">
        <div className="text-sm font-semibold text-primary">{label}</div>
        <div className="text-xs tabular-nums text-secondary">
          {outcome ? `${outcome.wins}/${outcome.games} won` : "—"}
        </div>
      </div>
    </div>
  );
}

export function AutoSimulate() {
  const [games, setGames] = useState<number>(500);
  const [results, setResults] = useState<Results | null>(null);

  const run = () => {
    setResults({
      switch: simulateMany("switch", games),
      stay: simulateMany("stay", games),
    });
  };

  return (
    <section className="pp-card p-4 sm:p-5">
      <h2 className="text-base font-semibold text-primary">Auto-simulate</h2>
      <p className="mt-1 text-sm text-secondary">
        Run many automated games for each strategy and compare the win rates.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <span className="pp-label">Games per strategy</span>
          <div className="inline-flex rounded-xl border border-subtle bg-surface-muted p-1">
            {GAME_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setGames(opt)}
                aria-pressed={games === opt}
                className={[
                  "rounded-lg px-3 py-1.5 text-sm font-semibold tabular-nums transition-colors",
                  games === opt
                    ? "bg-accent text-accent-contrast"
                    : "text-secondary hover:text-primary",
                ].join(" ")}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <button type="button" className="pp-btn-primary" onClick={run}>
          {results ? "Run again" : "Run simulation"}
        </button>
      </div>

      <div className="relative mt-5 rounded-xl border border-subtle bg-surface p-4">
        {/* reference markers at the two theoretical win rates */}
        <div className="pointer-events-none absolute inset-x-4 top-4 h-44">
          {[
            { frac: 2 / 3, text: "2/3" },
            { frac: 1 / 3, text: "1/3" },
          ].map((m) => (
            <div
              key={m.text}
              className="absolute inset-x-0 flex items-center gap-2"
              style={{ top: `${(1 - m.frac) * 100}%` }}
            >
              <div className="h-px flex-1 border-t border-dashed border-subtle" />
              <span className="text-[0.65rem] font-medium text-muted">{m.text}</span>
            </div>
          ))}
        </div>

        <div className="relative flex gap-4">
          <ResultBar label="Always switch" outcome={results?.switch ?? null} colorVar="--chart-1" />
          <ResultBar label="Always stay" outcome={results?.stay ?? null} colorVar="--chart-3" />
        </div>
      </div>

      {results && (
        <p className="mt-3 text-center text-sm text-secondary">
          Switching won{" "}
          <span className="font-semibold text-primary">{pct(results.switch.winRate)}</span>{" "}
          of {results.switch.games} games; staying won{" "}
          <span className="font-semibold text-primary">{pct(results.stay.winRate)}</span>.
        </p>
      )}
    </section>
  );
}
