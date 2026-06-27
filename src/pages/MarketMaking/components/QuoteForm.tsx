import { useState, type FormEvent } from "react";
import type { Quote } from "../../../lib/marketMaking";

interface QuoteFormProps {
  onSubmit: (quote: Quote) => void;
  disabled?: boolean;
  initial?: Quote;
}

export function QuoteForm({ onSubmit, disabled, initial }: QuoteFormProps) {
  const [bid, setBid] = useState(initial ? String(initial.bid) : "");
  const [ask, setAsk] = useState(initial ? String(initial.ask) : "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const b = parseFloat(bid);
    const a = parseFloat(ask);
    if (Number.isNaN(b) || Number.isNaN(a)) return;
    onSubmit({ bid: b, ask: a });
  }

  return (
    <form className="mm-quote-form" onSubmit={handleSubmit}>
      <div>
        <label className="pp-label" htmlFor="mm-bid">
          Bid (you buy)
        </label>
        <input
          id="mm-bid"
          type="number"
          step="0.25"
          className="pp-input"
          value={bid}
          onChange={(e) => setBid(e.target.value)}
          disabled={disabled}
          required
        />
      </div>
      <div>
        <label className="pp-label" htmlFor="mm-ask">
          Ask (you sell)
        </label>
        <input
          id="mm-ask"
          type="number"
          step="0.25"
          className="pp-input"
          value={ask}
          onChange={(e) => setAsk(e.target.value)}
          disabled={disabled}
          required
        />
      </div>
      <div className="sm:col-span-2">
        <button type="submit" className="pp-btn-primary w-full sm:w-auto" disabled={disabled}>
          Submit quote
        </button>
      </div>
    </form>
  );
}
