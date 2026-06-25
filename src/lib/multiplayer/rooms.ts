import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../firebase";
import { stripUndefined } from "../firestore/sanitize";
import type { GameState } from "../poker/types";
import type { TableTier } from "../tokens";
import { MAX_PLAYERS } from "./constants";

export type RoomStatus = "lobby" | "playing" | "finished";
export type RoomType = "friends" | "public";

export interface RoomPlayer {
  uid: string;
  name: string;
  seatIndex: number;
  ready: boolean;
  joinedAt: number;
  stack: number;
  active: boolean;
  /** Per-player chat toggle — when false, player cannot send or receive chat. */
  chatEnabled: boolean;
}

export interface ChatMessage {
  id: string;
  uid: string;
  name: string;
  text: string;
  createdAt: number;
}

export interface PokerRoom {
  id: string;
  code: string;
  roomType: RoomType;
  hostUid: string;
  tierId: string;
  buyIn: number;
  status: RoomStatus;
  players: Record<string, RoomPlayer>;
  gameState: GameState | null;
  actionSeq: number;
  maxSeats: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PlayerActionDoc {
  uid: string;
  seatIndex: number;
  action: { type: string; amount?: number };
  seq: number;
  applied: boolean;
  createdAt?: unknown;
}

export interface MatchmakingEntry {
  uid: string;
  name: string;
  tierId: string;
  buyIn: number;
  status: "waiting" | "matched";
  roomId: string | null;
  joinedAt: number;
}

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(len = 6): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CODE_CHARS[b % CODE_CHARS.length]).join("");
}

function activePlayers(room: Omit<PokerRoom, "id">): RoomPlayer[] {
  return Object.values(room.players).filter((p) => p.active);
}

function nextSeatIndex(players: RoomPlayer[]): number {
  const used = new Set(players.map((p) => p.seatIndex));
  for (let i = 0; i < MAX_PLAYERS; i++) {
    if (!used.has(i)) return i;
  }
  return MAX_PLAYERS;
}

function makePlayer(
  uid: string,
  name: string,
  seatIndex: number,
  buyIn: number,
  ready: boolean,
): RoomPlayer {
  return {
    uid,
    name,
    seatIndex,
    ready,
    joinedAt: Date.now(),
    stack: buyIn,
    active: true,
    chatEnabled: true,
  };
}

async function reserveCode(code: string, roomId: string, hostUid: string, tx: Parameters<Parameters<typeof runTransaction>[1]>[0]): Promise<void> {
  const codeRef = doc(db, "roomCodes", code);
  const codeSnap = await tx.get(codeRef);
  if (codeSnap.exists()) throw new Error("Room code collision — try again.");
  tx.set(codeRef, { roomId, hostUid, createdAt: serverTimestamp() });
}

export async function createFriendsRoom(
  hostUid: string,
  hostName: string,
  tier: TableTier,
  buyIn: number,
): Promise<{ roomId: string; code: string }> {
  const roomId = doc(collection(db, "pokerRooms")).id;
  let code = randomCode();
  for (let i = 0; i < 5; i++) {
    const existing = await getDoc(doc(db, "roomCodes", code));
    if (!existing.exists()) break;
    code = randomCode();
  }

  const room: Omit<PokerRoom, "id"> = {
    code,
    roomType: "friends",
    hostUid,
    tierId: tier.id,
    buyIn,
    status: "lobby",
    players: { [hostUid]: makePlayer(hostUid, hostName, 0, buyIn, false) },
    gameState: null,
    actionSeq: 0,
    maxSeats: MAX_PLAYERS,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await runTransaction(db, async (tx) => {
    await reserveCode(code, roomId, hostUid, tx);
    tx.set(doc(db, "pokerRooms", roomId), room);
  });

  return { roomId, code };
}

/** @deprecated Use createFriendsRoom */
export const createRoom = createFriendsRoom;

export async function createPublicRoom(
  hostUid: string,
  hostName: string,
  tier: TableTier,
  buyIn: number,
): Promise<{ roomId: string; code: string }> {
  const roomId = doc(collection(db, "pokerRooms")).id;
  const code = randomCode();

  const room: Omit<PokerRoom, "id"> = {
    code,
    roomType: "public",
    hostUid,
    tierId: tier.id,
    buyIn,
    status: "lobby",
    players: { [hostUid]: makePlayer(hostUid, hostName, 0, buyIn, false) },
    gameState: null,
    actionSeq: 0,
    maxSeats: MAX_PLAYERS,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await runTransaction(db, async (tx) => {
    await reserveCode(code, roomId, hostUid, tx);
    tx.set(doc(db, "pokerRooms", roomId), room);
  });

  return { roomId, code };
}

export async function joinRoomByCode(
  code: string,
  uid: string,
  name: string,
): Promise<{ roomId: string; room: PokerRoom }> {
  const normalized = code.trim().toUpperCase();
  const codeSnap = await getDoc(doc(db, "roomCodes", normalized));
  if (!codeSnap.exists()) throw new Error("Room not found. Check the code and try again.");
  const { roomId } = codeSnap.data() as { roomId: string };

  const roomRef = doc(db, "pokerRooms", roomId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(roomRef);
    if (!snap.exists()) throw new Error("Room no longer exists.");
    const room = snap.data() as Omit<PokerRoom, "id">;
    if (room.status !== "lobby") throw new Error("Game already in progress.");
    if (room.players[uid]?.active) return;
    const seated = activePlayers(room);
    if (seated.length >= room.maxSeats) throw new Error("Room is full (max 6 players).");

    const seatIndex = nextSeatIndex(seated);
    const player = makePlayer(uid, name, seatIndex, room.buyIn, false);
    tx.update(roomRef, {
      [`players.${uid}`]: player,
      updatedAt: serverTimestamp(),
    });
  });

  const roomSnap = await getDoc(roomRef);
  const data = roomSnap.data() as Omit<PokerRoom, "id">;
  return { roomId, room: { id: roomId, ...data } };
}

/** @deprecated Use joinRoomByCode */
export const joinRoom = joinRoomByCode;

export async function joinPublicRoom(
  roomId: string,
  uid: string,
  name: string,
): Promise<void> {
  const roomRef = doc(db, "pokerRooms", roomId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(roomRef);
    if (!snap.exists()) throw new Error("Room no longer exists.");
    const room = snap.data() as Omit<PokerRoom, "id">;
    if (room.roomType !== "public") throw new Error("Not a public room.");
    if (room.status !== "lobby") throw new Error("Game already in progress.");
    if (room.players[uid]?.active) return;
    const seated = activePlayers(room);
    if (seated.length >= room.maxSeats) throw new Error("Room is full.");

    const seatIndex = nextSeatIndex(seated);
    tx.update(roomRef, {
      [`players.${uid}`]: makePlayer(uid, name, seatIndex, room.buyIn, false),
      updatedAt: serverTimestamp(),
    });
  });
}

export async function leaveRoom(roomId: string, uid: string): Promise<void> {
  const roomRef = doc(db, "pokerRooms", roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return;
  const room = snap.data() as Omit<PokerRoom, "id">;
  if (room.hostUid === uid && room.status === "lobby") {
    await updateDoc(doc(db, "roomCodes", room.code), { expired: true }).catch(() => undefined);
  }
  await updateDoc(roomRef, {
    [`players.${uid}.active`]: false,
    updatedAt: serverTimestamp(),
  });
}

export async function setPlayerReady(
  roomId: string,
  uid: string,
  ready: boolean,
): Promise<void> {
  await updateDoc(doc(db, "pokerRooms", roomId), {
    [`players.${uid}.ready`]: ready,
    updatedAt: serverTimestamp(),
  });
}

export async function setPlayerChatEnabled(
  roomId: string,
  uid: string,
  enabled: boolean,
): Promise<void> {
  await updateDoc(doc(db, "pokerRooms", roomId), {
    [`players.${uid}.chatEnabled`]: enabled,
    updatedAt: serverTimestamp(),
  });
}

export async function sendChatMessage(
  roomId: string,
  uid: string,
  name: string,
  text: string,
  senderChatEnabled: boolean,
): Promise<void> {
  if (!senderChatEnabled || !text.trim()) return;
  const msgId = `${uid}_${Date.now()}`;
  await setDoc(doc(db, "pokerRooms", roomId, "chat", msgId), {
    uid,
    name,
    text: text.trim().slice(0, 280),
    createdAt: serverTimestamp(),
  });
}

export async function startRoomGame(
  roomId: string,
  gameState: GameState,
): Promise<void> {
  await updateDoc(doc(db, "pokerRooms", roomId), {
    status: "playing",
    gameState: stripUndefined(gameState),
    actionSeq: 0,
    updatedAt: serverTimestamp(),
  });
}

export async function updateRoomGameState(
  roomId: string,
  gameState: GameState,
  actionSeq: number,
): Promise<void> {
  await updateDoc(doc(db, "pokerRooms", roomId), {
    gameState: stripUndefined(gameState),
    actionSeq,
    updatedAt: serverTimestamp(),
  });
}

export async function markActionApplied(
  roomId: string,
  actionDocId: string,
): Promise<void> {
  await updateDoc(doc(db, "pokerRooms", roomId, "playerActions", actionDocId), {
    applied: true,
  });
}

export async function submitPlayerAction(
  roomId: string,
  uid: string,
  seatIndex: number,
  action: { type: string; amount?: number },
  seq: number,
): Promise<string> {
  const actionId = `${uid}_${seq}_${Date.now()}`;
  await setDoc(doc(db, "pokerRooms", roomId, "playerActions", actionId), {
    uid,
    seatIndex,
    action,
    seq,
    applied: false,
    createdAt: serverTimestamp(),
  });
  return actionId;
}

export function subscribeToRoom(
  roomId: string,
  onUpdate: (room: PokerRoom | null) => void,
): Unsubscribe {
  return onSnapshot(doc(db, "pokerRooms", roomId), (snap) => {
    if (!snap.exists()) {
      onUpdate(null);
      return;
    }
    onUpdate({ id: snap.id, ...(snap.data() as Omit<PokerRoom, "id">) });
  });
}

export function subscribeToPlayerActions(
  roomId: string,
  onAction: (id: string, action: PlayerActionDoc) => void,
): Unsubscribe {
  return onSnapshot(collection(db, "pokerRooms", roomId, "playerActions"), (snap) => {
    for (const change of snap.docChanges()) {
      if (change.type === "added" || change.type === "modified") {
        onAction(change.doc.id, change.doc.data() as PlayerActionDoc);
      }
    }
  });
}

export function subscribeToChat(
  roomId: string,
  viewerChatEnabled: boolean,
  onMessages: (messages: ChatMessage[]) => void,
): Unsubscribe {
  if (!viewerChatEnabled) {
    onMessages([]);
    return () => undefined;
  }
  const q = query(collection(db, "pokerRooms", roomId, "chat"));
  return onSnapshot(q, (snap) => {
    const msgs: ChatMessage[] = snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          uid: data.uid as string,
          name: data.name as string,
          text: data.text as string,
          createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
        };
      })
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(-50);
    onMessages(msgs);
  });
}

export function filterGameStateForViewer(
  state: GameState,
  viewerSeatIndex: number,
): GameState {
  const showdown =
    state.stage === "complete" && !!state.result && !state.result.uncontested;
  return {
    ...state,
    deck: [],
    seats: state.seats.map((s) => {
      const maySee =
        s.index === viewerSeatIndex || (showdown && s.status !== "folded");
      if (maySee) return s;
      return {
        ...s,
        holeCards: s.holeCards.length
          ? (["??", "??"] as typeof s.holeCards)
          : [],
      };
    }),
  };
}

// --------------------------- Matchmaking --------------------------------

export async function enterMatchmakingQueue(
  uid: string,
  name: string,
  tierId: string,
  buyIn: number,
): Promise<void> {
  await setDoc(doc(db, "matchmakingQueue", uid), {
    uid,
    name,
    tierId,
    buyIn,
    status: "waiting",
    roomId: null,
    joinedAt: Date.now(),
  });
}

export async function leaveMatchmakingQueue(uid: string): Promise<void> {
  await deleteDoc(doc(db, "matchmakingQueue", uid)).catch(() => undefined);
}

export function subscribeToMatchmakingEntry(
  uid: string,
  onUpdate: (entry: MatchmakingEntry | null) => void,
): Unsubscribe {
  return onSnapshot(doc(db, "matchmakingQueue", uid), (snap) => {
    if (!snap.exists()) {
      onUpdate(null);
      return;
    }
    onUpdate(snap.data() as MatchmakingEntry);
  });
}

export function subscribeToMatchmakingPool(
  tierId: string,
  onUpdate: (entries: MatchmakingEntry[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, "matchmakingQueue"),
    where("tierId", "==", tierId),
    where("status", "==", "waiting"),
  );
  return onSnapshot(q, (snap) => {
    onUpdate(snap.docs.map((d) => d.data() as MatchmakingEntry));
  });
}

/**
 * Attempt to match waiting players into a public room.
 * Called by the oldest waiting player when pool has enough players.
 */
export async function tryMatchPublicTable(
  tier: TableTier,
  buyIn: number,
  waitingUids: string[],
): Promise<string | null> {
  if (waitingUids.length < 1) return null;

  const hostUid = waitingUids[0];
  const hostEntry = await getDoc(doc(db, "matchmakingQueue", hostUid));
  if (!hostEntry.exists()) return null;
  const hostName = (hostEntry.data() as MatchmakingEntry).name;

  const { roomId } = await createPublicRoom(hostUid, hostName, tier, buyIn);

  await runTransaction(db, async (tx) => {
    const roomRef = doc(db, "pokerRooms", roomId);
    const roomSnap = await tx.get(roomRef);
    if (!roomSnap.exists()) throw new Error("Room missing");

    for (let i = 1; i < Math.min(waitingUids.length, MAX_PLAYERS); i++) {
      const uid = waitingUids[i];
      const entrySnap = await tx.get(doc(db, "matchmakingQueue", uid));
      if (!entrySnap.exists()) continue;
      const entry = entrySnap.data() as MatchmakingEntry;
      const seated = activePlayers(roomSnap.data() as Omit<PokerRoom, "id">);
      const seatIndex = nextSeatIndex(seated);
      tx.update(roomRef, {
        [`players.${uid}`]: makePlayer(uid, entry.name, seatIndex, buyIn, false),
      });
    }

    for (const uid of waitingUids.slice(0, MAX_PLAYERS)) {
      tx.update(doc(db, "matchmakingQueue", uid), {
        status: "matched",
        roomId,
      });
    }
  });

  return roomId;
}

/** Find an open public lobby room with space for the given tier. */
export async function findOpenPublicRoom(tierId: string): Promise<string | null> {
  const q = query(
    collection(db, "pokerRooms"),
    where("roomType", "==", "public"),
    where("tierId", "==", tierId),
    where("status", "==", "lobby"),
  );
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    const room = d.data() as Omit<PokerRoom, "id">;
    if (activePlayers(room).length < room.maxSeats) return d.id;
  }
  return null;
}

export async function matchmakePublic(
  uid: string,
  name: string,
  tier: TableTier,
  buyIn: number,
): Promise<{ roomId: string; matched: boolean }> {
  const existing = await findOpenPublicRoom(tier.id);
  if (existing) {
    await joinPublicRoom(existing, uid, name);
    return { roomId: existing, matched: true };
  }

  await enterMatchmakingQueue(uid, name, tier.id, buyIn);
  return { roomId: "", matched: false };
}
