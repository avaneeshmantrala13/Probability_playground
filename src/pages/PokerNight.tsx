import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProgress } from "../context/ProgressContext";
import { completeCheckoutReturn } from "../lib/payments/checkoutReturn";
import {
  isPokerNightUnlocked,
  pokerNightLockMessage,
  TABLE_TIERS,
  type TableTier,
} from "../lib/tokens";
import { getDeckSkin, getTableTheme } from "../lib/cosmetics";
import { isMultiplayerUnlocked } from "../lib/multiplayer/access";
import {
  pickPersonasForTier,
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
import { FreePlayBanner } from "../components/dailyRewards/FreePlayBanner";
import { useQuizGates, useQuizFrozenTableState } from "../components/pokernight/useQuizGates";
import { QuizGateModal } from "../components/pokernight/QuizGateModal";

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
    const msg = pokerNightLockMessage(progress);
    return <LockedScreen headline={msg.headline} detail={msg.detail} />;
  }

  return <PokerNightUnlocked />;
}

export default PokerNight;

function PokerNightUnlocked() {
  const { user } = useAuth();
  const {
    progress,
    addTokens,
    spendTokens,
    refetchProgress,
    freePlayMinutesRemaining,
    tickFreePlayMinutes,
  } = useProgress();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>("single");
  const [mpGatePassed, setMpGatePassed] = useState(() => isMultiplayerUnlocked(progress));
  const [seat, setSeat] = useState<{
    tier: TableTier;
    buyIn: number;
    key: number;
    freePlay?: boolean;
  } | null>(null);
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
    if (freePlayMinutesRemaining > 0) {
      setSeat({ tier, buyIn: tier.minBuyIn, key: Date.now(), freePlay: true });
      return;
    }
    if (!spendTokens(buyIn)) return;
    setSeat({ tier, buyIn, key: Date.now() });
  };

  const handleCashOut = (finalStack: number) => {
    if (finalStack > 0) addTokens(finalStack);
    setSeat(null);
  };

  const handleMpJoined = useCallback((roomId: string, tier: TableTier, buyIn: number) => {
    setMpSession({ roomId, tier, buyIn, key: Date.now() });
  }, []);

  const inTableSession = seat != null || mpSession != null;

  useEffect(() => {
    if (!inTableSession) return;
    document.documentElement.classList.add("pn-immersive");
    return () => document.documentElement.classList.remove("pn-immersive");
  }, [inTableSession]);

  return (
    <div className="mx-auto max-w-5xl">
      {!inTableSession && (
        <>
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

          <FreePlayBanner
            minutesRemaining={freePlayMinutesRemaining}
            streakDay={progress.streak}
          />

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
        </>
      )}

      {mode === "single" ? (
        seat ? (
          <PokerSession
            key={seat.key}
            tier={seat.tier}
            buyIn={seat.buyIn}
            bankroll={progress.tokens ?? 0}
            freePlay={seat.freePlay ?? false}
            freePlayMinutesRemaining={freePlayMinutesRemaining}
            tickFreePlayMinutes={tickFreePlayMinutes}
            onCashOut={handleCashOut}
            onFreePlayExpired={() => setSeat(null)}
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
  freePlay?: boolean;
  freePlayMinutesRemaining?: number;
  tickFreePlayMinutes?: (minutes: number) => void;
  onCashOut: (finalStack: number) => void;
  onFreePlayExpired?: () => void;
  deckSkinId: string;
  tableThemeId: string;
}

type Phase = "playing" | "busted" | "broke";

function PokerSession({
  tier,
  buyIn,
  bankroll,
  freePlay = false,
  freePlayMinutesRemaining = 0,
  tickFreePlayMinutes,
  onCashOut,
  onFreePlayExpired,
  deckSkinId,
  tableThemeId,
}: PokerSessionProps) {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const { recordPokerHand, spendTokens, addTokens } = useProgress();

  useEffect(() => {
    if (!freePlay || !tickFreePlayMinutes) return;
    const id = window.setInterval(() => tickFreePlayMinutes(1), 60_000);
    return () => clearInterval(id);
  }, [freePlay, tickFreePlayMinutes]);

  useEffect(() => {
    if (freePlay && freePlayMinutesRemaining <= 0) {
      onFreePlayExpired?.();
    }
  }, [freePlay, freePlayMinutesRemaining, onFreePlayExpired]);

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

  const personasRef = useRef(pickPersonasForTier(tier.opponents, tier.id));
  const [pauseForQuiz, setPauseForQuiz] = useState(false);

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
    pauseGame: pauseForQuiz,
    onHandEnd: handleHandEnd,
  });

  const {
    state,
    legal,
    isHumanTurn,
    humanSeat,
    thinking,
    speeches,
    expressions,
    act,
    dealNext,
    rebuy,
    humanSeatIndex,
  } = game;

  const quizGates = useQuizGates({
    state,
    viewerSeatIndex: humanSeatIndex,
    enabled: phase === "playing",
  });

  useEffect(() => {
    setPauseForQuiz(!!quizGates.activeGate);
  }, [quizGates.activeGate]);

  const tableState = useQuizFrozenTableState(state, !!quizGates.activeGate);

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
    <div className="pn-viewport-session">
      <SessionHeader
        className="pn-session-header shrink-0"
        tier={tier}
        stack={humanSeat.stack}
        bankroll={bankroll}
        onLeave={handleLeave}
        leaveDisabled={!handComplete}
        onBuyTokens={() => setShowPurchase(true)}
      />

      <div className="pn-viewport-main">
        <Suspense
          fallback={
            <div className="flex flex-1 items-center justify-center rounded-2xl bg-black/40 text-sm text-muted">
              Entering the casino…
            </div>
          }
        >
        <PokerTable
          state={tableState}
          deck={deck}
          theme={theme}
          reduced={reduced}
          speeches={quizGates.activeGate ? {} : speeches}
          expressions={quizGates.activeGate ? {} : expressions}
          quizGateResults={quizGates.results}
        />
        </Suspense>
      </div>

      <div className="pn-viewport-controls shrink-0">
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
          enabled={isHumanTurn && !quizGates.activeGate}
          thinking={thinking && !quizGates.activeGate}
            onAction={act}
          />
        )}
      </div>

      {quizGates.activeGate && (
        <QuizGateModal
          key={`${state.handNumber}-${quizGates.activeGate.gate}`}
          gate={quizGates.activeGate.gate}
          question={quizGates.activeGate.question}
          onResolve={quizGates.resolveGate}
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
  const [pauseForQuiz, setPauseForQuiz] = useState(false);

  const game = useMultiplayerGame({
    roomId,
    uid: user!.uid,
    tier,
    buyIn,
    reduced,
    pauseGame: pauseForQuiz,
    onHandEnd: ({ result, humanStack }) => {
      recordPokerHand({
        won: (result.netBySeat[mySeatIndexRef.current] ?? 0) > 0,
        potSize: result.totalPot,
        busted: humanStack === 0,
      });
    },
  });

  mySeatIndexRef.current = game.mySeatIndex;

  const { room, state, legal, isHumanTurn, thinking, speeches, expressions, act, dealNext, mySeatIndex, isHost, seatKnown, humanSeatIndex } = game;

  const quizGates = useQuizGates({
    state,
    viewerSeatIndex: humanSeatIndex,
    enabled: seatKnown && !!room?.gameState,
  });

  useEffect(() => {
    setPauseForQuiz(!!quizGates.activeGate);
  }, [quizGates.activeGate]);

  const tableState = useQuizFrozenTableState(state, !!quizGates.activeGate);

  const handComplete = state.stage === "complete";
  const myStack = seatKnown ? (state.seats[mySeatIndex]?.stack ?? 0) : 0;

  const handleLeave = () => {
    addTokens(myStack);
    onLeave();
  };

  if (!room || !room.gameState || !seatKnown) {
    return <p className="text-muted">Connecting to table…</p>;
  }

  return (
    <div className="pn-viewport-session">
      <SessionHeader
        className="pn-session-header shrink-0"
        tier={tier}
        stack={myStack}
        bankroll={bankroll}
        onLeave={handleLeave}
        leaveDisabled={!handComplete}
        badge="Multiplayer"
      />
      <div className="pn-viewport-main pn-viewport-main--with-chat">
        <div className="pn-viewport-table">
          <Suspense
            fallback={
              <div className="flex flex-1 items-center justify-center rounded-2xl bg-black/40 text-sm text-muted">
                Entering the casino…
              </div>
            }
          >
            <PokerTable
              state={tableState}
              deck={deck}
              theme={theme}
              reduced={reduced}
              speeches={quizGates.activeGate ? {} : speeches}
              expressions={quizGates.activeGate ? {} : expressions}
              viewerSeatIndex={mySeatIndex}
              quizGateResults={quizGates.results}
              multiplayer
            />
          </Suspense>
        </div>
        {user && (
          <TableChat
            className="hidden min-h-0 overflow-hidden lg:flex lg:flex-col"
            roomId={roomId}
            uid={user.uid}
            room={room}
          />
        )}
      </div>
      <div className="pn-viewport-controls shrink-0">
        {handComplete ? (
          <HandResultBanner state={state} canDeal={isHost} onNext={dealNext} />
        ) : (
          <ActionBar
            state={state}
            legal={legal}
          enabled={isHumanTurn && !quizGates.activeGate}
          thinking={thinking && !quizGates.activeGate}
            onAction={act}
            humanSeatIndex={mySeatIndex}
          />
        )}
      </div>
      {quizGates.activeGate && (
        <QuizGateModal
          key={`${state.handNumber}-${quizGates.activeGate.gate}`}
          gate={quizGates.activeGate.gate}
          question={quizGates.activeGate.question}
          onResolve={quizGates.resolveGate}
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
  className,
}: {
  tier: TableTier;
  stack: number;
  bankroll: number;
  onLeave: () => void;
  leaveDisabled: boolean;
  onBuyTokens?: () => void;
  badge?: string;
  className?: string;
}) {
  return (
    <div className={["flex flex-wrap items-center justify-between gap-2", className].filter(Boolean).join(" ")}>
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
