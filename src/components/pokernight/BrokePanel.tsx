interface BrokePanelProps {
  onComeback: () => void;
}

export function BrokePanel({ onComeback }: BrokePanelProps) {
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
        <div className="mt-6">
          <button type="button" className="pp-btn-primary" onClick={onComeback}>
            Find a comeback
          </button>
        </div>
      </div>
    </div>
  );
}
