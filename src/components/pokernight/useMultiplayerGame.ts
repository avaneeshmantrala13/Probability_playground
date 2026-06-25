import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  applyAction,
  legalActions,
  type Action,
  type GameConfig,
  type GameState,
  type HandResult,
} from "../../lib/poker";
import { createMultiplayerGame } from "../../lib/poker/multiplayer";
import { pickPersonas } from "../../lib/poker";
import {
  filterGameStateForViewer,
  markActionApplied,
  startRoomGame,
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
  const startedRef = useRef(false);
  const isHost = room?.hostUid === uid;
  const myPlayer = room?.players[uid];
  const mySeatIndex = myPlayer?.seatIndex ?? 0;

  useEffect(() => {
    return subscribeToRoom(roomId, setRoom);
  }, [roomId]);

  const config: GameConfig = useMemo(
    () => ({
      smallBlind: tier.smallBlind,
      bigBlind: tier.bigBlind,
      botSkill: tier.botSkill,
      botStack: buyIn,
    }),
    [tier, buyIn],
  );

  // Host: start game when all active players are ready.
  useEffect(() => {
    if (!isHost || !room || room.status !== "lobby" || startedRef.current) return;
    const active = Object.values(room.players).filter((p) => p.active);
    if (active.length === 0) return;
    if (!active.every((p) => p.ready)) return;

    startedRef.current = true;
    const humans = active.map((p) => ({
      seatIndex: p.seatIndex,
      name: p.name,
      stack: p.stack,
    }));
    const gameState = createMultiplayerGame(config, humans);
    void startRoomGame(roomId, gameState);
  }, [isHost, room, config, roomId]);

  const handleHostStateChange = useCallback(
    (state: GameState) => {
      if (!isHost) return;
      actionSeqRef.current += 1;
      void updateRoomGameState(roomId, state, actionSeqRef.current);
    },
    [isHost, roomId],
  );

  // Host: apply remote player actions.
  useEffect(() => {
    if (!isHost || !room?.gameState || room.status !== "playing") return;

    const onAction = async (docId: string, doc: PlayerActionDoc) => {
      if (doc.applied) return;
      const current = room.gameState;
      if (!current || current.toAct !== doc.seatIndex) return;
      const next = applyAction(current, doc.action as Action);
      actionSeqRef.current += 1;
      await updateRoomGameState(roomId, next, actionSeqRef.current);
      await markActionApplied(roomId, docId);
    };

    return subscribeToPlayerActions(roomId, onAction);
  }, [isHost, room?.gameState, room?.status, roomId]);

  const filteredState = useMemo(() => {
    if (!room?.gameState) return null;
    return filterGameStateForViewer(room.gameState, mySeatIndex);
  }, [room?.gameState, mySeatIndex]);

  const personas = useMemo(() => pickPersonas(Math.max(1, 6 - (room ? Object.values(room.players).filter((p) => p.active).length : 1))), [room]);

  const hostGame = usePokerGame({
    config,
    humanName: myPlayer?.name ?? "You",
    humanStack: buyIn,
    personas,
    reduced,
    humanSeatIndex: mySeatIndex,
    externalState: isHost && room?.gameState ? room.gameState : null,
    onStateChange: isHost ? handleHostStateChange : undefined,
    onHandEnd,
  });

  const act = useCallback(
    async (action: Action) => {
      if (isHost) {
        hostGame.act(action);
        return;
      }
      if (!room?.gameState || room.gameState.toAct !== mySeatIndex) return;
      await submitPlayerAction(roomId, uid, mySeatIndex, action, room.actionSeq + 1);
    },
    [isHost, hostGame, room, roomId, uid, mySeatIndex],
  );

  const displayState = isHost ? hostGame.state : (filteredState ?? hostGame.state);
  const displayLegal = useMemo(() => legalActions(displayState), [displayState]);
  const isHumanTurn =
    displayState.stage !== "complete" && displayState.toAct === mySeatIndex;

  return {
    room,
    isHost,
    mySeatIndex,
    myPlayer,
    state: displayState,
    legal: displayLegal,
    isHumanTurn,
    humanSeat: displayState.seats[mySeatIndex],
    humanEquity: isHumanTurn ? hostGame.humanEquity : null,
    thinking: hostGame.thinking,
    speeches: hostGame.speeches,
    expressions: hostGame.expressions,
    act,
    dealNext: hostGame.dealNext,
    rebuy: hostGame.rebuy,
  };
}
