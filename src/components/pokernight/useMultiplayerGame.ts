import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  applyAction,
  legalActions,
  type Action,
  type GameConfig,
  type GameState,
  type HandResult,
} from "../../lib/poker";
import { pickPersonasForTier } from "../../lib/poker";
import {
  filterGameStateForViewer,
  markActionApplied,
  submitPlayerAction,
  subscribeToPlayerActions,
  subscribeToRoom,
  updateRoomGameState,
  type PokerRoom,
  type PlayerActionDoc,
} from "../../lib/multiplayer/rooms";
import { usePokerGame } from "./usePokerGame";
import type { TableTier } from "../../lib/tokens";

export interface UseMultiplayerGameOpts {
  roomId: string;
  uid: string;
  tier: TableTier;
  buyIn: number;
  reduced: boolean;
  onHandEnd?: (info: { result: HandResult; humanStack: number }) => void;
}

export function useMultiplayerGame(opts: UseMultiplayerGameOpts) {
  const { roomId, uid, tier, buyIn, reduced, onHandEnd } = opts;
  const [room, setRoom] = useState<PokerRoom | null>(null);
  const actionSeqRef = useRef(0);
  const gameStateRef = useRef<GameState | null>(null);
  const isHost = room?.hostUid === uid;
  const myPlayer = room?.players[uid];
  /** Never default joiners to seat 0 — that breaks first-hand turn detection. */
  const mySeatIndex = myPlayer?.seatIndex;
  const seatKnown = mySeatIndex != null;

  useEffect(() => {
    return subscribeToRoom(roomId, setRoom);
  }, [roomId]);

  // Keep host actionSeq in sync when mounting mid-hand or after resync.
  useEffect(() => {
    if (room?.actionSeq != null) {
      actionSeqRef.current = room.actionSeq;
    }
  }, [room?.actionSeq]);

  useEffect(() => {
    gameStateRef.current = room?.gameState ?? null;
  }, [room?.gameState]);

  const config: GameConfig = useMemo(
    () => ({
      smallBlind: tier.smallBlind,
      bigBlind: tier.bigBlind,
      botSkill: tier.botSkill,
      botStack: buyIn,
    }),
    [tier, buyIn],
  );

  const handleHostStateChange = useCallback(
    (state: GameState) => {
      if (!isHost) return;
      actionSeqRef.current += 1;
      void updateRoomGameState(roomId, state, actionSeqRef.current);
    },
    [isHost, roomId],
  );

  // Host: apply remote player actions (read latest gameState from ref — not a stale closure).
  useEffect(() => {
    if (!isHost || room?.status !== "playing") return;

    const onAction = async (docId: string, doc: PlayerActionDoc) => {
      if (doc.applied) return;
      const current = gameStateRef.current;
      if (!current || current.toAct !== doc.seatIndex) return;
      const next = applyAction(current, doc.action as Action);
      actionSeqRef.current += 1;
      await updateRoomGameState(roomId, next, actionSeqRef.current);
      await markActionApplied(roomId, docId);
    };

    return subscribeToPlayerActions(roomId, onAction);
  }, [isHost, room?.status, roomId]);

  const filteredState = useMemo(() => {
    if (!room?.gameState || !seatKnown) return null;
    return filterGameStateForViewer(room.gameState, mySeatIndex);
  }, [room?.gameState, mySeatIndex, seatKnown]);

  const personas = useMemo(() => pickPersonasForTier(Math.max(1, 6 - (room ? Object.values(room.players).filter((p) => p.active).length : 1)), tier.id), [room, tier.id]);

  const hostGame = usePokerGame({
    config,
    humanName: myPlayer?.name ?? "You",
    humanStack: buyIn,
    personas,
    reduced,
    humanSeatIndex: mySeatIndex ?? 0,
    externalState: room?.gameState ?? null,
    waitForExternal: !isHost,
    driveBots: isHost,
    botDelayMs: reduced ? [90, 90] : [200, 700],
    onStateChange: isHost ? handleHostStateChange : undefined,
    onHandEnd,
  });

  const act = useCallback(
    async (action: Action) => {
      if (isHost) {
        hostGame.act(action);
        return;
      }
      if (
        !seatKnown ||
        !room?.gameState ||
        room.gameState.toAct !== mySeatIndex
      ) {
        return;
      }
      await submitPlayerAction(roomId, uid, mySeatIndex, action, room.actionSeq + 1);
    },
    [isHost, hostGame, room, roomId, uid, mySeatIndex, seatKnown],
  );

  const displayState = useMemo(() => {
    const raw = isHost ? hostGame.state : (filteredState ?? hostGame.state);
    if (!raw) return hostGame.state;
    if (!seatKnown) return raw;
    return filterGameStateForViewer(raw, mySeatIndex);
  }, [isHost, hostGame.state, filteredState, mySeatIndex, seatKnown]);
  const displayLegal = useMemo(() => legalActions(displayState), [displayState]);
  const isHumanTurn =
    seatKnown &&
    displayState.stage !== "complete" &&
    displayState.toAct === mySeatIndex;

  const thinking =
    hostGame.thinking ||
    (!isHost &&
      displayState.stage !== "complete" &&
      displayState.toAct != null &&
      displayState.toAct !== mySeatIndex);

  return {
    room,
    isHost,
    mySeatIndex: mySeatIndex ?? 0,
    myPlayer,
    seatKnown,
    state: displayState,
    legal: displayLegal,
    isHumanTurn,
    humanSeat: seatKnown ? displayState.seats[mySeatIndex] : undefined,
    thinking,
    speeches: hostGame.speeches,
    expressions: hostGame.expressions,
    act,
    dealNext: hostGame.dealNext,
    rebuy: hostGame.rebuy,
    humanSeatIndex: hostGame.humanSeatIndex,
  };
}
