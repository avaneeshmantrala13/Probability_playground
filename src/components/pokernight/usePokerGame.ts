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

export interface PokerGameApi {
  state: GameState;
  legal: LegalActions;
  isHumanTurn: boolean;
  humanSeat: Seat;
  /** Live Monte-Carlo equity for the human while it's their turn (or null). */
  humanEquity: number | null;
  thinking: boolean;
  act: (action: Action) => void;
  dealNext: () => void;
  rebuy: (amount: number) => void;
}

const HUMAN_SEAT = 0;

export function usePokerGame(opts: UsePokerGameOpts): PokerGameApi {
  const { config, humanName, humanStack, personas, reduced, onHandEnd } = opts;

  const [state, setState] = useState<GameState>(() =>
    startHand(createGame({ config, humanName, humanStack, personas })),
  );
  const [thinking, setThinking] = useState(false);
  const [humanEquity, setHumanEquity] = useState<number | null>(null);

  const stateRef = useRef(state);
  stateRef.current = state;
  const reportedHand = useRef(0);
  const onHandEndRef = useRef(onHandEnd);
  onHandEndRef.current = onHandEnd;

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
    const timer = setTimeout(() => {
      const cur = stateRef.current;
      if (cur.toAct !== seatIndex || cur.stage === "complete") return;
      const decision = decideBotAction(cur, seatIndex);
      setState(applyAction(cur, decision));
    }, delay);
    return () => clearTimeout(timer);
  }, [state, reduced]);

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
    const opp = Math.max(1, liveOpponents(state, HUMAN_SEAT));
    // Light sample — this is a hint, not a decision.
    const eq = estimateEquity(human.holeCards, state.board, opp, 500).equity;
    setHumanEquity(eq);
  }, [isHumanTurn, state]);

  const act = useCallback((action: Action) => {
    const cur = stateRef.current;
    if (cur.toAct !== HUMAN_SEAT || cur.stage === "complete") return;
    setState(applyAction(cur, action));
  }, []);

  const dealNext = useCallback(() => {
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
    act,
    dealNext,
    rebuy,
  };
}
