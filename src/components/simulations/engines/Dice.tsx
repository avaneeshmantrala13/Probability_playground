import { useState } from "react";
import type { SimulationConfig } from "../../../content/types";
import { FrequencyBarChart } from "../charts";
import { randomInt } from "../random";
import { Die, VisualStage } from "../visuals";
import { SimButton, SimFrame, Stat, StatGrid, TrialSlider } from "../ui";

export function Dice({ config }: { config: SimulationConfig }) {
  const sides = typeof config.sides === "number" ? config.sides : 6;
  const [trials, setTrials] = useState(
    typeof config.trials === "number" ? config.trials : 30,
  );
  const [counts, setCounts] = useState<number[]>(() => Array(sides).fill(0));
  const [last, setLast] = useState<number | null>(null);
  const [rollId, setRollId] = useState(0);

  const total = counts.reduce((a, b) => a + b, 0);

  function roll(n: number) {
    // Generate the run up front so the final face is known synchronously,
    // independent of when React invokes the counts updater.
    const faces: number[] = [];
    for (let i = 0; i < n; i++) faces.push(randomInt(0, sides - 1));

    setCounts((prev) => {
      const next = [...prev];
      for (const face of faces) next[face] += 1;
      return next;
    });
    setLast(faces[faces.length - 1] + 1);
    setRollId((id) => id + 1);
  }

  function reset() {
    setCounts(Array(sides).fill(0));
    setLast(null);
    setRollId(0);
  }

  const data = counts.map((value, i) => ({ name: String(i + 1), value }));

  return (
    <SimFrame
      visual={
        <VisualStage
          physical={<Die value={last} rollId={rollId} />}
          chart={<FrequencyBarChart data={data} />}
        />
      }
      stats={
        <StatGrid>
          <Stat label="Rolls" value={total} />
          <Stat label="Faces" value={sides} />
          <Stat
            label="Expected each"
            value={total > 0 ? (total / sides).toFixed(1) : "0"}
            accent
          />
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
            <SimButton onClick={() => roll(trials)}>Roll {trials}x</SimButton>
            <SimButton variant="secondary" onClick={reset}>
              Reset
            </SimButton>
          </div>
        </>
      }
    />
  );
}
