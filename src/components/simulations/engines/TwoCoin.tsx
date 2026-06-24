import { useState } from "react";
import type { SimulationConfig } from "../../../content/types";
import { FrequencyBarChart } from "../charts";
import { randomInt } from "../random";
import { Coin, type CoinResult, VisualStage } from "../visuals";
import { SimButton, SimFrame, Stat, StatGrid, TrialSlider } from "../ui";

const OUTCOMES = ["HH", "HT", "TH", "TT"] as const;

export function TwoCoin({ config }: { config: SimulationConfig }) {
  const [trials, setTrials] = useState(
    typeof config.trials === "number" ? config.trials : 40,
  );
  const [counts, setCounts] = useState<number[]>(() => [0, 0, 0, 0]);
  const [lastPair, setLastPair] = useState<[CoinResult, CoinResult] | null>(
    null,
  );
  const [flipId, setFlipId] = useState(0);

  function run(n: number) {
    const flips: [number, number][] = [];
    for (let i = 0; i < n; i++) flips.push([randomInt(0, 1), randomInt(0, 1)]);
    setCounts((prev) => {
      const next = [...prev];
      for (const [c0, c1] of flips) next[c0 * 2 + c1] += 1;
      return next;
    });
    const lastFlip = flips[flips.length - 1];
    if (lastFlip) {
      setLastPair([
        lastFlip[0] === 1 ? "heads" : "tails",
        lastFlip[1] === 1 ? "heads" : "tails",
      ]);
    }
    setFlipId((id) => id + 1);
  }

  function reset() {
    setCounts([0, 0, 0, 0]);
    setLastPair(null);
    setFlipId(0);
  }

  const total = counts.reduce((a, b) => a + b, 0);
  const data = OUTCOMES.map((name, i) => ({ name, value: counts[i] }));

  return (
    <SimFrame
      visual={
        <VisualStage
          physical={
            <div className="flex gap-3">
              <Coin result={lastPair?.[0] ?? null} flipId={flipId} size={76} />
              <Coin result={lastPair?.[1] ?? null} flipId={flipId} size={76} />
            </div>
          }
          chart={<FrequencyBarChart data={data} />}
        />
      }
      stats={
        <StatGrid>
          <Stat label="Trials" value={total} />
          <Stat label="HH" value={counts[0]} />
          <Stat label="One of each" value={counts[1] + counts[2]} accent />
          <Stat label="TT" value={counts[3]} />
        </StatGrid>
      }
      controls={
        <>
          <TrialSlider
            label="Trials per run"
            value={trials}
            min={1}
            max={500}
            onChange={setTrials}
          />
          <div className="flex flex-wrap items-center gap-3">
            <SimButton onClick={() => run(trials)}>Flip pair {trials}x</SimButton>
            <SimButton variant="secondary" onClick={reset}>
              Reset
            </SimButton>
          </div>
        </>
      }
    />
  );
}
