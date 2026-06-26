import { useEffect, useState } from "react";
import { CHEST_BADGE_META } from "../../lib/dailyRewards/badges";
import type { ChestReward } from "../../lib/streak";
import { chestTierName } from "../../lib/streak";
import { ChipIcon } from "../badges/tokenIcons";
import { FlameIcon } from "../icons";
import { ChestAnimation } from "./ChestAnimation";
import "./dailyRewards.css";

interface ChestModalProps {
  streakDay: number;
  chestLevel: number;
  reward: ChestReward;
  onClaimed: () => void;
}

type Phase = "idle" | "shaking" | "open";

function RewardDisplay({ reward }: { reward: ChestReward }) {
  if (reward.kind === "tokens") {
    return (
      <div className="pp-reward-reveal flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-400/20">
          <ChipIcon size={40} />
        </div>
        <p className="text-2xl font-extrabold text-primary">+{reward.amount} tokens</p>
        <p className="text-sm text-secondary">Added to your balance</p>
      </div>
    );
  }

  if (reward.kind === "lives") {
    return (
      <div className="pp-reward-reveal flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-400/20 text-rose-500">
          <FlameIcon size={36} />
        </div>
        <p className="text-2xl font-extrabold text-primary">
          +{reward.amount} {reward.amount === 1 ? "life" : "lives"}
        </p>
        <p className="max-w-xs text-center text-sm text-secondary">
          Wrong quiz answers can be forgiven when you have lives
        </p>
      </div>
    );
  }

  const meta = CHEST_BADGE_META[reward.badgeId as keyof typeof CHEST_BADGE_META];
  return (
    <div className="pp-reward-reveal flex flex-col items-center gap-3">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-lg"
        style={{
          background: meta
            ? `linear-gradient(135deg, ${meta.gradient[0]}, ${meta.gradient[1]})`
            : undefined,
        }}
      >
        ★
      </div>
      <p className="text-2xl font-extrabold text-primary">{meta?.title ?? "Rare Badge"}</p>
      <p className="max-w-xs text-center text-sm text-secondary">
        {meta?.description ?? "A special badge from your chest"}
      </p>
    </div>
  );
}

export function ChestModal({ streakDay, chestLevel, reward, onClaimed }: ChestModalProps) {
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase === "open") onClaimed();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [phase, onClaimed]);

  function handleOpen() {
    if (phase !== "idle") return;
    setPhase("shaking");
    window.setTimeout(() => setPhase("open"), 1000);
  }

  const tier = chestTierName(chestLevel);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div aria-hidden className="pp-anim-fade-in absolute inset-0 bg-bg/90 backdrop-blur-md" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Daily treasure chest"
        className="pp-anim-dialog-pop pp-card relative z-10 w-full max-w-md p-8 text-center"
      >
        {phase !== "open" ? (
          <>
            <h2 className="text-xl font-bold text-primary">Daily treasure chest!</h2>
            <p className="mt-2 text-sm text-secondary">
              {streakDay}-day streak — you earned a {tier.toLowerCase()} chest
            </p>
            <div className="mt-8 flex justify-center">
              <ChestAnimation
                chest={{ date: "", streakDay, level: chestLevel, reward }}
                phase={phase}
                onOpen={handleOpen}
              />
            </div>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold uppercase tracking-wider text-accent">You got</p>
            <div className="mt-6">
              <RewardDisplay reward={reward} />
            </div>
            <button type="button" className="pp-btn-primary mt-8 w-full" onClick={onClaimed}>
              Awesome!
            </button>
          </>
        )}
      </div>
    </div>
  );
}
