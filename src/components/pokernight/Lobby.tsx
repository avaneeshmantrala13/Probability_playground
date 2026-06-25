import { useState } from "react";
import { Link } from "react-router-dom";
import { TABLE_TIERS, type TableTier } from "../../lib/tokens";

interface LobbyProps {
  bankroll: number;
  onSit: (tier: TableTier, buyIn: number) => void;
}

function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

export function Lobby({ bankroll, onSit }: LobbyProps) {
  const affordableDefault =
    TABLE_TIERS.find((t) => bankroll >= t.minBuyIn) ?? TABLE_TIERS[0];
  const [selectedId, setSelectedId] = useState(affordableDefault.id);
  const tier = TABLE_TIERS.find((t) => t.id === selectedId) ?? affordableDefault;

  const maxAffordable = Math.min(tier.maxBuyIn, bankroll);
  const canAfford = bankroll >= tier.minBuyIn;
  const [buyIn, setBuyIn] = useState(
    clamp(tier.minBuyIn, tier.minBuyIn, Math.max(tier.minBuyIn, maxAffordable)),
  );

  const handleSelect = (t: TableTier) => {
    setSelectedId(t.id);
    const top = Math.min(t.maxBuyIn, bankroll);
    setBuyIn(clamp(t.minBuyIn, t.minBuyIn, Math.max(t.minBuyIn, top)));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-primary">Pick your table</h2>
          <p className="text-sm text-secondary">
            Buy in with tokens from your bankroll. Cash out anytime.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="pp-card px-3 py-2 text-sm font-semibold text-primary">
            Bankroll: <span className="text-accent">{bankroll.toLocaleString()}</span> 🪙
          </span>
          <Link to="/store" className="pp-btn-secondary">
            Visit Store
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {TABLE_TIERS.map((t) => {
          const affordable = bankroll >= t.minBuyIn;
          const active = t.id === selectedId;
          return (
            <button
              key={t.id}
              type="button"
              disabled={!affordable}
              onClick={() => handleSelect(t)}
              className={`pp-card p-4 text-left transition-all ${
                active ? "ring-2 ring-accent" : "hover:border-accent"
              } ${!affordable ? "opacity-50" : ""}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-primary">{t.name}</h3>
                <span className="text-xs font-semibold text-muted">
                  {t.smallBlind}/{t.bigBlind}
                </span>
              </div>
              <p className="mt-1 text-sm text-secondary">{t.blurb}</p>
              <dl className="mt-3 space-y-1 text-xs text-muted">
                <div className="flex justify-between">
                  <dt>Buy-in</dt>
                  <dd>
                    {t.minBuyIn.toLocaleString()}–{t.maxBuyIn.toLocaleString()}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Opponents</dt>
                  <dd>{t.opponents} bots</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Skill</dt>
                  <dd>{Math.round(t.botSkill * 100)}%</dd>
                </div>
              </dl>
              {!affordable && (
                <p className="mt-2 text-xs font-semibold text-danger">
                  Need {t.minBuyIn.toLocaleString()} to sit
                </p>
              )}
            </button>
          );
        })}
      </div>

      <div className="pp-card space-y-3 p-4">
        <div className="flex items-center justify-between">
          <span className="pp-label mb-0">Buy-in amount</span>
          <span className="font-mono text-sm font-semibold text-primary">
            {buyIn.toLocaleString()} 🪙
          </span>
        </div>
        <input
          type="range"
          className="pp-range w-full"
          min={tier.minBuyIn}
          max={Math.max(tier.minBuyIn, maxAffordable)}
          step={tier.bigBlind}
          value={buyIn}
          disabled={!canAfford}
          onChange={(e) => setBuyIn(clamp(Number(e.target.value), tier.minBuyIn, maxAffordable))}
          aria-label="Buy-in amount"
        />
        <button
          type="button"
          className="pp-btn-primary w-full"
          disabled={!canAfford}
          onClick={() => onSit(tier, buyIn)}
        >
          {canAfford
            ? `Sit at ${tier.name} for ${buyIn.toLocaleString()}`
            : `Can't afford ${tier.name}`}
        </button>
      </div>
    </div>
  );
}
