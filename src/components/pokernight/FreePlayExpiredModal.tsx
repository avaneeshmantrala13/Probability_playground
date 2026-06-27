interface FreePlayExpiredModalProps {
  stillUnlocked: boolean;
  onDismiss: () => void;
}

export function FreePlayExpiredModal({ stillUnlocked, onDismiss }: FreePlayExpiredModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
        aria-hidden
        onClick={onDismiss}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="free-play-expired-title"
        className="pp-card relative z-10 w-full max-w-md p-8 text-center"
      >
        <p className="text-4xl" aria-hidden>
          ⏱️
        </p>
        <h2 id="free-play-expired-title" className="mt-4 text-xl font-extrabold text-primary">
          Free play time&apos;s up
        </h2>
        <p className="mt-2 text-secondary">
          {stillUnlocked
            ? "Your streak reward minutes are over, but you're still unlocked for today — sit down again anytime. Any tokens you won were added to your bankroll."
            : "Your streak reward minutes are over. Pass a Poker Theory lesson to unlock the table again, or check back tomorrow for a new daily reward."}
        </p>
        <button type="button" className="pp-btn-primary mt-6 w-full" onClick={onDismiss} autoFocus>
          {stillUnlocked ? "Keep playing" : "Got it"}
        </button>
      </div>
    </div>
  );
}
