import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  formatUsd,
  multiplayerBuyInPriceCents,
  SP_TOKEN_PACK_AMOUNT,
  SP_TOKEN_PACK_PRICE_CENTS,
  type CheckoutKind,
} from "../../lib/payments/pricing";
import { startCheckout, isStripeConfigured } from "../../lib/payments/checkout";

interface TokenPurchaseModalProps {
  kind: CheckoutKind;
  tokenAmount?: number;
  roomId?: string;
  onClose: () => void;
}

export function TokenPurchaseModal({
  kind,
  tokenAmount = SP_TOKEN_PACK_AMOUNT,
  roomId,
  onClose,
}: TokenPurchaseModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const priceCents =
    kind === "sp_tokens" ? SP_TOKEN_PACK_PRICE_CENTS : multiplayerBuyInPriceCents(tokenAmount);
  const label =
    kind === "sp_tokens"
      ? `${SP_TOKEN_PACK_AMOUNT.toLocaleString()} tokens`
      : `${tokenAmount.toLocaleString()} token buy-in`;

  const handlePurchase = async () => {
    if (!user) {
      setError("Sign in to purchase tokens.");
      return;
    }
    if (!isStripeConfigured()) {
      setError("Stripe is not configured yet. See PAYMENTS.md.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await startCheckout({
      kind,
      tokenAmount: kind === "sp_tokens" ? SP_TOKEN_PACK_AMOUNT : tokenAmount,
      roomId,
      buyIn: tokenAmount,
    });
    if (!result.ok) setError(result.error);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="pp-card w-full max-w-md p-6" role="dialog" aria-labelledby="purchase-title">
        <h2 id="purchase-title" className="text-lg font-bold text-primary">
          Out of tokens?
        </h2>
        <p className="mt-2 text-sm text-secondary">
          Buy {label} for {formatUsd(priceCents)} via Stripe (test mode).
        </p>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button type="button" className="pp-btn-secondary flex-1" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="pp-btn-primary flex-1"
            disabled={loading}
            onClick={handlePurchase}
          >
            {loading ? "Redirecting…" : `Pay ${formatUsd(priceCents)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
