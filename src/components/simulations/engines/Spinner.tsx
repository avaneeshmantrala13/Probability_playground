import { useState } from "react";
import type { SimulationConfig } from "../../../content/types";
import { FrequencyBarChart } from "../charts";
import { useChartColors } from "../useChartColors";
import { randomInt } from "../random";
import { VisualStage } from "../visuals";
import {
  SimButton,
  SimFrame,
  Stat,
  StatGrid,
  TrialSlider,
} from "../ui";

function sectorPath(cx: number, cy: number, r: number, start: number, end: number): string {
  const toXY = (a: number) => [
    cx + r * Math.cos((a - 90) * (Math.PI / 180)),
    cy + r * Math.sin((a - 90) * (Math.PI / 180)),
  ];
  const [x1, y1] = toXY(start);
  const [x2, y2] = toXY(end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

export function Spinner({ config }: { config: SimulationConfig }) {
  const colors = useChartColors();
  const [sectors, setSectors] = useState(
    typeof config.sectors === "number" ? config.sectors : 4,
  );
  const [trials, setTrials] = useState(
    typeof config.trials === "number" ? config.trials : 1,
  );
  const [counts, setCounts] = useState<number[]>(() => Array(sectors).fill(0));
  const [rotation, setRotation] = useState(0);
  const [last, setLast] = useState<number | null>(null);

  function changeSectors(n: number) {
    setSectors(n);
    setCounts(Array(n).fill(0));
    setLast(null);
  }

  function spin(n: number) {
    const results: number[] = [];
    for (let i = 0; i < n; i++) results.push(randomInt(0, sectors - 1));
    setCounts((prev) => {
      const next = prev.length === sectors ? [...prev] : Array(sectors).fill(0);
      for (const r of results) next[r] += 1;
      return next;
    });
    const result = results[results.length - 1] ?? 0;
    setLast(result);
    const sectorAngle = 360 / sectors;
    const target = 360 * 4 + (360 - (result * sectorAngle + sectorAngle / 2));
    setRotation((prev) => prev + (target % 360) + 360 * 3);
  }

  function reset() {
    setCounts(Array(sectors).fill(0));
    setLast(null);
    setRotation(0);
  }

  const total = counts.reduce((a, b) => a + b, 0);
  const sectorAngle = 360 / sectors;
  const data = counts.map((value, i) => ({ name: `S${i + 1}`, value }));

  return (
    <SimFrame
      visual={
        <VisualStage
          physical={
            <svg width="160" height="160" viewBox="0 0 160 160" role="img" aria-label={last !== null ? `Spinner landed on sector ${last + 1}` : "Spinner"}>
              <g
                style={{
                  transformOrigin: "80px 80px",
                  transform: `rotate(${rotation}deg)`,
                  transition: "transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)",
                }}
              >
                {Array.from({ length: sectors }).map((_, i) => (
                  <path
                    key={i}
                    d={sectorPath(80, 80, 74, i * sectorAngle, (i + 1) * sectorAngle)}
                    fill={colors.series[i % colors.series.length]}
                    stroke="rgb(var(--color-surface))"
                    strokeWidth="1.5"
                    opacity={last === null || last === i ? 1 : 0.55}
                  />
                ))}
              </g>
              <polygon points="80,4 73,20 87,20" fill="rgb(var(--color-text-primary))" />
              <circle cx="80" cy="80" r="6" fill="rgb(var(--color-surface))" stroke="rgb(var(--color-border))" />
            </svg>
          }
          chart={<FrequencyBarChart data={data} height={150} />}
        />
      }
      stats={
        <StatGrid>
          <Stat label="Spins" value={total} />
          <Stat label="Sectors" value={sectors} />
          <Stat
            label="Last result"
            value={last !== null ? `S${last + 1}` : "—"}
            accent
          />
        </StatGrid>
      }
      controls={
        <>
          <TrialSlider
            label="Sectors"
            value={sectors}
            min={2}
            max={8}
            onChange={changeSectors}
          />
          <TrialSlider
            label="Spins per run"
            value={trials}
            min={1}
            max={300}
            onChange={setTrials}
          />
          <div className="flex flex-wrap items-center gap-3">
            <SimButton onClick={() => spin(trials)}>Spin {trials}x</SimButton>
            <SimButton variant="secondary" onClick={reset}>
              Reset
            </SimButton>
          </div>
        </>
      }
    />
  );
}
