import type { GameState } from "../../lib/poker";

interface HandResultBannerProps {
  state: GameState;
  canDeal: boolean;
  onNext: () => void;
  /** Local human seat index — drives the "you won/lost" line (default 0). */
  humanSeatIndex?: number;
}

export function HandResultBanner({ state, canDeal, onNext, humanSeatIndex = 0 }: HandResultBannerProps) {
  const result = state.result;
  if (!result) return null;

  const humanNet = result.netBySeat[humanSeatIndex] ?? 0;
  const winnerNames = Array.from(
    new Set(result.pots.flatMap((p) => p.winners.map((w) => state.seats[w]?.name).filter(Boolean))),
  );
  const descr = result.pots.find((p) => p.descr)?.descr;

  const tone =
    humanNet > 0
      ? "border-success/60 bg-success-soft"
      : humanNet < 0
      ? "border-danger/50 bg-danger-soft"
      : "border";

  return (
    <div className={`pp-card flex flex-wrap items-center justify-between gap-3 p-4 ${tone}`}>
      <div>
        <p className="font-bold text-primary">
          {winnerNames.join(", ")} {winnerNames.length > 1 ? "split" : "wins"} the pot
          {result.uncontested ? " (uncontested)" : ""}.
        </p>
        <p className="text-sm text-secondary">
          {descr && !result.uncontested ? `Winning hand: ${descr}. ` : ""}
          {humanNet > 0
            ? `You won ${humanNet.toLocaleString()} tokens this hand! 🎉`
            : humanNet < 0
            ? `You lost ${Math.abs(humanNet).toLocaleString()} tokens this hand.`
            : "You broke even this hand."}
        </p>
      </div>
      {canDeal && (
        <button type="button" className="pp-btn-primary" onClick={onNext}>
          Next hand
        </button>
      )}
    </div>
  );
}
