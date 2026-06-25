import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  applyAction,
  createGame,
  decideBotAction,
  estimateEquity,
  legalActions,
  liveOpponents,
  startHand,
  type Action,
  type GameConfig,
  type GameState,
  type HandResult,
  type LegalActions,
  type Persona,
  type Seat,
} from "../../lib/poker";
import type { Expression } from "./characters";

export interface UsePokerGameOpts {
  config: GameConfig;
  humanName: string;
  humanStack: number;
  personas: Persona[];
  reduced: boolean;
  /** Seat index of the local human (default 0). */
  humanSeatIndex?: number;
  /** External state driver — when set, hook mirrors this instead of local bot loop. */
  externalState?: GameState | null;
  /** Run the bot loop even when `externalState` is set (multiplayer host). */
  driveBots?: boolean;
  /** Bot think delay range in ms — defaults to ~480–1000 single-player. */
  botDelayMs?: [number, number];
  onStateChange?: (state: GameState) => void;
  onHandEnd?: (info: { result: HandResult; humanStack: number }) => void;
}

/** A short-lived spoken line for a seat, keyed by a monotonic id. */
export interface Speech {
  id: number;
  text: string;
}

export interface PokerGameApi {
  state: GameState;
  legal: LegalActions;
  isHumanTurn: boolean;
  humanSeat: Seat;
  /** Live Monte-Carlo equity for the human while it's their turn (or null). */
  humanEquity: number | null;
  thinking: boolean;
  /** Latest action speech per seat index (drives table speech bubbles). */
  speeches: Record<number, Speech>;
  /** Live, game-driven facial expression per seat index. */
  expressions: Record<number, Expression>;
  act: (action: Action) => void;
  dealNext: () => void;
  rebuy: (amount: number) => void;
}

// Default human seat for single-player mode.
const DEFAULT_HUMAN_SEAT = 0;

/**
 * Turn a just-applied action into a short spoken line for the speech bubble.
 * Bots speak their persona quip (flavor); the human gets a plain action label.
 * An all-in is detected from the resulting seat status so it reads "All in!"
 * regardless of whether it arrived as a bet/raise/call.
 */
function speechFor(action: Action, after: Seat): string {
  const quip = action.meta?.quip;
  if (after.status === "allin") return quip ?? "All in!";
  switch (action.type) {
    case "fold":
      return quip ?? "I fold";
    case "check":
      return quip ?? "Check";
    case "call":
      return quip ?? "Call";
    case "bet":
      return quip ?? `Bet ${after.roundBet}`;
    case "raise":
      return quip ?? `Raise to ${after.roundBet}`;
    case "allin":
      return quip ?? "All in!";
    default:
      return quip ?? "";
  }
}

/**
 * The lasting "mood" a seat carries AFTER it acts (until it acts again or the
 * hand ends): confident after betting/raising, rattled after a big call, glum
 * after folding. Checks read as calm/idle.
 */
function reactionFor(action: Action, after: Seat): Expression {
  if (after.status === "allin") return "smug";
  switch (action.type) {
    case "bet":
    case "raise":
    case "allin":
      return "smug";
    case "fold":
      return "sad";
    case "call":
      return "concerned";
    case "check":
    default:
      return "idle";
  }
}

/**
 * Resolve every seat's live expression purely from current state + stored
 * reactions, so faces always match what's happening:
 *   - showdown/end: winners beam, players who lost chips look gutted
 *   - the seat to act ponders (and looks worried facing a big bet)
 *   - folded seats stay glum; everyone else keeps their last-action mood
 * Pure + cheap (memoized by the caller); the human seat is included but its
 * face isn't drawn in the first-person dock.
 */
function deriveExpressions(
  state: GameState,
  reactions: Record<number, Expression>,
): Record<number, Expression> {
  const out: Record<number, Expression> = {};
  const result = state.stage === "complete" ? state.result : null;
  for (const seat of state.seats) {
    const i = seat.index;
    if (seat.status === "out") {
      out[i] = "idle";
      continue;
    }
    if (result) {
      const net = result.netBySeat[i] ?? 0;
      if (net > 0) out[i] = "happy";
      else if (net < 0) out[i] = "sad";
      else out[i] = seat.status === "folded" ? "sad" : "idle";
      continue;
    }
    if (seat.status === "folded") {
      out[i] = "sad";
      continue;
    }
    if (state.toAct === i) {
      const toCall = state.currentBet - seat.roundBet;
      const bigBet =
        toCall >= state.config.bigBlind * 3 ||
        (seat.stack > 0 && toCall >= seat.stack * 0.35);
      out[i] = bigBet ? "concerned" : "think";
      continue;
    }
    out[i] = reactions[i] ?? "idle";
  }
  return out;
}

export function usePokerGame(opts: UsePokerGameOpts): PokerGameApi {
  const {
    config,
    humanName,
    humanStack,
    personas,
    reduced,
    humanSeatIndex = DEFAULT_HUMAN_SEAT,
    externalState,
    driveBots = false,
    botDelayMs,
    onStateChange,
    onHandEnd,
  } = opts;
  const HUMAN_SEAT = humanSeatIndex;

  const [state, setState] = useState<GameState>(() =>
    externalState ?? startHand(createGame({ config, humanName, humanStack, personas })),
  );
  const [thinking, setThinking] = useState(false);
  const [humanEquity, setHumanEquity] = useState<number | null>(null);
  const [speeches, setSpeeches] = useState<Record<number, Speech>>({});
  // Lasting per-seat mood from each player's most recent action this hand.
  const [reactions, setReactions] = useState<Record<number, Expression>>({});

  const stateRef = useRef(state);
  stateRef.current = state;

  // Mirror external multiplayer state from Firestore.
  useEffect(() => {
    if (externalState) setState(externalState);
  }, [externalState]);
  const reportedHand = useRef(0);
  const speechId = useRef(0);
  const onHandEndRef = useRef(onHandEnd);
  onHandEndRef.current = onHandEnd;

  const pushSpeech = useCallback((seatIndex: number, text: string) => {
    if (!text) return;
    speechId.current += 1;
    const id = speechId.current;
    setSpeeches((prev) => ({ ...prev, [seatIndex]: { id, text } }));
  }, []);

  const isHumanTurn =
    state.stage !== "complete" && state.toAct === HUMAN_SEAT;

  // --------- drive bot turns automatically with a small think delay ---------
  useEffect(() => {
    if (externalState != null && !driveBots) return;
    if (state.stage === "complete" || state.toAct == null) {
      setThinking(false);
      return;
    }
    const actor = state.seats[state.toAct];
    if (!actor || actor.isHuman) {
      setThinking(false);
      return;
    }
    setThinking(true);
    const seatIndex = state.toAct;
    const [minDelay, maxDelay] =
      botDelayMs ?? (reduced ? [90, 90] : [480, 1000]);
    const delay = minDelay + Math.random() * (maxDelay - minDelay);
    // The Monte-Carlo equity for the decision runs INSIDE this timeout, i.e.
    // after the "thinking…" animation has already painted, so the table stays
    // smooth and the UI thread is never blocked while it's a bot's turn.
    const timer = setTimeout(() => {
      const cur = stateRef.current;
      if (cur.toAct !== seatIndex || cur.stage === "complete") return;
      const decision = decideBotAction(cur, seatIndex);
      const next = applyAction(cur, decision);
      pushSpeech(seatIndex, speechFor(decision, next.seats[seatIndex]));
      setReactions((prev) => ({
        ...prev,
        [seatIndex]: reactionFor(decision, next.seats[seatIndex]),
      }));
      setState(next);
      onStateChange?.(next);
    }, delay);
    return () => clearTimeout(timer);
  }, [state, reduced, pushSpeech, externalState, driveBots, botDelayMs, onStateChange]);

  // ----------------- report each completed hand exactly once -----------------
  useEffect(() => {
    if (
      state.stage === "complete" &&
      state.result &&
      state.handNumber !== reportedHand.current
    ) {
      reportedHand.current = state.handNumber;
      onHandEndRef.current?.({
        result: state.result,
        humanStack: state.seats[HUMAN_SEAT].stack,
      });
    }
  }, [state]);

  // ------------- live human equity readout while it's their turn -------------
  // Deferred to a macrotask so the action bar paints instantly on the human's
  // turn; the Monte-Carlo sample then fills the win-chance in without blocking.
  useEffect(() => {
    if (!isHumanTurn) {
      setHumanEquity(null);
      return;
    }
    const human = state.seats[HUMAN_SEAT];
    if (human.holeCards.length !== 2) {
      setHumanEquity(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      if (cancelled) return;
      const opp = Math.max(1, liveOpponents(state, HUMAN_SEAT));
      // Light sample — this is a hint, not a decision.
      const eq = estimateEquity(human.holeCards, state.board, opp, 400).equity;
      if (!cancelled) setHumanEquity(eq);
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [isHumanTurn, state]);

  const act = useCallback(
    (action: Action) => {
      const cur = stateRef.current;
      if (cur.toAct !== HUMAN_SEAT || cur.stage === "complete") return;
      const next = applyAction(cur, action);
      pushSpeech(HUMAN_SEAT, speechFor(action, next.seats[HUMAN_SEAT]));
      setReactions((prev) => ({
        ...prev,
        [HUMAN_SEAT]: reactionFor(action, next.seats[HUMAN_SEAT]),
      }));
      setState(next);
      onStateChange?.(next);
    },
    [pushSpeech, onStateChange, HUMAN_SEAT],
  );

  const dealNext = useCallback(() => {
    setSpeeches({});
    setReactions({});
    setState((prev) => {
      const next = startHand(prev);
      onStateChange?.(next);
      return next;
    });
  }, [onStateChange]);

  const rebuy = useCallback((amount: number) => {
    setState((prev) => {
      const next: GameState = {
        ...prev,
        seats: prev.seats.map((s) =>
          s.index === HUMAN_SEAT
            ? { ...s, stack: s.stack + Math.max(0, Math.floor(amount)) }
            : s,
        ),
      };
      return next;
    });
  }, []);

  const legal = useMemo(() => legalActions(state), [state]);
  const humanSeat = state.seats[HUMAN_SEAT];
  const expressions = useMemo(
    () => deriveExpressions(state, reactions),
    [state, reactions],
  );

  return {
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
  };
}
