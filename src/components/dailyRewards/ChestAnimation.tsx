import { useMemo } from "react";
import { CHEST_TIER_GRADIENTS } from "../../lib/dailyRewards";
import { chestTierName, type PendingChest } from "../../lib/streak";
import "./dailyRewards.css";

type Phase = "idle" | "shaking" | "open";

interface ChestAnimationProps {
  chest: PendingChest;
  phase: Phase;
  onOpen: () => void;
}

export function ChestAnimation({ chest, phase, onOpen }: ChestAnimationProps) {
  const [from, to] = CHEST_TIER_GRADIENTS[chest.level - 1] ?? CHEST_TIER_GRADIENTS[0];
  const tier = chestTierName(chest.level);

  const chestClass = useMemo(() => {
    if (phase === "shaking") return "pp-chest-shake pp-chest-glow";
    if (phase === "open") return "pp-chest-glow";
    return "";
  }, [phase]);

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm font-semibold uppercase tracking-wider text-secondary">
        Day {chest.streakDay} streak &middot; {tier} chest
      </p>

      <button
        type="button"
        disabled={phase !== "idle"}
        onClick={onOpen}
        aria-label={`Open ${tier} treasure chest`}
        className={[
          "relative flex h-36 w-36 items-center justify-center rounded-2xl border-2 border-white/20 shadow-2xl transition-transform",
          phase === "idle" ? "cursor-pointer hover:scale-105 active:scale-95" : "cursor-default",
          chestClass,
        ].join(" ")}
        style={{ background: `linear-gradient(145deg, ${from}, ${to})` }}
      >
        <div
          className="absolute left-3 right-3 top-4 h-10 rounded-t-lg border border-white/25 bg-white/10"
          aria-hidden
        />
        <div
          className="absolute top-[3.25rem] h-5 w-5 rounded-full border-2 border-yellow-200/80 bg-yellow-300/90 shadow"
          aria-hidden
        />
        <div
          className="absolute bottom-6 left-3 right-3 h-3 rounded bg-black/20"
          aria-hidden
        />
        {phase === "idle" && (
          <span className="absolute -bottom-8 text-xs font-medium text-muted">Tap to open</span>
        )}
      </button>
    </div>
  );
}
