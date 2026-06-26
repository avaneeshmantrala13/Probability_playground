import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GameConfig } from "../../lib/poker";
import { createMultiplayerGame } from "../../lib/poker/multiplayer";
import { startRoomGame, type PokerRoom } from "../../lib/multiplayer/rooms";
import { assignDefaultCharacterId } from "../../lib/characters";
import type { TableTier } from "../../lib/tokens";

export interface UseHostRoomStartOpts {
  roomId: string;
  uid: string;
  tier: TableTier;
  buyIn: number;
  room: PokerRoom | null;
}

export function useHostRoomStart(opts: UseHostRoomStartOpts) {
  const { roomId, uid, tier, buyIn, room } = opts;
  const autoAttemptedRef = useRef(false);
  const inFlightRef = useRef(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");

  const isHost = room?.hostUid === uid;
  const activePlayers = useMemo(
    () => (room ? Object.values(room.players).filter((p) => p.active) : []),
    [room],
  );
  const allReady =
    activePlayers.length > 0 && activePlayers.every((p) => p.ready);
  const canStart =
    isHost && room?.status === "lobby" && allReady && !starting;

  const config: GameConfig = useMemo(
    () => ({
      smallBlind: tier.smallBlind,
      bigBlind: tier.bigBlind,
      botSkill: tier.botSkill,
      botStack: buyIn,
    }),
    [tier, buyIn],
  );

  const startGame = useCallback(async () => {
    if (!room || room.status !== "lobby" || !isHost || !allReady) return;
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    setStarting(true);
    setStartError("");

    try {
      const humans = activePlayers.map((p) => ({
        seatIndex: p.seatIndex,
        name: p.name,
        stack: p.stack,
        characterId: p.characterId ?? assignDefaultCharacterId(p.uid, p.seatIndex),
      }));
      const gameState = createMultiplayerGame(config, humans);
      await startRoomGame(roomId, gameState);
    } catch (err) {
      setStartError(
        err instanceof Error ? err.message : "Failed to start game.",
      );
    } finally {
      inFlightRef.current = false;
      setStarting(false);
    }
  }, [room, isHost, allReady, activePlayers, config, roomId]);

  // Host auto-start while still in the lobby (MultiplayerLobby mounts this, not useMultiplayerGame).
  useEffect(() => {
    if (!canStart || autoAttemptedRef.current) return;
    autoAttemptedRef.current = true;
    void startGame();
  }, [canStart, startGame]);

  const startGameManually = useCallback(() => {
    autoAttemptedRef.current = true;
    void startGame();
  }, [startGame]);

  return {
    isHost,
    allReady,
    canStart,
    starting,
    startError,
    startGameManually,
  };
}
