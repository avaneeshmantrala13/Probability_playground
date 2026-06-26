import type { CharacterLook } from "../../components/pokernight/characters";

export type CharacterTier = "basic" | "casual" | "sharp" | "luxury" | "legend";

export interface PlayerCharacter {
  id: string;
  name: string;
  tier: CharacterTier;
  look: CharacterLook;
  price: number;
  description: string;
}

export const DEFAULT_OUTFIT_EQUIP_ID = "outfit-default";
