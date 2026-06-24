import { useMemo, useState } from "react";
import type { SimulationConfig } from "../../../content/types";
import { FrequencyBarChart } from "../charts";
import { DrawnItem, VisualStage } from "../visuals";
import {
  SimButton,
  SimFrame,
  Stat,
  StatGrid,
  ToggleControl,
} from "../ui";

interface Bag {
  label: string;
  colors: { name: string; count: number }[];
}

const MARBLE_BAG: Bag = {
  label: "Marbles",
  colors: [
    { name: "Red", count: 5 },
    { name: "Blue", count: 3 },
    { name: "Green", count: 2 },
  ],
};

const CARD_BAG: Bag = {
  label: "Cards",
  colors: [
    { name: "Red", count: 26 },
    { name: "Black", count: 26 },
  ],
};

function pickWeighted(remaining: number[]): number {
  const total = remaining.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < remaining.length; i++) {
    r -= remaining[i];
    if (r < 0) return i;
  }
  return remaining.length - 1;
}

export function CardMarble({ config }: { config: SimulationConfig }) {
  const startMode = config.mode === "cards" ? "cards" : "marbles";
  const [mode, setMode] = useState<"marbles" | "cards">(startMode);
  const bag = mode === "cards" ? CARD_BAG : MARBLE_BAG;

  const initial = useMemo(() => bag.colors.map((c) => c.count), [bag]);
  const [remaining, setRemaining] = useState<number[]>(initial);
  const [drawn, setDrawn] = useState<number[]>(() => bag.colors.map(() => 0));
  const [withReplacement, setWithReplacement] = useState(true);
  const [lastDraw, setLastDraw] = useState<number | null>(null);
  const [drawId, setDrawId] = useState(0);

  function resetForBag(nextBag: Bag) {
    setRemaining(nextBag.colors.map((c) => c.count));
    setDrawn(nextBag.colors.map(() => 0));
    setLastDraw(null);
    setDrawId(0);
  }

  function switchMode(next: "marbles" | "cards") {
    setMode(next);
    resetForBag(next === "cards" ? CARD_BAG : MARBLE_BAG);
  }

  function draw() {
    const pool = withReplacement ? initial : remaining;
    if (pool.reduce((a, b) => a + b, 0) === 0) return;
    const idx = pickWeighted(pool);
    setLastDraw(idx);
    setDrawId((id) => id + 1);
    setDrawn((prev) => prev.map((v, i) => (i === idx ? v + 1 : v)));
    if (!withReplacement) {
      setRemaining((prev) => prev.map((v, i) => (i === idx ? v - 1 : v)));
    }
  }

  function reset() {
    resetForBag(bag);
  }

  const totalRemaining = remaining.reduce((a, b) => a + b, 0);
  const totalDrawn = drawn.reduce((a, b) => a + b, 0);
  const data = bag.colors.map((c, i) => ({ name: c.name, value: drawn[i] }));

  // Probability of each color on the next draw.
  const nextProbs = bag.colors.map((_, i) => {
    if (withReplacement) {
      const base = initial.reduce((a, b) => a + b, 0);
      return base > 0 ? initial[i] / base : 0;
    }
    return totalRemaining > 0 ? remaining[i] / totalRemaining : 0;
  });

  return (
    <SimFrame
      visual={
        <VisualStage
          physical={
            <DrawnItem
              mode={mode}
              name={lastDraw !== null ? bag.colors[lastDraw].name : null}
              drawId={drawId}
            />
          }
          chart={
            <div className="space-y-3">
              <FrequencyBarChart data={data} height={170} />
              <div className="flex flex-wrap gap-2">
                {bag.colors.map((c, i) => (
                  <span
                    key={c.name}
                    className="rounded-lg bg-surface-muted px-2.5 py-1.5 text-xs text-secondary"
                  >
                    P(next = {c.name}) ={" "}
                    <span className="font-semibold text-primary">
                      {(nextProbs[i] * 100).toFixed(1)}%
                    </span>
                    {!withReplacement && (
                      <span className="ml-1 text-muted">({remaining[i]} left)</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          }
        />
      }
      stats={
        <StatGrid>
          <Stat label="Drawn" value={totalDrawn} />
          <Stat
            label="Last draw"
            value={lastDraw !== null ? bag.colors[lastDraw].name : "—"}
            accent
          />
          <Stat
            label="In bag"
            value={withReplacement ? initial.reduce((a, b) => a + b, 0) : totalRemaining}
          />
        </StatGrid>
      }
      controls={
        <>
          <div className="flex rounded-xl bg-surface-muted p-1 text-sm font-medium">
            {(["marbles", "cards"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={[
                  "flex-1 rounded-lg px-3 py-1.5 capitalize transition-colors",
                  mode === m ? "bg-surface text-primary shadow-sm" : "text-secondary",
                ].join(" ")}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SimButton onClick={draw} disabled={!withReplacement && totalRemaining === 0}>
              Draw one
            </SimButton>
            <SimButton variant="secondary" onClick={reset}>
              Reset
            </SimButton>
            <ToggleControl
              label="With replacement"
              checked={withReplacement}
              onChange={setWithReplacement}
            />
          </div>
        </>
      }
    />
  );
}
