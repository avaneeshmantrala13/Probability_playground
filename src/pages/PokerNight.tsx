import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProgress } from "../context/ProgressContext";
import { completeCheckoutReturn } from "../lib/payments/checkoutReturn";
import {
  isPokerNightUnlocked,
  lessonsRemainingForPoker,
  TABLE_TIERS,
  type TableTier,
} from "../lib/tokens";
import { getDeckSkin, getTableTheme } from "../lib/cosmetics";
import { isMultiplayerUnlocked } from "../lib/multiplayer/access";
import {
  pickPersonas,
  type GameConfig,
  type HandResult,
} from "../lib/poker";
import { useReducedMotion } from "../components/pokernight/useReducedMotion";
import { usePokerGame } from "../components/pokernight/usePokerGame";
import { useMultiplayerGame } from "../components/pokernight/useMultiplayerGame";
import { ActionBar } from "../components/pokernight/ActionBar";
import { Lobby } from "../components/pokernight/Lobby";
import { LockedScreen } from "../components/pokernight/LockedScreen";
import { BrokePanel } from "../components/pokernight/BrokePanel";
import { RebuyPanel } from "../components/pokernight/RebuyPanel";
import { HandResultBanner } from "../components/pokernight/HandResultBanner";
import { MultiplayerGate } from "../components/pokernight/MultiplayerGate";
import { MultiplayerLobby } from "../components/pokernight/MultiplayerLobby";
import { TableChat } from "../components/pokernight/TableChat";
import { TokenPurchaseModal } from "../components/pokernight/TokenPurchaseModal";

const PokerTable = lazy(() => import("../components/pokernight/PokerTable"));

type Mode = "single" | "multiplayer";
type MpSession = { roomId: string; tier: TableTier; buyIn: number; key: number };

export function PokerNight() {
  const { progress, loading, seedPokerTokens } = useProgress();

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
  const { user } = useAuth();
  const { progress, addTokens, spendTokens, refetchProgress } = useProgress();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>("single");
  const [mpGatePassed, setMpGatePassed] = useState(() => isMultiplayerUnlocked(progress));
  const [seat, setSeat] = useState<{ tier: TableTier; buyIn: number; key: number } | null>(null);
  const [mpSession, setMpSession] = useState<MpSession | null>(null);
  const [checkoutMsg, setCheckoutMsg] = useState("");
  const checkoutHandled = useRef<string | null>(null);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    const sessionId = searchParams.get("session_id");

    if (checkout === "cancel") {
      setCheckoutMsg("Checkout cancelled.");
      return;
    }

    if (checkout !== "success" || !sessionId || !user) return;
    if (checkoutHandled.current === sessionId) return;
    checkoutHandled.current = sessionId;

    let cancelled = false;
    setCheckoutMsg("Payment successful — crediting tokens…");

    void (async () => {
      const result = await completeCheckoutReturn(sessionId);
      if (cancelled) return;

      if (result.ok) {
        await refetchProgress();
        if (cancelled) return;
        setCheckoutMsg(
          result.credited
            ? `+${result.tokenAmount.toLocaleString()} tokens added to your bankroll!`
            : `Your ${result.tokenAmount.toLocaleString()} tokens are ready.`,
        );
      } else {
        await refetchProgress();
        if (cancelled) return;
        setCheckoutMsg(result.error);
      }

      setSearchParams({}, { replace: true });
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, user, refetchProgress, setSearchParams]);

  const handleSit = (tier: TableTier, buyIn: number) => {
    if (!spendTokens(buyIn)) return;
    setSeat({ tier, buyIn, key: Date.now() });
  };

  const handleCashOut = (finalStack: number) => {
    if (finalStack > 0) addTokens(finalStack);
    setSeat(null);
  };

  const handleMpJoined = (roomId: string, tier: TableTier, buyIn: number) => {
    setMpSession({ roomId, tier, buyIn, key: Date.now() });
  };

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
          Poker Night
        </h1>
        <p className="mt-1 max-w-2xl text-secondary">
          Single-player bots or multiplayer with friends and public matchmaking.
        </p>
        {checkoutMsg && (
          <p className="mt-2 text-sm font-medium text-accent">{checkoutMsg}</p>
        )}
      </header>

      <div className="mb-4 inline-flex gap-1 rounded-xl bg-surface-muted p-1">
        <button
          type="button"
          onClick={() => setMode("single")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            mode === "single" ? "bg-surface text-accent shadow-card" : "text-secondary"
          }`}
        >
          Single player
        </button>
        <button
          type="button"
          onClick={() => setMode("multiplayer")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            mode === "multiplayer" ? "bg-surface text-accent shadow-card" : "text-secondary"
          }`}
        >
          Multiplayer
        </button>
      </div>

      {mode === "single" ? (
        seat ? (
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
        )
      ) : mpSession ? (
        <MultiplayerSession
          key={mpSession.key}
          roomId={mpSession.roomId}
          tier={mpSession.tier}
          buyIn={mpSession.buyIn}
          bankroll={progress.tokens ?? 0}
          onLeave={() => setMpSession(null)}
          deckSkinId={progress.equipped?.deckSkin ?? "deck-classic"}
          tableThemeId={progress.equipped?.tableTheme ?? "table-classic-green"}
        />
      ) : !mpGatePassed ? (
        <MultiplayerGate onUnlocked={() => setMpGatePassed(true)} />
      ) : (
        <MultiplayerLobby
          bankroll={progress.tokens ?? 0}
          onJoined={handleMpJoined}
          onLeave={() => setMode("single")}
        />
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
  const [showPurchase, setShowPurchase] = useState(false);
  const bankrollRef = useRef(bankroll);
  bankrollRef.current = bankroll;

  const config: GameConfig = {
    smallBlind: tier.smallBlind,
    bigBlind: tier.bigBlind,
    botSkill: tier.botSkill,
    botStack: Math.max(tier.minBuyIn, Math.min(tier.maxBuyIn, buyIn)),
  };

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
    expressions,
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
    if (!spendTokens(amount)) {
      setShowPurchase(true);
      return;
    }
    rebuy(amount);
    setPhase("playing");
    dealNext();
  };

  const handleLeave = () => {
    onCashOut(humanSeat.stack);
  };

  const handleComeback = () => {
    if (humanSeat.stack > 0) addTokens(humanSeat.stack);
    navigate("/comeback");
  };

  if (phase === "broke") {
    return (
      <>
        <BrokePanel onComeback={handleComeback} onBuyTokens={() => setShowPurchase(true)} />
        {showPurchase && (
          <TokenPurchaseModal kind="sp_tokens" onClose={() => setShowPurchase(false)} />
        )}
      </>
    );
  }

  return (
    <div className="space-y-4">
      <SessionHeader
        tier={tier}
        stack={humanSeat.stack}
        bankroll={bankroll}
        onLeave={handleLeave}
        leaveDisabled={!handComplete}
        onBuyTokens={() => setShowPurchase(true)}
      />

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
          expressions={expressions}
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

      {showPurchase && (
        <TokenPurchaseModal kind="sp_tokens" onClose={() => setShowPurchase(false)} />
      )}
    </div>
  );
}

interface MultiplayerSessionProps {
  roomId: string;
  tier: TableTier;
  buyIn: number;
  bankroll: number;
  onLeave: () => void;
  deckSkinId: string;
  tableThemeId: string;
}

function MultiplayerSession({
  roomId,
  tier,
  buyIn,
  bankroll,
  onLeave,
  deckSkinId,
  tableThemeId,
}: MultiplayerSessionProps) {
  const { user } = useAuth();
  const reduced = useReducedMotion();
  const { recordPokerHand, addTokens } = useProgress();
  const deck = getDeckSkin(deckSkinId);
  const theme = getTableTheme(tableThemeId);
  const mySeatIndexRef = useRef(0);

  const game = useMultiplayerGame({
    roomId,
    uid: user!.uid,
    tier,
    buyIn,
    reduced,
    onHandEnd: ({ result, humanStack }) => {
      recordPokerHand({
        won: (result.netBySeat[mySeatIndexRef.current] ?? 0) > 0,
        potSize: result.totalPot,
        busted: humanStack === 0,
      });
    },
  });

  mySeatIndexRef.current = game.mySeatIndex;

  const { room, state, legal, isHumanTurn, humanEquity, thinking, speeches, expressions, act, dealNext, mySeatIndex } = game;
  const handComplete = state.stage === "complete";
  const myStack = state.seats[mySeatIndex]?.stack ?? 0;

  const handleLeave = () => {
    addTokens(myStack);
    onLeave();
  };

  if (!room) {
    return <p className="text-muted">Connecting to table…</p>;
  }

  return (
    <div className="space-y-4">
      <SessionHeader
        tier={tier}
        stack={myStack}
        bankroll={bankroll}
        onLeave={handleLeave}
        leaveDisabled={!handComplete}
        badge="Multiplayer"
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
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
            expressions={expressions}
          />
        </Suspense>
        {user && <TableChat roomId={roomId} uid={user.uid} room={room} />}
      </div>
      {handComplete ? (
        <HandResultBanner state={state} canDeal onNext={dealNext} />
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

function SessionHeader({
  tier,
  stack,
  bankroll,
  onLeave,
  leaveDisabled,
  onBuyTokens,
  badge,
}: {
  tier: TableTier;
  stack: number;
  bankroll: number;
  onLeave: () => void;
  leaveDisabled: boolean;
  onBuyTokens?: () => void;
  badge?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {badge && (
          <span className="pp-card px-3 py-1.5 font-semibold text-accent">{badge}</span>
        )}
        <span className="pp-card px-3 py-1.5 font-semibold text-primary">{tier.name}</span>
        <span className="pp-card px-3 py-1.5 text-secondary">
          Blinds {tier.smallBlind}/{tier.bigBlind}
        </span>
        <span className="pp-card px-3 py-1.5 text-primary">
          Stack:{" "}
          <span className="font-mono font-semibold text-accent">{stack.toLocaleString()}</span>
        </span>
        <span className="pp-card px-3 py-1.5 text-primary">
          Bankroll:{" "}
          <span className="font-mono font-semibold">{bankroll.toLocaleString()}</span>
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {onBuyTokens && (
          <button type="button" className="pp-btn-secondary" onClick={onBuyTokens}>
            Buy tokens · $0.99
          </button>
        )}
        <Link to="/store" className="pp-btn-secondary">
          Store
        </Link>
        <button
          type="button"
          className="pp-btn-secondary"
          onClick={onLeave}
          disabled={leaveDisabled}
        >
          Leave table
        </button>
      </div>
    </div>
  );
}
