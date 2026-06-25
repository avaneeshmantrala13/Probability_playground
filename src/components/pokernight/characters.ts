import type { Persona } from "../../lib/poker";

/**
 * Visual "character" definitions for Poker Night — 100% client-side CSS/SVG.
 *
 * These looks are pure presentation data (no runtime API/LLM calls). Each one is
 * keyed to a persona id from `src/lib/poker/personalities.ts` so an opponent's
 * appearance matches their playing personality. The shapes are drawn
 * parametrically by `face.tsx` (head + features) and `PokerFigure.tsx`
 * (seated full body), so every player reads as a distinct, real-looking person.
 */

/**
 * A live emotional state driven by the game (not a fixed persona trait). The
 * face renders brows/eyes/mouth differently per expression so characters look
 * like they're reacting in real time. `idle` falls back to the persona's resting
 * brow/mouth.
 */
export type Expression =
  | "idle"
  | "think"
  | "concerned"
  | "smug"
  | "happy"
  | "sad";

export type HairStyle = "short" | "slick" | "long" | "buzz" | "bald" | "tuft" | "afro";
export type HatStyle = "top" | "cap" | "visor" | "headband" | "fedora" | "none";
export type EyeStyle = "normal" | "shades" | "glasses" | "focused";
export type BrowStyle = "angry" | "calm" | "raised" | "neutral";
export type MouthStyle = "smile" | "smirk" | "grin" | "flat" | "tough" | "open";
/** Facial hair adds a lot of person-to-person variety. */
export type FacialHair = "none" | "stubble" | "mustache" | "goatee" | "beard" | "fullbeard";
/** Body build drives torso/shoulder width on the seated figure. */
export type Build = "slim" | "average" | "broad";
/** Seated posture nudges shoulder height / lean so figures don't look cloned. */
export type Posture = "lean" | "upright" | "relaxed";
/** A small accessory at the neck/ear for extra individuality. */
export type Accessory = "none" | "tie" | "bowtie" | "scarf" | "chain" | "earring";

export interface CharacterLook {
  /** Face skin tone (mid). */
  skin: string;
  /** Lit highlight tone for the upper-left key light (optional). */
  skinLight?: string;
  /** Subtle shading tone for the jaw/cheek. */
  skinShade: string;
  hair: string;
  /** Lit hair highlight tone (optional). */
  hairLight?: string;
  /** Iris color (optional; defaults to brown). */
  eyeColor?: string;
  hairStyle: HairStyle;
  hat: HatStyle;
  hatColor: string;
  eyes: EyeStyle;
  brow: BrowStyle;
  mouth: MouthStyle;
  facialHair: FacialHair;
  /** Shirt / outfit fill. */
  outfit: string;
  /** Collar / tie / trim accent on the outfit. */
  outfitTrim: string;
  /** Ring + glow accent that frames the whole character. */
  accent: string;
  build: Build;
  posture: Posture;
  accessory: Accessory;
  /** Optional freckles dusting (e.g. Lucky). */
  freckles?: boolean;
  /**
   * Fabric material, 0 = matte (cotton/knit) → 1 = glossy (satin/silk). Drives
   * how strong the sheen highlight on the clothing reads, so personas feel like
   * they're wearing different materials. Defaults to ~0.4 when omitted.
   */
  sheen?: number;
}

/** The human ("You") — a neutral, friendly hero look. */
export const HUMAN_LOOK: CharacterLook = {
  skin: "#e8b98f",
  skinLight: "#f6d3ac",
  skinShade: "#cf9568",
  hair: "#3b2a20",
  hairLight: "#5a4031",
  eyeColor: "#6b4a2f",
  hairStyle: "short",
  hat: "none",
  hatColor: "#000",
  eyes: "normal",
  brow: "neutral",
  mouth: "smile",
  facialHair: "none",
  outfit: "#2563eb",
  outfitTrim: "#bfdbfe",
  accent: "#60a5fa",
  build: "average",
  posture: "upright",
  accessory: "none",
};

/** The non-playing croupier — sharp, clever, attentive house dealer in a suit. */
export const DEALER_LOOK: CharacterLook = {
  skin: "#d9ae82",
  skinLight: "#ecc89c",
  skinShade: "#b9874f",
  hair: "#1c1c24",
  hairLight: "#33323f",
  eyeColor: "#3d4f63",
  hairStyle: "slick",
  hat: "none",
  hatColor: "#0f766e",
  eyes: "glasses",
  brow: "raised",
  mouth: "smirk",
  facialHair: "none",
  outfit: "#0b1020",
  outfitTrim: "#f1f5f9",
  accent: "#38bdf8",
  build: "average",
  posture: "upright",
  accessory: "bowtie",
  sheen: 0.9,
};

/** Per-persona looks, keyed by persona id. */
const LOOKS: Record<string, CharacterLook> = {
  // Dot — warm, theatrical host in a magician's top hat & bowtie.
  "dealer-dot": {
    skin: "#f3cba3",
    skinLight: "#ffe2bd",
    skinShade: "#dca36f",
    hair: "#241c2b",
    hairLight: "#3d3147",
    eyeColor: "#5b3b6b",
    hairStyle: "short",
    hat: "top",
    hatColor: "#3b2155",
    eyes: "normal",
    brow: "raised",
    mouth: "grin",
    facialHair: "mustache",
    outfit: "#6d28d9",
    outfitTrim: "#f5d0fe",
    accent: "#c084fc",
    build: "average",
    posture: "upright",
    accessory: "bowtie",
  },
  // Rocky — aggressive brawler: broad, leaning in, red headband, gold chain.
  rocky: {
    skin: "#a96f44",
    skinLight: "#c98a59",
    skinShade: "#82532f",
    hair: "#150f0a",
    hairLight: "#2c2018",
    eyeColor: "#3b2415",
    hairStyle: "buzz",
    hat: "headband",
    hatColor: "#dc2626",
    eyes: "focused",
    brow: "angry",
    mouth: "tough",
    facialHair: "goatee",
    outfit: "#b91c1c",
    outfitTrim: "#fca5a5",
    accent: "#f87171",
    build: "broad",
    posture: "lean",
    accessory: "chain",
    sheen: 0.2,
  },
  // Nova — precise mathematician: slim, upright, glasses, neat tie.
  nova: {
    skin: "#e7be98",
    skinLight: "#f7d6b3",
    skinShade: "#c89a70",
    hair: "#0f172a",
    hairLight: "#27324a",
    eyeColor: "#2f4858",
    hairStyle: "slick",
    hat: "none",
    hatColor: "#000",
    eyes: "glasses",
    brow: "calm",
    mouth: "flat",
    facialHair: "none",
    outfit: "#0f766e",
    outfitTrim: "#99f6e4",
    accent: "#2dd4bf",
    build: "slim",
    posture: "upright",
    accessory: "tie",
    sheen: 0.5,
  },
  // Lucky — freckled, grinning gambler under a green flat cap, hoop earring.
  lucky: {
    skin: "#f0c19b",
    skinLight: "#ffdab4",
    skinShade: "#d49b66",
    hair: "#b45309",
    hairLight: "#d97718",
    eyeColor: "#4a7c59",
    hairStyle: "tuft",
    hat: "cap",
    hatColor: "#15803d",
    eyes: "normal",
    brow: "raised",
    mouth: "grin",
    facialHair: "stubble",
    outfit: "#16a34a",
    outfitTrim: "#bbf7d0",
    accent: "#4ade80",
    build: "average",
    posture: "relaxed",
    accessory: "earring",
    freckles: true,
  },
  // Sterling ("shark") — deep-skinned slick high-roller in dark shades & suit.
  shark: {
    skin: "#7c5230",
    skinLight: "#9a6c44",
    skinShade: "#5c3a1e",
    hair: "#100f14",
    hairLight: "#262430",
    eyeColor: "#2a1c12",
    hairStyle: "slick",
    hat: "none",
    hatColor: "#000",
    eyes: "shades",
    brow: "neutral",
    mouth: "smirk",
    facialHair: "goatee",
    outfit: "#1f2937",
    outfitTrim: "#cbd5e1",
    accent: "#38bdf8",
    build: "broad",
    posture: "relaxed",
    accessory: "tie",
    sheen: 0.85,
  },
  // River — serene, long-haired, calm under pressure, soft beard & scarf.
  river: {
    skin: "#e9c4a0",
    skinLight: "#f8dabb",
    skinShade: "#cfa478",
    hair: "#1e3a5f",
    hairLight: "#2f547f",
    eyeColor: "#36607a",
    hairStyle: "long",
    hat: "none",
    hatColor: "#000",
    eyes: "normal",
    brow: "calm",
    mouth: "smile",
    facialHair: "beard",
    outfit: "#0369a1",
    outfitTrim: "#bae6fd",
    accent: "#38bdf8",
    build: "slim",
    posture: "relaxed",
    accessory: "scarf",
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
  facialHair: "none",
  outfit: "#475569",
  outfitTrim: "#cbd5e1",
  accent: "#94a3b8",
  build: "average",
  posture: "upright",
  accessory: "none",
};

/** Resolve the look for a seat's persona (human/unknown -> sensible defaults). */
export function getLook(persona?: Persona, isHuman?: boolean): CharacterLook {
  if (isHuman) return HUMAN_LOOK;
  if (persona && LOOKS[persona.id]) return LOOKS[persona.id];
  return FALLBACK;
}
