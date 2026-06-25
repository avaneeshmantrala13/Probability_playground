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

export interface UsePokerGameOpts {
  config: GameConfig;
  humanName: string;
  humanStack: number;
  personas: Persona[];
  reduced: boolean;
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
  act: (action: Action) => void;
  dealNext: () => void;
  rebuy: (amount: number) => void;
}

const HUMAN_SEAT = 0;

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

export function usePokerGame(opts: UsePokerGameOpts): PokerGameApi {
  const { config, humanName, humanStack, personas, reduced, onHandEnd } = opts;

  const [state, setState] = useState<GameState>(() =>
    startHand(createGame({ config, humanName, humanStack, personas })),
  );
  const [thinking, setThinking] = useState(false);
  const [humanEquity, setHumanEquity] = useState<number | null>(null);
  const [speeches, setSpeeches] = useState<Record<number, Speech>>({});

  const stateRef = useRef(state);
  stateRef.current = state;
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
    if (state.stage === "complete" || state.toAct == null) {
      setThinking(false);
      return;
    }
    if (state.toAct === HUMAN_SEAT) {
      setThinking(false);
      return;
    }
    setThinking(true);
    const seatIndex = state.toAct;
    const delay = reduced ? 90 : 480 + Math.random() * 520;
    // The Monte-Carlo equity for the decision runs INSIDE this timeout, i.e.
    // after the "thinking…" animation has already painted, so the table stays
    // smooth and the UI thread is never blocked while it's a bot's turn.
    const timer = setTimeout(() => {
      const cur = stateRef.current;
      if (cur.toAct !== seatIndex || cur.stage === "complete") return;
      const decision = decideBotAction(cur, seatIndex);
      const next = applyAction(cur, decision);
      pushSpeech(seatIndex, speechFor(decision, next.seats[seatIndex]));
      setState(next);
    }, delay);
    return () => clearTimeout(timer);
  }, [state, reduced, pushSpeech]);

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
      setState(next);
    },
    [pushSpeech],
  );

  const dealNext = useCallback(() => {
    setSpeeches({});
    setState((prev) => startHand(prev));
  }, []);

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

  return {
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
  };
}
