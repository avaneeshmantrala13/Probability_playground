import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import {
  LEVELS,
  formatFair,
  getLevel,
  isLevelCleared,
  pickScenarioForPool,
  resolveTrade,
  validateQuote,
  type LevelConfig,
  type Quote,
  type QuoteFeedback,
  type Scenario,
  type TradeResult,
} from "../../lib/marketMaking";
import { FeedbackBanner } from "./components/FeedbackBanner";
import { LevelPicker } from "./components/LevelPicker";
import { QuoteForm } from "./components/QuoteForm";
import { ScenarioPanel } from "./components/ScenarioPanel";
import { TimerBar } from "./components/TimerBar";
import "../marketMaking.css";

export function PlayMode() {
  const [levelId, setLevelId] = useState("beginner");
  const [phase, setPhase] = useState<"pick" | "play" | "won">("pick");
  const level = getLevel(levelId)!;

  if (phase === "pick") {
    return (
      <div className="mm-page">
        <Link to="/market-making" className="mm-back">
          ← Market Making
        </Link>
        <header className="mm-header">
          <h1>Play Mode</h1>
          <p>Choose a level. Quote fast, stay centered on fair value, and manage your P&amp;L.</p>
        </header>
        <LevelPicker levels={LEVELS} selectedId={levelId} onSelect={setLevelId} />
        <div className="mt-6">
          <button type="button" className="pp-btn-primary" onClick={() => setPhase("play")}>
            Start {level.name}
          </button>
        </div>
      </div>
    );
  }

  if (phase === "won") {
    return (
      <div className="mm-page">
        <div className="pp-card p-8 text-center">
          <span className="text-4xl" aria-hidden>
            🏆
          </span>
          <h1 className="mt-4 text-2xl font-extrabold text-primary">{level.name} cleared!</h1>
          <p className="mx-auto mt-2 max-w-md text-secondary">
            You hit the P&amp;L target with solid quotes. Try the next level or replay this one.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button type="button" className="pp-btn-primary" onClick={() => setPhase("pick")}>
              Choose level
            </button>
            <Link to="/market-making" className="pp-btn-secondary">
              Hub
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <PlaySession level={level} onWin={() => setPhase("won")} onQuit={() => setPhase("pick")} />;
}

interface PlaySessionProps {
  level: LevelConfig;
  onWin: () => void;
  onQuit: () => void;
}

function PlaySession({ level, onWin, onQuit }: PlaySessionProps) {
  const [round, setRound] = useState(1);
  const [pnl, setPnl] = useState(0);
  const [inventory, setInventory] = useState(0);
  const [validQuotes, setValidQuotes] = useState(0);
  const [scenario, setScenario] = useState<Scenario>(() =>
    pickScenarioForPool(level.scenarioPool),
  );
  const [feedback, setFeedback] = useState<QuoteFeedback | null>(null);
  const [trade, setTrade] = useState<TradeResult | null>(null);
  const [locked, setLocked] = useState(false);
  const [key, setKey] = useState(0);

  const nextRound = useCallback(() => {
    setScenario(pickScenarioForPool(level.scenarioPool));
    setFeedback(null);
    setTrade(null);
    setLocked(false);
    setRound((r) => r + 1);
    setKey((k) => k + 1);
  }, [level.scenarioPool]);

  const handleExpire = useCallback(() => {
    if (locked) return;
    setLocked(true);
    setFeedback({
      ok: false,
      issues: ["mid_off_fair"],
      messages: ["Time's up — in interviews you must quote quickly. Review fair value and retry."],
      fairValue: scenario.fairValue,
      mid: 0,
      spread: 0,
    });
  }, [locked, scenario.fairValue]);

  function handleQuote(quote: Quote) {
    if (locked) return;

    const result = validateQuote(quote, scenario.fairValue, level, inventory, level.inventorySkew);
    setFeedback(result);

    if (!result.ok) return;

    setLocked(true);
    setValidQuotes((v) => v + 1);

    const tradeResult = resolveTrade(quote, scenario, level, inventory);
    setTrade(tradeResult);
    setPnl((p) => p + tradeResult.pnl);

    if (tradeResult.side === "buy") setInventory((i) => i - 1);
    if (tradeResult.side === "sell") setInventory((i) => i + 1);

    const newRound = round;
    const newPnl = pnl + tradeResult.pnl;
    const newValid = validQuotes + 1;

    if (isLevelCleared(level, newRound, newPnl, newValid)) {
      setTimeout(onWin, 1500);
    }
  }

  return (
    <div className="mm-page">
      <Link to="/market-making" className="mm-back">
        ← Market Making
      </Link>

      <header className="mm-header">
        <h1>{level.name}</h1>
        <p className="text-sm text-secondary">{level.description}</p>
      </header>

      <div className="mm-hud">
        <div className="mm-stat">
          <div className="mm-stat-label">Round</div>
          <div className="mm-stat-value">
            {round}/{level.roundsToClear}
          </div>
        </div>
        <div className="mm-stat">
          <div className="mm-stat-label">P&amp;L</div>
          <div className="mm-stat-value">{formatFair(pnl)}</div>
        </div>
        <div className="mm-stat">
          <div className="mm-stat-label">Target</div>
          <div className="mm-stat-value">{formatFair(level.pnlTarget)}</div>
        </div>
        <div className="mm-stat">
          <div className="mm-stat-label">Inventory</div>
          <div className="mm-stat-value">{inventory}</div>
        </div>
      </div>

      <TimerBar key={key} seconds={level.roundSeconds} onExpire={handleExpire} paused={locked} />

      <ScenarioPanel scenario={scenario} />

      <div className="pp-card mt-4 p-5">
        <h3 className="font-semibold text-primary">Quote your market</h3>
        <div className="mt-3">
          <QuoteForm onSubmit={handleQuote} disabled={locked} />
        </div>
        <FeedbackBanner feedback={feedback} showFair={false} successMessage="Quote accepted — resolving trade…" />
        {trade && (
          <div className="mm-trade-result">
            <strong>
              {trade.side === "pass" ? "Pass" : trade.side === "buy" ? "Sold to counterparty" : "Bought from counterparty"}
            </strong>
            <p className="mt-1">{trade.explanation}</p>
          </div>
        )}
        {locked && (
          <div className="mt-4">
            <button type="button" className="pp-btn-primary" onClick={nextRound}>
              Next round
            </button>
          </div>
        )}
      </div>

      <div className="mt-4">
        <button type="button" className="pp-btn-secondary text-sm" onClick={onQuit}>
          Change level
        </button>
      </div>
    </div>
  );
}
