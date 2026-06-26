import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useProgress } from "../../context/ProgressContext";
import {
  createFriendsRoom,
  joinRoomByCode,
  leaveMatchmakingQueue,
  leaveRoom,
  matchmakePublic,
  setPlayerChatEnabled,
  setPlayerReady,
  subscribeToMatchmakingEntry,
  subscribeToMatchmakingPool,
  subscribeToRoom,
  tryMatchPublicTable,
  type PokerRoom,
} from "../../lib/multiplayer/rooms";
import { PUBLIC_MATCH_MIN_PLAYERS, PUBLIC_MATCH_START_DELAY_MS } from "../../lib/multiplayer/constants";
import { preferredJoinCharacterId } from "../../lib/characters";
import { TABLE_TIERS, type TableTier } from "../../lib/tokens";
import { formatUsd, multiplayerBuyInPriceCents } from "../../lib/payments/pricing";
import { TokenPurchaseModal } from "./TokenPurchaseModal";
import { useHostRoomStart } from "./useHostRoomStart";

type Tab = "friends" | "public";

interface MultiplayerLobbyProps {
  bankroll: number;
  onJoined: (roomId: string, tier: TableTier, buyIn: number) => void;
  onLeave: () => void;
}

function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

export function MultiplayerLobby({ bankroll, onJoined, onLeave }: MultiplayerLobbyProps) {
  const { user } = useAuth();
  const { spendTokens, progress } = useProgress();
  const [tab, setTab] = useState<Tab>("friends");
  const [selectedId, setSelectedId] = useState(TABLE_TIERS[0].id);
  const tier = TABLE_TIERS.find((t) => t.id === selectedId) ?? TABLE_TIERS[0];
  const [buyIn, setBuyIn] = useState(tier.minBuyIn);
  const [joinCode, setJoinCode] = useState("");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<PokerRoom | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [matching, setMatching] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);

  const maxAffordable = Math.min(tier.maxBuyIn, bankroll);
  const canAfford = bankroll >= tier.minBuyIn;
  const mpPrice = formatUsd(multiplayerBuyInPriceCents(buyIn));

  const displayName =
    user?.displayName ?? user?.email?.split("@")[0] ?? "Player";

  const joinCharacterId = () =>
    preferredJoinCharacterId(
      progress.equipped?.playerOutfit,
      progress.ownedCosmetics ?? [],
    );

  const joinedRef = useRef(false);
  const onJoinedStable = useCallback(onJoined, [onJoined]);

  useEffect(() => {
    if (!roomId) return;
    return subscribeToRoom(roomId, (r) => {
      setRoom(r);
      if (r && r.status === "playing" && !joinedRef.current) {
        joinedRef.current = true;
        onJoinedStable(roomId, tier, buyIn);
      }
    });
  }, [roomId, tier, buyIn, onJoinedStable]);

  // Public matchmaking pool watcher.
  useEffect(() => {
    if (!matching || !user) return;
    let cancelled = false;
    const unsubPool = subscribeToMatchmakingPool(tier.id, async (entries) => {
      if (cancelled || entries.length < PUBLIC_MATCH_MIN_PLAYERS) return;
      const sorted = [...entries].sort((a, b) => a.joinedAt - b.joinedAt);
      if (sorted[0]?.uid !== user.uid) return;
      const oldest = sorted[0].joinedAt;
      if (Date.now() - oldest < PUBLIC_MATCH_START_DELAY_MS) return;
      try {
        const id = await tryMatchPublicTable(
          tier,
          buyIn,
          sorted.slice(0, 6).map((e) => e.uid),
        );
        if (id) setRoomId(id);
      } catch {
        /* retry on next snapshot */
      }
    });
    const unsubSelf = subscribeToMatchmakingEntry(user.uid, (entry) => {
      if (entry?.roomId) {
        setMatching(false);
        setRoomId(entry.roomId);
      }
    });
    return () => {
      cancelled = true;
      unsubPool();
      unsubSelf();
    };
  }, [matching, user, tier, buyIn]);

  const payAndSit = async (action: () => Promise<void>) => {
    if (!canAfford) {
      setShowPurchase(true);
      return;
    }
    if (!spendTokens(buyIn)) {
      setShowPurchase(true);
      return;
    }
    setError("");
    setBusy(true);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const handleCreateFriends = () =>
    payAndSit(async () => {
      if (!user) return;
      const { roomId: id } = await createFriendsRoom(
        user.uid,
        displayName,
        tier,
        buyIn,
        joinCharacterId(),
      );
      setRoomId(id);
    });

  const handleJoinFriends = () =>
    payAndSit(async () => {
      if (!user) return;
      const { roomId: id } = await joinRoomByCode(
        joinCode,
        user.uid,
        displayName,
        joinCharacterId(),
      );
      setRoomId(id);
    });

  const handleFindPublic = () =>
    payAndSit(async () => {
      if (!user) return;
      const { roomId: id, matched } = await matchmakePublic(
        user.uid,
        displayName,
        tier,
        buyIn,
        joinCharacterId(),
      );
      if (matched) setRoomId(id);
      else setMatching(true);
    });

  const handleCancelMatch = async () => {
    if (user) await leaveMatchmakingQueue(user.uid);
    setMatching(false);
  };

  const handleToggleReady = async () => {
    if (!roomId || !user || !room?.players[user.uid]) return;
    await setPlayerReady(roomId, user.uid, !room.players[user.uid].ready);
  };

  const handleToggleChat = async () => {
    if (!roomId || !user || !room?.players[user.uid]) return;
    await setPlayerChatEnabled(roomId, user.uid, !room.players[user.uid].chatEnabled);
  };

  const handleLeaveRoom = async () => {
    if (roomId && user) await leaveRoom(roomId, user.uid);
    if (user) await leaveMatchmakingQueue(user.uid);
    setRoomId(null);
    setRoom(null);
    setMatching(false);
    onLeave();
  };

  const hostStart = useHostRoomStart({
    roomId: roomId ?? "",
    uid: user?.uid ?? "",
    tier,
    buyIn,
    room: roomId && room?.status === "lobby" ? room : null,
  });

  if (roomId && room?.status === "lobby") {
    const players = Object.values(room.players).filter((p) => p.active);
    const me = user ? room.players[user.uid] : undefined;
    return (
      <div className="space-y-4">
        <div className="pp-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-primary">
                {room.roomType === "public" ? "Public table" : "Friends room"}
              </h2>
              <p className="text-sm text-secondary">
                Code: <span className="font-mono font-bold text-accent">{room.code}</span>
                {" · "}
                {players.length}/{room.maxSeats} players
              </p>
            </div>
            <button type="button" className="pp-btn-secondary" onClick={handleLeaveRoom}>
              Leave
            </button>
          </div>
          <ul className="mt-4 space-y-2">
            {players
              .sort((a, b) => a.seatIndex - b.seatIndex)
              .map((p) => (
                <li
                  key={p.uid}
                  className="flex items-center justify-between rounded-lg bg-surface-muted px-3 py-2 text-sm"
                >
                  <span className="font-medium text-primary">
                    Seat {p.seatIndex + 1}: {p.name}
                    {p.uid === room.hostUid && " (host)"}
                  </span>
                  <span className={p.ready ? "text-accent" : "text-muted"}>
                    {p.ready ? "Ready" : "Waiting"}
                  </span>
                </li>
              ))}
          </ul>
          {me && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="pp-btn-primary" onClick={handleToggleReady}>
                {me.ready ? "Unready" : "Ready up"}
              </button>
              <button type="button" className="pp-btn-secondary" onClick={handleToggleChat}>
                Chat: {me.chatEnabled ? "On" : "Off"}
              </button>
            </div>
          )}
          {hostStart.isHost && (
            <div className="mt-3 space-y-2">
              {hostStart.allReady ? (
                hostStart.starting ? (
                  <p className="text-xs text-muted">Starting game…</p>
                ) : (
                  <button
                    type="button"
                    className="pp-btn-primary"
                    onClick={hostStart.startGameManually}
                  >
                    Start game
                  </button>
                )
              ) : (
                <p className="text-xs text-muted">
                  Game starts when all players are ready.
                </p>
              )}
              {hostStart.startError && (
                <p className="text-xs text-danger">{hostStart.startError}</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="inline-flex gap-1 rounded-xl bg-surface-muted p-1">
        {(["friends", "public"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              tab === t ? "bg-surface text-accent shadow-card" : "text-secondary"
            }`}
          >
            {t === "friends" ? "Friends only" : "Public matchmaking"}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {TABLE_TIERS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setSelectedId(t.id);
              setBuyIn(clamp(t.minBuyIn, t.minBuyIn, Math.min(t.maxBuyIn, bankroll)));
            }}
            className={`pp-card p-4 text-left ${t.id === selectedId ? "ring-2 ring-accent" : ""}`}
          >
            <h3 className="font-bold text-primary">{t.name}</h3>
            <p className="mt-1 text-xs text-muted">
              {t.smallBlind}/{t.bigBlind} · up to 6 players
            </p>
          </button>
        ))}
      </div>

      <div className="pp-card space-y-3 p-4">
        <div className="flex justify-between text-sm">
          <span>Buy-in</span>
          <span className="font-mono font-semibold">{buyIn.toLocaleString()} 🪙</span>
        </div>
        <input
          type="range"
          className="pp-range w-full"
          min={tier.minBuyIn}
          max={Math.max(tier.minBuyIn, maxAffordable)}
          step={tier.bigBlind}
          value={buyIn}
          disabled={!canAfford}
          onChange={(e) => setBuyIn(Number(e.target.value))}
        />
        <p className="text-xs text-muted">Multiplayer entry fee: {mpPrice} (via Stripe if needed)</p>
        {error && <p className="text-sm text-danger">{error}</p>}

        {tab === "friends" ? (
          <div className="space-y-3">
            <button
              type="button"
              className="pp-btn-primary w-full"
              disabled={busy}
              onClick={handleCreateFriends}
            >
              Create room & share code
            </button>
            <div className="flex gap-2">
              <input
                type="text"
                className="pp-input flex-1 uppercase"
                placeholder="Room code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
              />
              <button
                type="button"
                className="pp-btn-secondary"
                disabled={busy || !joinCode.trim()}
                onClick={handleJoinFriends}
              >
                Join
              </button>
            </div>
          </div>
        ) : matching ? (
          <div className="space-y-2 text-center">
            <p className="text-secondary">Finding players…</p>
            <button type="button" className="pp-btn-secondary w-full" onClick={handleCancelMatch}>
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="pp-btn-primary w-full"
            disabled={busy}
            onClick={handleFindPublic}
          >
            Find public match
          </button>
        )}
      </div>

      {showPurchase && (
        <TokenPurchaseModal
          kind="mp_buyin"
          tokenAmount={buyIn}
          onClose={() => setShowPurchase(false)}
        />
      )}
    </div>
  );
}
