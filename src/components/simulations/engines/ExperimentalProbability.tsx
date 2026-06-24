import { useState } from "react";
import type { SimulationConfig } from "../../../content/types";
import { FrequencyBarChart } from "../charts";
import { OutcomeToken, VisualStage } from "../visuals";
import {
  SimButton,
  SimFrame,
  Stat,
  StatGrid,
  TrialSlider,
} from "../ui";

export function ExperimentalProbability({ config }: { config: SimulationConfig }) {
  const trueProb =
    typeof config.probability === "number" ? config.probability : 0.5;
  const [batch, setBatch] = useState(
    typeof config.trials === "number" ? config.trials : 200,
  );

  const [trials, setTrials] = useState(0);
  const [successes, setSuccesses] = useState(0);
  const [lastSuccess, setLastSuccess] = useState<boolean | null>(null);
  const [trialId, setTrialId] = useState(0);

  function run(n: number) {
    let s = 0;
    let last = false;
    for (let i = 0; i < n; i++) {
      last = Math.random() < trueProb;
      if (last) s += 1;
    }
    setTrials((t) => t + n);
    setSuccesses((prev) => prev + s);
    setLastSuccess(last);
    setTrialId((id) => id + 1);
  }

  function reset() {
    setTrials(0);
    setSuccesses(0);
    setLastSuccess(null);
    setTrialId(0);
  }

  const failures = trials - successes;
  const experimental = trials > 0 ? successes / trials : 0;

  return (
    <SimFrame
      visual={
        <VisualStage
          physical={<OutcomeToken success={lastSuccess} trialId={trialId} />}
          chart={
            <FrequencyBarChart
              showPercent
              data={[
                { name: "Success", value: successes },
                { name: "Failure", value: failures },
              ]}
            />
          }
        />
      }
      stats={
        <StatGrid>
          <Stat label="Trials" value={trials} />
          <Stat label="Successes" value={successes} />
          <Stat
            label="Experimental"
            value={`${(experimental * 100).toFixed(1)}%`}
            accent
          />
          <Stat label="Theoretical" value={`${(trueProb * 100).toFixed(0)}%`} />
        </StatGrid>
      }
      controls={
        <>
          <TrialSlider
            label="Trials per run"
            value={batch}
            min={10}
            max={2000}
            step={10}
            onChange={setBatch}
          />
          <div className="flex flex-wrap items-center gap-3">
            <SimButton onClick={() => run(batch)}>Run {batch} trials</SimButton>
            <SimButton variant="secondary" onClick={reset}>
              Reset
            </SimButton>
          </div>
        </>
      }
    />
  );
}
