import { Link } from "react-router-dom";
import { ChevronRightIcon } from "../../components/icons";
import "../marketMaking.css";

export function MarketMakingHub() {
  return (
    <div className="mm-page">
      <header className="mm-header">
        <h1>Market Making Games</h1>
        <p>
          Practice Jane Street–style interview puzzles: quote bid/ask markets on dice, coins, and
          cards. Learn the fundamentals, then face progressively sharper AI counterparties.
        </p>
      </header>

      <div className="mm-grid mm-grid-2 lg:grid-cols-3">
        <Link to="/market-making/lessons" className="mm-card-link group">
          <div className="mm-icon-wrap" aria-hidden>
            🎓
          </div>
          <div>
            <h2 className="text-lg font-bold text-primary">Structured Lessons</h2>
            <p className="mt-1.5 text-sm text-secondary">
              Mastery-based course on bid/ask, spread, fair value, inventory, and
              interview-style puzzles. AI tutor and bonus questions included.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent">
            Start course
            <ChevronRightIcon size={16} />
          </span>
        </Link>

        <Link to="/market-making/learn" className="mm-card-link group">
          <div className="mm-icon-wrap" aria-hidden>
            📚
          </div>
          <div>
            <h2 className="text-lg font-bold text-primary">Learn Mode</h2>
            <p className="mt-1.5 text-sm text-secondary">
              Step-by-step tutorials with instant feedback. See fair value, fix your spread, and
              build intuition before going live.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent">
            Start learning
            <ChevronRightIcon size={16} />
          </span>
        </Link>

        <Link to="/market-making/play" className="mm-card-link group">
          <div className="mm-icon-wrap" aria-hidden>
            ⚡
          </div>
          <div>
            <h2 className="text-lg font-bold text-primary">Play Mode</h2>
            <p className="mt-1.5 text-sm text-secondary">
              No hints. Quote against an AI counterparty across Beginner → Hard, then firm-themed
              levels from Jane Street to Optiver.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent">
            Enter the pit
            <ChevronRightIcon size={16} />
          </span>
        </Link>
      </div>

      <div className="pp-card mt-6 p-5">
        <h3 className="font-bold text-primary">What you&apos;ll practice</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-secondary">
          <li>Expected value for dice sums, coin flips, and card draws</li>
          <li>Two-sided quoting: bid/ask spread and centering on fair value</li>
          <li>Updating quotes when partial information is revealed</li>
          <li>Inventory-aware skew under time pressure</li>
        </ul>
      </div>

    </div>
  );
}
