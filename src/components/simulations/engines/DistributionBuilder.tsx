import { useState } from "react";
import type { SimulationConfig } from "../../../content/types";
import { FrequencyBarChart } from "../charts";
import { clamp, mean, median, randomInt, randomNormal } from "../random";
import { SampleDrop, VisualStage } from "../visuals";
import {
  SimButton,
  SimFrame,
  Stat,
  StatGrid,
  TrialSlider,
} from "../ui";

type Shape = "normal" | "uniform" | "skewed";

const SHAPES: { value: Shape; label: string }[] = [
  { value: "normal", label: "Bell" },
  { value: "uniform", label: "Uniform" },
  { value: "skewed", label: "Skewed" },
];

function sampleScore(shape: Shape): number {
  switch (shape) {
    case "uniform":
      return randomInt(0, 100);
    case "skewed":
      // High scores cluster near 100 with a long left tail.
      return Math.round(clamp(100 - Math.abs(randomNormal(0, 22)), 0, 100));
    case "normal":
    default:
      return Math.round(clamp(randomNormal(70, 13), 0, 100));
  }
}

function bin(values: number[]): { name: string; value: number }[] {
  const bins = Array(10).fill(0);
  for (const v of values) {
    const idx = Math.min(9, Math.floor(v / 10));
    bins[idx] += 1;
  }
  return bins.map((count, i) => ({ name: `${i * 10}`, value: count }));
}

export function DistributionBuilder({ config }: { config: SimulationConfig }) {
  const [shape, setShape] = useState<Shape>(
    (config.shape as Shape) ?? "normal",
  );
  const [size, setSize] = useState(
    typeof config.size === "number" ? config.size : 50,
  );
  const [values, setValues] = useState<number[]>([]);
  const [lastSample, setLastSample] = useState<number | null>(null);
  const [sampleId, setSampleId] = useState(0);

  function generate() {
    const batch = Array.from({ length: size }, () => sampleScore(shape));
    setValues(batch);
    setLastSample(batch[batch.length - 1]);
    setSampleId((id) => id + 1);
  }

  function add() {
    const batch = Array.from({ length: size }, () => sampleScore(shape));
    setValues((prev) => [...prev, ...batch]);
    setLastSample(batch[batch.length - 1]);
    setSampleId((id) => id + 1);
  }

  function reset() {
    setValues([]);
    setLastSample(null);
    setSampleId(0);
  }

  const m = values.length ? mean(values) : 0;
  const md = values.length ? median(values) : 0;

  return (
    <SimFrame
      visual={
        <VisualStage
          physical={
            <SampleDrop value={lastSample} sampleId={sampleId} batch={size} />
          }
          chart={<FrequencyBarChart data={bin(values)} />}
        />
      }
      stats={
        <StatGrid>
          <Stat label="Sample size" value={values.length} />
          <Stat label="Mean" value={values.length ? m.toFixed(1) : "—"} accent />
          <Stat label="Median" value={values.length ? md.toFixed(1) : "—"} accent />
          <Stat
            label="Range"
            value={
              values.length
                ? `${Math.min(...values)}–${Math.max(...values)}`
                : "—"
            }
          />
        </StatGrid>
      }
      controls={
        <>
          <div className="flex rounded-xl bg-surface-muted p-1 text-sm font-medium">
            {SHAPES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setShape(s.value)}
                className={[
                  "flex-1 rounded-lg px-3 py-1.5 transition-colors",
                  shape === s.value ? "bg-surface text-primary shadow-sm" : "text-secondary",
                ].join(" ")}
              >
                {s.label}
              </button>
            ))}
          </div>
          <TrialSlider
            label="Sample size"
            value={size}
            min={10}
            max={500}
            step={10}
            onChange={setSize}
          />
          <div className="flex flex-wrap items-center gap-3">
            <SimButton onClick={generate}>Generate</SimButton>
            <SimButton variant="secondary" onClick={add}>
              Add more
            </SimButton>
            <SimButton variant="secondary" onClick={reset}>
              Reset
            </SimButton>
          </div>
        </>
      }
    />
  );
}
