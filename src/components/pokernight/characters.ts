import type { Persona } from "../../lib/poker";

/**
 * Visual "character" definitions for Poker Night — 100% client-side CSS/SVG.
 *
 * These looks are pure presentation data (no runtime API/LLM calls). Each one is
 * keyed to a persona id from `src/lib/poker/personalities.ts` so an opponent's
 * appearance matches their playing personality. The shapes are drawn
 * parametrically by `PokerAvatar.tsx`.
 */

export type HairStyle = "short" | "slick" | "long" | "buzz" | "bald" | "tuft";
export type HatStyle = "top" | "cap" | "visor" | "headband" | "none";
export type EyeStyle = "normal" | "shades" | "glasses" | "focused";
export type BrowStyle = "angry" | "calm" | "raised" | "neutral";
export type MouthStyle = "smile" | "smirk" | "grin" | "flat" | "tough" | "open";

export interface CharacterLook {
  /** Face skin tone. */
  skin: string;
  /** Subtle shading tone for the jaw/cheek. */
  skinShade: string;
  hair: string;
  hairStyle: HairStyle;
  hat: HatStyle;
  hatColor: string;
  eyes: EyeStyle;
  brow: BrowStyle;
  mouth: MouthStyle;
  /** Shirt / outfit fill. */
  outfit: string;
  /** Collar / tie / trim accent on the outfit. */
  outfitTrim: string;
  /** Ring + glow accent that frames the whole character. */
  accent: string;
}

/** The human ("You") — a neutral, friendly hero look. */
export const HUMAN_LOOK: CharacterLook = {
  skin: "#e8b98f",
  skinShade: "#d29a6c",
  hair: "#3b2a20",
  hairStyle: "short",
  hat: "none",
  hatColor: "#000",
  eyes: "normal",
  brow: "neutral",
  mouth: "smile",
  outfit: "#2563eb",
  outfitTrim: "#bfdbfe",
  accent: "#60a5fa",
};

/** The non-playing croupier at the top of the table. */
export const DEALER_LOOK: CharacterLook = {
  skin: "#f0c9a0",
  skinShade: "#dba778",
  hair: "#2b2b33",
  hairStyle: "slick",
  hat: "visor",
  hatColor: "#0f766e",
  eyes: "normal",
  brow: "calm",
  mouth: "smile",
  outfit: "#0f172a",
  outfitTrim: "#e2e8f0",
  accent: "#38bdf8",
};

/** Per-persona looks, keyed by persona id. */
const LOOKS: Record<string, CharacterLook> = {
  // Dot — warm, theatrical host in a magician's top hat.
  "dealer-dot": {
    skin: "#f3cba3",
    skinShade: "#e0ab78",
    hair: "#241c2b",
    hairStyle: "short",
    hat: "top",
    hatColor: "#3b2155",
    eyes: "normal",
    brow: "raised",
    mouth: "grin",
    outfit: "#6d28d9",
    outfitTrim: "#f5d0fe",
    accent: "#c084fc",
  },
  // Rocky — aggressive brawler with a red headband and a tough scowl.
  rocky: {
    skin: "#d79a6a",
    skinShade: "#bd7f50",
    hair: "#1c140e",
    hairStyle: "buzz",
    hat: "headband",
    hatColor: "#dc2626",
    eyes: "focused",
    brow: "angry",
    mouth: "tough",
    outfit: "#b91c1c",
    outfitTrim: "#fca5a5",
    accent: "#f87171",
  },
  // Nova — precise mathematician in studious glasses.
  nova: {
    skin: "#e7be98",
    skinShade: "#cfa178",
    hair: "#0f172a",
    hairStyle: "slick",
    hat: "none",
    hatColor: "#000",
    eyes: "glasses",
    brow: "calm",
    mouth: "flat",
    outfit: "#0f766e",
    outfitTrim: "#99f6e4",
    accent: "#2dd4bf",
  },
  // Lucky — freckled, grinning gambler under a green flat cap.
  lucky: {
    skin: "#f0c19b",
    skinShade: "#d9a472",
    hair: "#b45309",
    hairStyle: "tuft",
    hat: "cap",
    hatColor: "#15803d",
    eyes: "normal",
    brow: "raised",
    mouth: "grin",
    outfit: "#16a34a",
    outfitTrim: "#bbf7d0",
    accent: "#4ade80",
  },
  // Sterling ("shark") — slick high-roller in dark shades.
  shark: {
    skin: "#dcae84",
    skinShade: "#c2925f",
    hair: "#15171c",
    hairStyle: "slick",
    hat: "none",
    hatColor: "#000",
    eyes: "shades",
    brow: "neutral",
    mouth: "smirk",
    outfit: "#1f2937",
    outfitTrim: "#94a3b8",
    accent: "#38bdf8",
  },
  // River — serene, long-haired, calm under pressure.
  river: {
    skin: "#e9c4a0",
    skinShade: "#d2a87f",
    hair: "#1e3a5f",
    hairStyle: "long",
    hat: "none",
    hatColor: "#000",
    eyes: "normal",
    brow: "calm",
    mouth: "smile",
    outfit: "#0369a1",
    outfitTrim: "#bae6fd",
    accent: "#38bdf8",
  },
};

const FALLBACK: CharacterLook = {
  skin: "#e3b98f",
  skinShade: "#cb9d6f",
  hair: "#2a2a2a",
  hairStyle: "short",
  hat: "none",
  hatColor: "#000",
  eyes: "normal",
  brow: "neutral",
  mouth: "smile",
  outfit: "#475569",
  outfitTrim: "#cbd5e1",
  accent: "#94a3b8",
};

/** Resolve the look for a seat's persona (human/unknown -> sensible defaults). */
export function getLook(persona?: Persona, isHuman?: boolean): CharacterLook {
  if (isHuman) return HUMAN_LOOK;
  if (persona && LOOKS[persona.id]) return LOOKS[persona.id];
  return FALLBACK;
}
