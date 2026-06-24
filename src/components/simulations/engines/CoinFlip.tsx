import { useEffect, useRef, useState } from "react";
import type { SimulationConfig } from "../../../content/types";
import { FrequencyBarChart } from "../charts";
import { randomInt } from "../random";
import { Coin, type CoinResult, VisualStage } from "../visuals";
import {
  SimButton,
  SimFrame,
  Stat,
  StatGrid,
  ToggleControl,
  TrialSlider,
} from "../ui";

export function CoinFlip({ config }: { config: SimulationConfig }) {
  const initialTrials = typeof config.trials === "number" ? config.trials : 20;
  const [trials, setTrials] = useState(initialTrials);
  const [heads, setHeads] = useState(0);
  const [tails, setTails] = useState(0);
  const [autoRun, setAutoRun] = useState(false);
  const [last, setLast] = useState<CoinResult | null>(null);
  const [flipId, setFlipId] = useState(0);

  const total = heads + tails;

  function flip(n: number) {
    let h = 0;
    let lastFlip = 0;
    for (let i = 0; i < n; i++) {
      lastFlip = randomInt(0, 1);
      h += lastFlip;
    }
    setHeads((prev) => prev + h);
    setTails((prev) => prev + (n - h));
    setLast(lastFlip === 1 ? "heads" : "tails");
    setFlipId((id) => id + 1);
  }

  const autoRef = useRef(autoRun);
  autoRef.current = autoRun;
  useEffect(() => {
    if (!autoRun) return;
    const id = setInterval(() => flip(trials), 500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun, trials]);

  function reset() {
    setAutoRun(false);
    setHeads(0);
    setTails(0);
    setLast(null);
    setFlipId(0);
  }

  const headPct = total > 0 ? ((heads / total) * 100).toFixed(1) : "0.0";

  return (
    <SimFrame
      visual={
        <VisualStage
          physical={<Coin result={last} flipId={flipId} />}
          chart={
            <FrequencyBarChart
              data={[
                { name: "Heads", value: heads },
                { name: "Tails", value: tails },
              ]}
            />
          }
        />
      }
      stats={
        <StatGrid>
          <Stat label="Flips" value={total} />
          <Stat label="Heads" value={heads} />
          <Stat label="Tails" value={tails} />
          <Stat label="% Heads" value={`${headPct}%`} accent />
        </StatGrid>
      }
      controls={
        <>
          <TrialSlider
            label="Flips per run"
            value={trials}
            min={1}
            max={500}
            onChange={setTrials}
          />
          <div className="flex flex-wrap items-center gap-3">
            <SimButton onClick={() => flip(trials)}>Flip {trials}x</SimButton>
            <SimButton variant="secondary" onClick={reset}>
              Reset
            </SimButton>
            <ToggleControl label="Auto-run" checked={autoRun} onChange={setAutoRun} />
          </div>
        </>
      }
    />
  );
}
