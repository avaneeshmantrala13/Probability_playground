import { PLAYER_CHARACTERS, BASIC_CHARACTER_IDS, STORE_OUTFITS } from "./catalog";
import { DEFAULT_OUTFIT_EQUIP_ID, type PlayerCharacter } from "./types";

const BY_ID = new Map(PLAYER_CHARACTERS.map((c) => [c.id, c]));

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function assignDefaultCharacterId(uid: string, seatIndex: number): string {
  return BASIC_CHARACTER_IDS[hashString(`${uid}:${seatIndex}`) % BASIC_CHARACTER_IDS.length];
}

export function preferredJoinCharacterId(
  equippedOutfitId: string | undefined,
  ownedCosmetics: string[],
): string | undefined {
  if (
    equippedOutfitId &&
    equippedOutfitId !== DEFAULT_OUTFIT_EQUIP_ID &&
    ownedCosmetics.includes(equippedOutfitId) &&
    BY_ID.has(equippedOutfitId)
  ) {
    return equippedOutfitId;
  }
  return undefined;
}

export function resolveJoinCharacterId(
  uid: string,
  seatIndex: number,
  equippedOutfitId: string | undefined,
  ownedCosmetics: string[],
): string {
  return preferredJoinCharacterId(equippedOutfitId, ownedCosmetics)
    ?? assignDefaultCharacterId(uid, seatIndex);
}

export function getCharacter(id: string): PlayerCharacter | undefined {
  return BY_ID.get(id);
}

export function getCharacterLook(id: string) {
  return BY_ID.get(id)?.look;
}

export { PLAYER_CHARACTERS, BASIC_CHARACTER_IDS, STORE_OUTFITS, DEFAULT_OUTFIT_EQUIP_ID };
export type { CharacterTier, PlayerCharacter } from "./types";
