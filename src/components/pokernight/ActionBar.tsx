import { useEffect, useState } from "react";
import type { Action, GameState, LegalActions } from "../../lib/poker";

interface ActionBarProps {
  state: GameState;
  legal: LegalActions;
  enabled: boolean;
  thinking: boolean;
  onAction: (action: Action) => void;
  /** Local human seat index (default 0 for single-player). */
  humanSeatIndex?: number;
}

function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

export function ActionBar({
  state,
  legal,
  enabled,
  thinking,
  onAction,
  humanSeatIndex = 0,
}: ActionBarProps) {
  const human = state.seats[humanSeatIndex] ?? state.seats[0];
  const canBetOrRaise = legal.canBet || legal.canRaise;
  const min = legal.minRaiseTo;
  const max = legal.maxRaiseTo;

  const [amount, setAmount] = useState(min);

  // Keep the slider within the current legal bounds whenever the turn changes.
  useEffect(() => {
    setAmount((a) => clamp(a, min, max));
  }, [min, max, state.handNumber, state.stage, state.toAct]);

  const verb = legal.canBet ? "Bet" : "Raise";
  const sizeTo = (fraction: number): number => {
    const inc = Math.round(state.pot * fraction);
    const base = state.currentBet > 0 ? state.currentBet : human.roundBet;
    return clamp(base + Math.max(state.config.bigBlind, inc), min, max);
  };

  if (!enabled) {
    return (
      <div className="pp-card flex items-center justify-center gap-3 p-4 text-sm text-secondary">
        {state.stage === "complete" ? (
          <span>Hand complete.</span>
        ) : thinking ? (
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent" />
            {state.toAct != null ? `${state.seats[state.toAct].name} is thinking…` : "Waiting…"}
          </span>
        ) : (
          <span>Waiting for your turn…</span>
        )}
      </div>
    );
  }

  const costToAct = Math.max(0, amount - human.roundBet);

  return (
    <div className="pp-card space-y-3 p-4">
      <p className="text-sm font-semibold text-primary">Your move</p>

      <div className="flex flex-wrap gap-2">
        {legal.canFold && (
          <button
            type="button"
            className="pp-btn-secondary flex-1"
            onClick={() => onAction({ type: "fold" })}
          >
            Fold
          </button>
        )}
        {legal.canCheck && (
          <button
            type="button"
            className="pp-btn-secondary flex-1"
            onClick={() => onAction({ type: "check" })}
          >
            Check
          </button>
        )}
        {legal.canCall && (
          <button
            type="button"
            className="pp-btn-primary flex-1"
            onClick={() => onAction({ type: "call" })}
          >
            Call {legal.callAmount.toLocaleString()}
          </button>
        )}
        {canBetOrRaise && (
          <button
            type="button"
            className="pp-btn-primary flex-1"
            onClick={() => onAction({ type: legal.canBet ? "bet" : "raise", amount })}
          >
            {amount >= max ? "All-in" : `${verb} to ${amount.toLocaleString()}`}
          </button>
        )}
      </div>

      {canBetOrRaise && max > min && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <input
              type="range"
              className="pp-range flex-1"
              min={min}
              max={max}
              step={Math.max(1, state.config.smallBlind)}
              value={amount}
              onChange={(e) => setAmount(clamp(Number(e.target.value), min, max))}
              aria-label="Bet size"
            />
            <span className="w-20 text-right font-mono text-sm tabular-nums text-primary">
              {amount.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <button type="button" className="pp-btn-secondary px-2.5 py-1" onClick={() => setAmount(min)}>
              Min
            </button>
            <button type="button" className="pp-btn-secondary px-2.5 py-1" onClick={() => setAmount(sizeTo(0.5))}>
              ½ Pot
            </button>
            <button type="button" className="pp-btn-secondary px-2.5 py-1" onClick={() => setAmount(sizeTo(1))}>
              Pot
            </button>
            <button type="button" className="pp-btn-secondary px-2.5 py-1" onClick={() => setAmount(max)}>
              All-in
            </button>
            <span className="ml-auto self-center text-muted">
              Costs {costToAct.toLocaleString()} to act
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
