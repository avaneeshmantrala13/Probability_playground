interface BrokePanelProps {
  onComeback: () => void;
  onBuyTokens?: () => void;
}

export function BrokePanel({ onComeback, onBuyTokens }: BrokePanelProps) {
  return (
    <div className="mx-auto max-w-xl">
      <div className="pp-card p-8 text-center">
        <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-2xl">
          😵
        </span>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-primary">
          You're broke
        </h1>
        <p className="mx-auto mt-2 max-w-md text-secondary">
          Your bankroll is empty and you can't cover the lowest buy-in. Don't
          sweat it — there's a way back to the felt.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button type="button" className="pp-btn-primary" onClick={onComeback}>
            Find a comeback
          </button>
          {onBuyTokens && (
            <button type="button" className="pp-btn-secondary" onClick={onBuyTokens}>
              Buy 1,000 tokens · $0.99
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
