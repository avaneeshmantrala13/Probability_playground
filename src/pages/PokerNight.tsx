import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useProgress } from "../context/ProgressContext";
import {
  isPokerNightUnlocked,
  lessonsRemainingForPoker,
  TABLE_TIERS,
  type TableTier,
} from "../lib/tokens";
import { getDeckSkin, getTableTheme } from "../lib/cosmetics";
import {
  pickPersonas,
  type GameConfig,
  type HandResult,
} from "../lib/poker";
import { useReducedMotion } from "../components/pokernight/useReducedMotion";
import { usePokerGame } from "../components/pokernight/usePokerGame";
import { ActionBar } from "../components/pokernight/ActionBar";
import { Lobby } from "../components/pokernight/Lobby";
import { LockedScreen } from "../components/pokernight/LockedScreen";
import { BrokePanel } from "../components/pokernight/BrokePanel";
import { RebuyPanel } from "../components/pokernight/RebuyPanel";
import { HandResultBanner } from "../components/pokernight/HandResultBanner";

// The immersive casino scene (perspective room, seated SVG figures, standing
// dealer, all its CSS) is the only heavy piece of Poker Night. It's lazy-loaded
// so it ships as its own chunk and never bloats the rest of the app's bundle —
// it loads only once the player actually sits down at the in-game table.
const PokerTable = lazy(() => import("../components/pokernight/PokerTable"));

export function PokerNight() {
  const { progress, loading, seedPokerTokens } = useProgress();

  // Grant the one-time starting stake as soon as the capstone is available.
  useEffect(() => {
    if (!loading && isPokerNightUnlocked(progress)) seedPokerTokens();
  }, [loading, progress, seedPokerTokens]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <p className="text-center text-muted">Loading…</p>
      </div>
    );
  }

  if (!isPokerNightUnlocked(progress)) {
    return <LockedScreen lessonsRemaining={lessonsRemainingForPoker(progress)} />;
  }

  return <PokerNightUnlocked />;
}

export default PokerNight;

function PokerNightUnlocked() {
  const { progress, addTokens, spendTokens } = useProgress();
  const [seat, setSeat] = useState<{ tier: TableTier; buyIn: number; key: number } | null>(
    null,
  );

  const handleSit = (tier: TableTier, buyIn: number) => {
    if (!spendTokens(buyIn)) return;
    setSeat({ tier, buyIn, key: Date.now() });
  };

  const handleCashOut = (finalStack: number) => {
    if (finalStack > 0) addTokens(finalStack);
    setSeat(null);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
          Poker Night
        </h1>
        <p className="mt-1 max-w-2xl text-secondary">
          Your capstone reward. Put your probability skills to the test against
          math-driven bots in no-limit Texas Hold'em.
        </p>
      </header>

      {seat ? (
        <PokerSession
          key={seat.key}
          tier={seat.tier}
          buyIn={seat.buyIn}
          bankroll={progress.tokens ?? 0}
          onCashOut={handleCashOut}
          deckSkinId={progress.equipped?.deckSkin ?? "deck-classic"}
          tableThemeId={progress.equipped?.tableTheme ?? "table-classic-green"}
        />
      ) : (
        <Lobby bankroll={progress.tokens ?? 0} onSit={handleSit} />
      )}
    </div>
  );
}

interface PokerSessionProps {
  tier: TableTier;
  buyIn: number;
  bankroll: number;
  onCashOut: (finalStack: number) => void;
  deckSkinId: string;
  tableThemeId: string;
}

type Phase = "playing" | "busted" | "broke";

function PokerSession({
  tier,
  buyIn,
  bankroll,
  onCashOut,
  deckSkinId,
  tableThemeId,
}: PokerSessionProps) {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const { recordPokerHand, spendTokens, addTokens } = useProgress();

  const deck = getDeckSkin(deckSkinId);
  const theme = getTableTheme(tableThemeId);

  const [phase, setPhase] = useState<Phase>("playing");
  const bankrollRef = useRef(bankroll);
  bankrollRef.current = bankroll;

  const config: GameConfig = {
    smallBlind: tier.smallBlind,
    bigBlind: tier.bigBlind,
    botSkill: tier.botSkill,
    botStack: Math.max(tier.minBuyIn, Math.min(tier.maxBuyIn, buyIn)),
  };

  // Personas are picked once for the lifetime of this session.
  const personasRef = useRef(pickPersonas(tier.opponents));

  const handleHandEnd = (info: { result: HandResult; humanStack: number }) => {
    const won = (info.result.netBySeat[0] ?? 0) > 0;
    recordPokerHand({
      won,
      potSize: info.result.totalPot,
      busted: info.humanStack === 0,
    });

    if (info.humanStack === 0) {
      const bank = bankrollRef.current;
      if (bank < TABLE_TIERS[0].minBuyIn) {
        setPhase("broke");
      } else if (bank < tier.minBuyIn) {
        // Can't rebuy this table — cash out the (empty) stack and head back.
        onCashOut(0);
      } else {
        setPhase("busted");
      }
    } else {
      setPhase("playing");
    }
  };

  const game = usePokerGame({
    config,
    humanName: "You",
    humanStack: buyIn,
    personas: personasRef.current,
    reduced,
    onHandEnd: handleHandEnd,
  });

  const {
    state,
    legal,
    isHumanTurn,
    humanSeat,
    humanEquity,
    thinking,
    speeches,
    act,
    dealNext,
    rebuy,
  } = game;

  const handComplete = state.stage === "complete";

  const handleNext = () => {
    setPhase("playing");
    dealNext();
  };

  const handleRebuy = (amount: number) => {
    if (!spendTokens(amount)) return;
    rebuy(amount);
    setPhase("playing");
    dealNext();
  };

  const handleLeave = () => {
    onCashOut(humanSeat.stack);
  };

  const handleComeback = () => {
    // Cash out whatever's left (likely 0), then route to the comeback flow.
    if (humanSeat.stack > 0) addTokens(humanSeat.stack);
    navigate("/comeback");
  };

  if (phase === "broke") {
    return <BrokePanel onComeback={handleComeback} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="pp-card px-3 py-1.5 font-semibold text-primary">
            {tier.name}
          </span>
          <span className="pp-card px-3 py-1.5 text-secondary">
            Blinds {tier.smallBlind}/{tier.bigBlind}
          </span>
          <span className="pp-card px-3 py-1.5 text-primary">
            Stack:{" "}
            <span className="font-mono font-semibold text-accent">
              {humanSeat.stack.toLocaleString()}
            </span>
          </span>
          <span className="pp-card px-3 py-1.5 text-primary">
            Bankroll:{" "}
            <span className="font-mono font-semibold">{bankroll.toLocaleString()}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/store" className="pp-btn-secondary">
            Store
          </Link>
          <button
            type="button"
            className="pp-btn-secondary"
            onClick={handleLeave}
            disabled={!handComplete}
            title={handComplete ? "Cash out and leave" : "You can leave between hands"}
          >
            Leave table
          </button>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center rounded-2xl bg-black/40 py-24 text-sm text-muted">
            Entering the casino…
          </div>
        }
      >
        <PokerTable
          state={state}
          deck={deck}
          theme={theme}
          reduced={reduced}
          speeches={speeches}
        />
      </Suspense>

      {handComplete && phase === "busted" ? (
        <RebuyPanel
          tier={tier}
          bankroll={bankroll}
          onRebuy={handleRebuy}
          onLeave={handleLeave}
        />
      ) : handComplete ? (
        <HandResultBanner state={state} canDeal onNext={handleNext} />
      ) : (
        <ActionBar
          state={state}
          legal={legal}
          enabled={isHumanTurn}
          humanEquity={humanEquity}
          thinking={thinking}
          onAction={act}
        />
      )}
    </div>
  );
}
