import { useState } from "react";
import type { SimulationConfig } from "../../../content/types";
import { FrequencyBarChart } from "../charts";
import { randomInt } from "../random";
import { Die, VisualStage } from "../visuals";
import { SimButton, SimFrame, Stat, StatGrid, TrialSlider } from "../ui";

export function TwoDice({ config }: { config: SimulationConfig }) {
  const [trials, setTrials] = useState(
    typeof config.trials === "number" ? config.trials : 60,
  );
  // Index 0..10 maps to sums 2..12.
  const [counts, setCounts] = useState<number[]>(() => Array(11).fill(0));
  const [last, setLast] = useState<[number, number] | null>(null);
  const [rollId, setRollId] = useState(0);

  function run(n: number) {
    const rolls: [number, number][] = [];
    for (let i = 0; i < n; i++) rolls.push([randomInt(1, 6), randomInt(1, 6)]);
    setCounts((prev) => {
      const next = [...prev];
      for (const [a, b] of rolls) next[a + b - 2] += 1;
      return next;
    });
    const lastRoll = rolls[rolls.length - 1];
    if (lastRoll) setLast(lastRoll);
    setRollId((id) => id + 1);
  }

  function reset() {
    setCounts(Array(11).fill(0));
    setLast(null);
    setRollId(0);
  }

  const total = counts.reduce((a, b) => a + b, 0);
  const data = counts.map((value, i) => ({ name: String(i + 2), value }));
  const mostFreqSum =
    total > 0 ? counts.indexOf(Math.max(...counts)) + 2 : "—";

  return (
    <SimFrame
      visual={
        <VisualStage
          physical={
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex gap-3">
                <Die value={last?.[0] ?? null} rollId={rollId} size={68} />
                <Die value={last?.[1] ?? null} rollId={rollId} size={68} />
              </div>
              <span className="text-sm font-medium text-secondary">
                Sum: <span className="font-bold text-accent">
                  {last ? last[0] + last[1] : "—"}
                </span>
              </span>
            </div>
          }
          chart={<FrequencyBarChart data={data} />}
        />
      }
      stats={
        <StatGrid>
          <Stat label="Rolls" value={total} />
          <Stat label="Sum = 7" value={counts[5]} />
          <Stat label="Most frequent" value={mostFreqSum} accent />
        </StatGrid>
      }
      controls={
        <>
          <TrialSlider
            label="Rolls per run"
            value={trials}
            min={1}
            max={600}
            onChange={setTrials}
          />
          <div className="flex flex-wrap items-center gap-3">
            <SimButton onClick={() => run(trials)}>Roll pair {trials}x</SimButton>
            <SimButton variant="secondary" onClick={reset}>
              Reset
            </SimButton>
          </div>
        </>
      }
    />
  );
}
