import { useState } from "react";
import { Link } from "react-router-dom";
import {
  LEARN_LEVEL,
  TUTORIALS,
  validateQuoteForTutorial,
  type Quote,
  type QuoteFeedback,
} from "../../lib/marketMaking";
import { FeedbackBanner } from "./components/FeedbackBanner";
import { QuoteForm } from "./components/QuoteForm";
import { ScenarioPanel } from "./components/ScenarioPanel";
import "../marketMaking.css";

export function LearnMode() {
  const [stepIndex, setStepIndex] = useState(0);
  const [feedback, setFeedback] = useState<QuoteFeedback | null>(null);
  const [cleared, setCleared] = useState(false);

  const step = TUTORIALS[stepIndex];
  const isLast = stepIndex >= TUTORIALS.length - 1;

  function handleQuote(quote: Quote) {
    const result = validateQuoteForTutorial(
      quote,
      step.scenario.fairValue,
      step.checks,
      LEARN_LEVEL,
    );
    setFeedback(result);
    if (result.ok) setCleared(true);
  }

  function goNext() {
    if (!cleared) return;
    setFeedback(null);
    setCleared(false);
    if (!isLast) setStepIndex((i) => i + 1);
  }

  function goPrev() {
    setFeedback(null);
    setCleared(false);
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  }

  if (isLast && cleared) {
    return (
      <div className="mm-page">
        <Link to="/market-making" className="mm-back">
          ← Market Making
        </Link>
        <div className="pp-card p-8 text-center">
          <span className="text-4xl" aria-hidden>
            🎯
          </span>
          <h1 className="mt-4 text-2xl font-extrabold text-primary">Tutorial complete!</h1>
          <p className="mx-auto mt-2 max-w-md text-secondary">
            You&apos;ve worked through bid/ask basics, spreads, conditional dice, coins, and cards.
            Ready for Play Mode?
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/market-making/play" className="pp-btn-primary">
              Play Mode
            </Link>
            <Link to="/market-making" className="pp-btn-secondary">
              Back to hub
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mm-page">
      <Link to="/market-making" className="mm-back">
        ← Market Making
      </Link>

      <header className="mm-header">
        <h1>Learn Mode</h1>
        <p className="text-sm text-muted">
          Step {stepIndex + 1} of {TUTORIALS.length}
        </p>
      </header>

      <div className="pp-card p-5">
        <h2 className="text-lg font-bold text-primary">{step.title}</h2>
        <p className="mt-2 text-sm text-secondary">{step.body}</p>
      </div>

      <div className="mt-4 space-y-4">
        <ScenarioPanel scenario={step.scenario} showFair />
        <div className="pp-card p-5">
          <h3 className="font-semibold text-primary">Your quote</h3>
          <div className="mt-3">
            <QuoteForm onSubmit={handleQuote} disabled={cleared} />
          </div>
          <FeedbackBanner
            feedback={feedback}
            successMessage={
              step.hint
                ? `Nice! Example quote: ${step.hint.bid} / ${step.hint.ask}.`
                : undefined
            }
          />
        </div>
      </div>

      <div className="mm-step-nav">
        <button
          type="button"
          className="pp-btn-secondary"
          onClick={goPrev}
          disabled={stepIndex === 0}
        >
          Previous
        </button>
        <span className="mm-progress">
          {cleared ? "Step cleared — continue when ready" : "Submit a valid quote to continue"}
        </span>
        <button type="button" className="pp-btn-primary" onClick={goNext} disabled={!cleared}>
          {isLast ? "Finish" : "Next step"}
        </button>
      </div>
    </div>
  );
}
