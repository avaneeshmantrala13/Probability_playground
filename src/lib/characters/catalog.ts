import type {
  Accessory,
  BrowStyle,
  Build,
  CharacterLook,
  EyeStyle,
  FacialHair,
  HairStyle,
  HatStyle,
  MouthStyle,
  Posture,
} from "../../components/pokernight/characters";
import type { CharacterTier, PlayerCharacter } from "./types";

const SKINS = [
  { skin: "#f0c9a5", skinLight: "#ffe2c4", skinShade: "#d4a574" },
  { skin: "#e8b98f", skinLight: "#f6d3ac", skinShade: "#cf9568" },
  { skin: "#ddb184", skinLight: "#f0cba0", skinShade: "#b8874f" },
  { skin: "#c9956a", skinLight: "#e0b088", skinShade: "#a67345" },
  { skin: "#a96f44", skinLight: "#c98a59", skinShade: "#82532f" },
  { skin: "#8d5a38", skinLight: "#a8724f", skinShade: "#6b3f24" },
  { skin: "#7c5230", skinLight: "#9a6c44", skinShade: "#5c3a1e" },
  { skin: "#5c3d2e", skinLight: "#7a5540", skinShade: "#3f281c" },
];

const HAIRS: { hair: string; hairLight: string; style: HairStyle }[] = [
  { hair: "#1a1410", hairLight: "#2e241c", style: "short" },
  { hair: "#2a1f18", hairLight: "#403028", style: "short" },
  { hair: "#3b2a20", hairLight: "#5a4031", style: "short" },
  { hair: "#1c1c24", hairLight: "#33323f", style: "slick" },
  { hair: "#0f172a", hairLight: "#27324a", style: "slick" },
  { hair: "#4a3728", hairLight: "#6b5040", style: "tuft" },
  { hair: "#6b3b1f", hairLight: "#8f5428", style: "tuft" },
  { hair: "#8b4513", hairLight: "#a85c28", style: "long" },
  { hair: "#1e3a5f", hairLight: "#2f547f", style: "long" },
  { hair: "#150f0a", hairLight: "#2c2018", style: "buzz" },
  { hair: "#2d1b4e", hairLight: "#452a6e", style: "afro" },
  { hair: "#3d2914", hairLight: "#5c3f20", style: "afro" },
];

const SUITS = [
  { outfit: "#2563eb", outfitTrim: "#bfdbfe", accent: "#60a5fa", name: "Sapphire" },
  { outfit: "#dc2626", outfitTrim: "#fecaca", accent: "#f87171", name: "Ruby" },
  { outfit: "#16a34a", outfitTrim: "#bbf7d0", accent: "#4ade80", name: "Emerald" },
  { outfit: "#ca8a04", outfitTrim: "#fef08a", accent: "#facc15", name: "Gold" },
  { outfit: "#7c3aed", outfitTrim: "#ddd6fe", accent: "#a78bfa", name: "Amethyst" },
  { outfit: "#db2777", outfitTrim: "#fbcfe8", accent: "#f472b6", name: "Magenta" },
  { outfit: "#0d9488", outfitTrim: "#99f6e4", accent: "#2dd4bf", name: "Teal" },
  { outfit: "#ea580c", outfitTrim: "#fed7aa", accent: "#fb923c", name: "Copper" },
  { outfit: "#475569", outfitTrim: "#cbd5e1", accent: "#94a3b8", name: "Slate" },
  { outfit: "#1e3a8a", outfitTrim: "#bfdbfe", accent: "#3b82f6", name: "Navy" },
  { outfit: "#881337", outfitTrim: "#fecdd3", accent: "#fb7185", name: "Burgundy" },
  { outfit: "#065f46", outfitTrim: "#a7f3d0", accent: "#34d399", name: "Forest" },
  { outfit: "#4c1d95", outfitTrim: "#e9d5ff", accent: "#c084fc", name: "Violet" },
  { outfit: "#0f766e", outfitTrim: "#ccfbf1", accent: "#14b8a6", name: "Jade" },
  { outfit: "#b45309", outfitTrim: "#fde68a", accent: "#f59e0b", name: "Amber" },
  { outfit: "#1f2937", outfitTrim: "#e5e7eb", accent: "#9ca3af", name: "Charcoal" },
  { outfit: "#be123c", outfitTrim: "#fecdd3", accent: "#f43f5e", name: "Crimson" },
  { outfit: "#0369a1", outfitTrim: "#bae6fd", accent: "#38bdf8", name: "Ocean" },
  { outfit: "#5b21b6", outfitTrim: "#e9d5ff", accent: "#8b5cf6", name: "Royal" },
  { outfit: "#14532d", outfitTrim: "#bbf7d0", accent: "#22c55e", name: "Pine" },
];

const TIER_META: Record<CharacterTier, {
  prefix: string; label: string; count: number; priceBase: number; priceStep: number;
  sheen: [number, number]; hats: HatStyle[]; eyes: EyeStyle[]; accessories: Accessory[];
  facial: FacialHair[]; builds: Build[]; postures: Posture[]; brows: BrowStyle[];
  mouths: MouthStyle[]; extras: Partial<CharacterLook>;
}> = {
  basic: { prefix: "char-basic", label: "Classic", count: 20, priceBase: 0, priceStep: 0, sheen: [0.15, 0.35], hats: ["none", "none", "none", "cap", "headband"], eyes: ["normal", "normal", "focused"], accessories: ["none", "none", "tie"], facial: ["none", "none", "stubble"], builds: ["slim", "average", "average", "broad"], postures: ["upright", "upright", "relaxed"], brows: ["neutral", "calm", "raised"], mouths: ["smile", "flat", "smirk"], extras: {} },
  casual: { prefix: "char-casual", label: "Casual", count: 20, priceBase: 3200, priceStep: 180, sheen: [0.25, 0.45], hats: ["cap", "visor", "headband", "none", "fedora"], eyes: ["normal", "glasses", "focused"], accessories: ["tie", "bowtie", "scarf", "earring", "none"], facial: ["none", "stubble", "mustache"], builds: ["slim", "average", "petite", "broad"], postures: ["upright", "relaxed", "lean"], brows: ["neutral", "calm", "raised"], mouths: ["smile", "grin", "smirk"], extras: {} },
  sharp: { prefix: "char-sharp", label: "Sharp", count: 20, priceBase: 6200, priceStep: 320, sheen: [0.45, 0.65], hats: ["fedora", "visor", "none", "cap"], eyes: ["glasses", "shades", "focused", "normal"], accessories: ["tie", "bowtie", "chain", "scarf"], facial: ["stubble", "goatee", "mustache", "none"], builds: ["slim", "average", "broad"], postures: ["upright", "lean", "relaxed"], brows: ["calm", "raised", "neutral"], mouths: ["smirk", "flat", "smile"], extras: {} },
  luxury: { prefix: "char-luxury", label: "Luxury", count: 20, priceBase: 14500, priceStep: 650, sheen: [0.65, 0.85], hats: ["fedora", "top", "none"], eyes: ["shades", "glasses", "normal"], accessories: ["tie", "bowtie", "chain", "scarf"], facial: ["goatee", "beard", "mustache", "stubble"], builds: ["average", "broad", "slim", "heavyset"], postures: ["upright", "relaxed", "lean"], brows: ["neutral", "raised", "calm"], mouths: ["smirk", "grin", "smile"], extras: { monocle: true } },
  legend: { prefix: "char-legend", label: "Legend", count: 20, priceBase: 32000, priceStep: 1400, sheen: [0.8, 0.95], hats: ["top", "fedora", "none"], eyes: ["shades", "glasses", "normal"], accessories: ["bowtie", "chain", "tie", "scarf"], facial: ["fullbeard", "beard", "goatee", "mustache"], builds: ["broad", "heavyset", "average", "slim"], postures: ["upright", "lean", "relaxed"], brows: ["raised", "angry", "neutral"], mouths: ["grin", "smirk", "tough"], extras: { monocle: true, cigar: true } },
};

const HAT_COLORS = ["#1f2937", "#3b2155", "#7f1d1d", "#14532d", "#1e3a8a", "#78350f", "#0f766e"];
const pick = <T,>(arr: T[], i: number) => arr[i % arr.length];

function buildLook(tier: CharacterTier, index: number, suit: (typeof SUITS)[number], skin: (typeof SKINS)[number], hair: (typeof HAIRS)[number], meta: (typeof TIER_META)[CharacterTier]): CharacterLook {
  const [sheenLo, sheenHi] = meta.sheen;
  const sheen = sheenLo + (((index * 7) % 10) / 10) * (sheenHi - sheenLo);
  const monocle = meta.extras.monocle && index % 3 === 0;
  const cigar = meta.extras.cigar && index % 4 === 1;
  const freckles = tier === "casual" && index % 5 === 2;
  return {
    skin: skin.skin, skinLight: skin.skinLight, skinShade: skin.skinShade,
    hair: hair.hair, hairLight: hair.hairLight,
    eyeColor: pick(["#3d2914", "#2f4858", "#4a3728", "#1e3a5f", "#5b3b6b"], index),
    hairStyle: hair.style, hat: pick(meta.hats, index),
    hatColor: pick(HAT_COLORS, index + suit.outfit.charCodeAt(1)),
    eyes: pick(meta.eyes, index), brow: pick(meta.brows, index), mouth: pick(meta.mouths, index),
    facialHair: pick(meta.facial, index), outfit: suit.outfit, outfitTrim: suit.outfitTrim, accent: suit.accent,
    build: pick(meta.builds, index), posture: pick(meta.postures, index), accessory: pick(meta.accessories, index), sheen,
    ...(monocle ? { monocle: true } : {}), ...(cigar ? { cigar: true } : {}), ...(freckles ? { freckles: true } : {}),
  };
}

function tierDescription(tier: CharacterTier, suitName: string): string {
  const m: Record<CharacterTier, string> = {
    basic: `${suitName} suit — your free table default.`,
    casual: `Relaxed ${suitName.toLowerCase()} street style for the felt.`,
    sharp: `Tailored ${suitName.toLowerCase()} look — boardroom meets river.`,
    luxury: `High-roller ${suitName.toLowerCase()} ensemble with premium trim.`,
    legend: `Legendary ${suitName.toLowerCase()} regalia — table royalty.`,
  };
  return m[tier];
}

function generateCatalog(): PlayerCharacter[] {
  const out: PlayerCharacter[] = [];
  let globalIdx = 0;
  for (const tier of ["basic", "casual", "sharp", "luxury", "legend"] as CharacterTier[]) {
    const meta = TIER_META[tier];
    for (let i = 0; i < meta.count; i++) {
      const suit = SUITS[(globalIdx + i * 3) % SUITS.length];
      const skin = SKINS[(globalIdx + i) % SKINS.length];
      const hair = HAIRS[(globalIdx * 2 + i) % HAIRS.length];
      const id = `${meta.prefix}-${String(i + 1).padStart(2, "0")}`;
      out.push({
        id, name: `${meta.label} ${suit.name}`, tier,
        look: buildLook(tier, i, suit, skin, hair, meta),
        price: meta.priceBase > 0 ? meta.priceBase + i * meta.priceStep : 0,
        description: tierDescription(tier, suit.name),
      });
      globalIdx++;
    }
  }
  if (out.length !== 100) throw new Error(`Expected 100 characters, got ${out.length}`);
  return out;
}

export const PLAYER_CHARACTERS = generateCatalog();
export const BASIC_CHARACTER_IDS = PLAYER_CHARACTERS.filter((c) => c.tier === "basic").map((c) => c.id);
export const STORE_OUTFITS = PLAYER_CHARACTERS.filter((c) => c.price > 0);
