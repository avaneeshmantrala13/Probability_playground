import { useState } from "react";
import type { TableTier } from "../../lib/tokens";

interface RebuyPanelProps {
  tier: TableTier;
  bankroll: number;
  onRebuy: (amount: number) => void;
  onLeave: () => void;
}

function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

export function RebuyPanel({ tier, bankroll, onRebuy, onLeave }: RebuyPanelProps) {
  const max = Math.min(tier.maxBuyIn, bankroll);
  const min = Math.min(tier.minBuyIn, max);
  const [amount, setAmount] = useState(min);

  return (
    <div className="pp-card space-y-3 p-4">
      <div>
        <h3 className="font-bold text-primary">You busted your stack</h3>
        <p className="text-sm text-secondary">
          Top up from your bankroll ({bankroll.toLocaleString()} 🪙) to keep
          playing at {tier.name}, or take a break.
        </p>
      </div>
      <div className="flex items-center justify-between">
        <span className="pp-label mb-0">Rebuy amount</span>
        <span className="font-mono text-sm font-semibold text-primary">
          {amount.toLocaleString()} 🪙
        </span>
      </div>
      <input
        type="range"
        className="pp-range w-full"
        min={min}
        max={Math.max(min, max)}
        step={tier.bigBlind}
        value={amount}
        onChange={(e) => setAmount(clamp(Number(e.target.value), min, max))}
        aria-label="Rebuy amount"
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" className="pp-btn-primary flex-1" onClick={() => onRebuy(amount)}>
          Rebuy {amount.toLocaleString()}
        </button>
        <button type="button" className="pp-btn-secondary" onClick={onLeave}>
          Leave table
        </button>
      </div>
    </div>
  );
}
