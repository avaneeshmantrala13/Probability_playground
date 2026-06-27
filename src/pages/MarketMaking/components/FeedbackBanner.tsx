import type { QuoteFeedback } from "../../../lib/marketMaking";
import { formatFair } from "../../../lib/marketMaking";

interface FeedbackBannerProps {
  feedback: QuoteFeedback | null;
  successMessage?: string;
  showFair?: boolean;
}

export function FeedbackBanner({ feedback, successMessage, showFair = true }: FeedbackBannerProps) {
  if (!feedback) return null;

  if (feedback.ok) {
    return (
      <div className="mm-feedback mm-feedback--ok" role="status">
        {successMessage ?? "Solid quote!"}
        {showFair && (
          <span>
            {" "}
            (mid {formatFair(feedback.mid)}, spread {formatFair(feedback.spread)}, fair{" "}
            {formatFair(feedback.fairValue)})
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="mm-feedback mm-feedback--err" role="alert">
      <strong>Adjust your quote:</strong>
      <ul>
        {feedback.messages.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
    </div>
  );
}
