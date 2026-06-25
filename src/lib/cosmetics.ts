import type { CosmeticCategory } from "./progress";

/**
 * Cosmetic catalog for the poker token economy. This is DATA ONLY (no React) so
 * both the poker table (which renders equipped deck/table visuals) and the store
 * (which renders/sells them) can read the exact same source of truth.
 *
 * RGB values are space-separated triplets ("R G B") to match the CSS custom
 * properties in index.css (e.g. --color-accent: 79 70 229), so accent themes can
 * be applied by overriding those variables.
 */

export interface CosmeticBase {
  id: string;
  category: CosmeticCategory;
  name: string;
  description: string;
  /** Price in tokens. 0 = free default (always owned). */
  price: number;
}

export type DeckPattern =
  | "diagonal"
  | "dots"
  | "grid"
  | "stars"
  | "waves"
  | "solid";

export interface DeckSkin extends CosmeticBase {
  category: "deckSkin";
  /** CSS for the card back surface (gradient or color). */
  background: string;
  /** Border color (CSS) for the card. */
  border: string;
  /** Ink/emblem color (CSS) drawn on the back. */
  ink: string;
  pattern: DeckPattern;
}

export interface TableTheme extends CosmeticBase {
  category: "tableTheme";
  /** CSS for the felt playing surface. */
  felt: string;
  /** CSS color for the table rail/edge. */
  rail: string;
  /** Accent/glow color (CSS) for highlights at this table. */
  glow: string;
  /** Text color (CSS) that reads well on the felt. */
  text: string;
}

export interface AccentVars {
  accent: string;
  accentHover: string;
  accentContrast: string;
  accent2: string;
  accent2Hover: string;
}

export interface AccentTheme extends CosmeticBase {
  category: "accentTheme";
  /** Preview swatch colors (CSS) for the store card. */
  swatch: [string, string];
  light: AccentVars;
  dark: AccentVars;
}

export interface ChipStyle extends CosmeticBase {
  category: "chipStyle";
  /** CSS gradient for chip face. */
  face: string;
  edge: string;
  label: string;
}

export interface AvatarAccessory extends CosmeticBase {
  category: "avatarAccessory";
  /** Emoji or short label shown on avatar. */
  emoji: string;
  /** CSS color accent for the accessory badge. */
  color: string;
}

export interface WinAnimation extends CosmeticBase {
  category: "animation";
  /** CSS class name applied on big wins. */
  cssClass: string;
}

export type Cosmetic =
  | DeckSkin
  | TableTheme
  | AccentTheme
  | ChipStyle
  | AvatarAccessory
  | WinAnimation;

// ----------------------------- Deck skins -----------------------------

export const DECK_SKINS: DeckSkin[] = [
  {
    id: "deck-classic",
    category: "deckSkin",
    name: "Classic Red",
    description: "The timeless crimson card back.",
    price: 0,
    background: "linear-gradient(135deg, #c0303a 0%, #8d1b27 100%)",
    border: "#f4d7da",
    ink: "#f7e9ea",
    pattern: "diagonal",
  },
  {
    id: "deck-midnight",
    category: "deckSkin",
    name: "Midnight",
    description: "Deep indigo with a starfield shimmer.",
    price: 350,
    background: "linear-gradient(135deg, #1e1b4b 0%, #0b1029 100%)",
    border: "#7c83ff",
    ink: "#aab0ff",
    pattern: "stars",
  },
  {
    id: "deck-emerald",
    category: "deckSkin",
    name: "Emerald Weave",
    description: "Lush green with a woven grid.",
    price: 350,
    background: "linear-gradient(135deg, #064e3b 0%, #022c22 100%)",
    border: "#34d399",
    ink: "#6ee7b7",
    pattern: "grid",
  },
  {
    id: "deck-sunset",
    category: "deckSkin",
    name: "Sunset Strip",
    description: "Miami-night orange and magenta.",
    price: 600,
    background: "linear-gradient(135deg, #f97316 0%, #db2777 100%)",
    border: "#ffe2b8",
    ink: "#fff1e0",
    pattern: "waves",
  },
  {
    id: "deck-galaxy",
    category: "deckSkin",
    name: "Galaxy",
    description: "A cosmic violet nebula in your hand.",
    price: 1200,
    background:
      "radial-gradient(circle at 30% 25%, #7c3aed 0%, #312e81 45%, #050314 100%)",
    border: "#c4b5fd",
    ink: "#e9d5ff",
    pattern: "stars",
  },
  {
    id: "deck-gold",
    category: "deckSkin",
    name: "24K High Roller",
    description: "Solid-gold flex for the truly loaded.",
    price: 5000,
    background: "linear-gradient(135deg, #fde68a 0%, #d4a017 55%, #8a6d10 100%)",
    border: "#fffbe6",
    ink: "#5b4708",
    pattern: "dots",
  },
  {
    id: "deck-holographic",
    category: "deckSkin",
    name: "Holographic Prism",
    description: "Iridescent foil that shifts as you tilt the cards.",
    price: 8500,
    background: "linear-gradient(135deg, #a855f7 0%, #06b6d4 50%, #ec4899 100%)",
    border: "#faf5ff",
    ink: "#ffffff",
    pattern: "waves",
  },
  {
    id: "deck-carbon",
    category: "deckSkin",
    name: "Carbon Fiber",
    description: "Stealth matte weave for the serious grinder.",
    price: 12000,
    background: "repeating-linear-gradient(45deg, #1a1a1a 0, #1a1a1a 2px, #2d2d2d 2px, #2d2d2d 4px)",
    border: "#525252",
    ink: "#d4d4d4",
    pattern: "grid",
  },
  {
    id: "deck-aurora",
    category: "deckSkin",
    name: "Northern Aurora",
    description: "Shifting green-violet lights across the back.",
    price: 18000,
    background: "linear-gradient(160deg, #064e3b 0%, #4c1d95 40%, #0ea5e9 100%)",
    border: "#99f6e4",
    ink: "#ecfdf5",
    pattern: "stars",
  },
];

// ---------------------------- Table themes ----------------------------

export const TABLE_THEMES: TableTheme[] = [
  {
    id: "table-classic-green",
    category: "tableTheme",
    name: "Classic Green",
    description: "The traditional casino felt.",
    price: 0,
    felt: "radial-gradient(ellipse at center, #1f7a4d 0%, #14633c 60%, #0e4a2c 100%)",
    rail: "#5a3b22",
    glow: "#34d399",
    text: "#effdf3",
  },
  {
    id: "table-royal-blue",
    category: "tableTheme",
    name: "Royal Blue",
    description: "Cool, calm, and high-class.",
    price: 400,
    felt: "radial-gradient(ellipse at center, #1d4ed8 0%, #1e3a8a 60%, #0f1f4d 100%)",
    rail: "#0b1437",
    glow: "#60a5fa",
    text: "#eef4ff",
  },
  {
    id: "table-crimson",
    category: "tableTheme",
    name: "Crimson Velvet",
    description: "Bold red velvet for the bold player.",
    price: 400,
    felt: "radial-gradient(ellipse at center, #b91c1c 0%, #7f1d1d 60%, #450a0a 100%)",
    rail: "#3b0a0a",
    glow: "#fb7185",
    text: "#fff1f2",
  },
  {
    id: "table-obsidian",
    category: "tableTheme",
    name: "Obsidian Neon",
    description: "Jet-black felt rimmed with neon.",
    price: 700,
    felt: "radial-gradient(ellipse at center, #1f2937 0%, #111827 60%, #030712 100%)",
    rail: "#0a0a0a",
    glow: "#22d3ee",
    text: "#e5f6ff",
  },
  {
    id: "table-vegas",
    category: "tableTheme",
    name: "Neon Vegas",
    description: "Electric purple-and-pink Strip energy.",
    price: 1500,
    felt: "radial-gradient(ellipse at center, #6d28d9 0%, #4c1d95 55%, #1e0b3b 100%)",
    rail: "#160a2e",
    glow: "#f0abfc",
    text: "#f7ecff",
  },
  {
    id: "table-emerald-luxe",
    category: "tableTheme",
    name: "Emerald Luxe",
    description: "Gold-railed emerald for legends only.",
    price: 6000,
    felt: "radial-gradient(ellipse at center, #047857 0%, #065f46 60%, #022c22 100%)",
    rail: "#a8870f",
    glow: "#fde68a",
    text: "#ecfdf5",
  },
  {
    id: "table-monte-carlo",
    category: "tableTheme",
    name: "Monte Carlo",
    description: "Burgundy felt with champagne-gold rail.",
    price: 9000,
    felt: "radial-gradient(ellipse at center, #881337 0%, #4c0519 60%, #1f0309 100%)",
    rail: "#ca8a04",
    glow: "#fde68a",
    text: "#fff1f2",
  },
  {
    id: "table-arctic",
    category: "tableTheme",
    name: "Arctic Ice",
    description: "Frost-blue felt under cool white LEDs.",
    price: 14000,
    felt: "radial-gradient(ellipse at center, #0ea5e9 0%, #0369a1 55%, #0c4a6e 100%)",
    rail: "#e0f2fe",
    glow: "#7dd3fc",
    text: "#f0f9ff",
  },
  {
    id: "table-inferno",
    category: "tableTheme",
    name: "Inferno Pit",
    description: "Lava-orange glow for high-volatility sessions.",
    price: 22000,
    felt: "radial-gradient(ellipse at center, #ea580c 0%, #9a3412 55%, #431407 100%)",
    rail: "#292524",
    glow: "#fb923c",
    text: "#fff7ed",
  },
];

// --------------------------- Accent themes ----------------------------

export const ACCENT_THEMES: AccentTheme[] = [
  {
    id: "accent-default",
    category: "accentTheme",
    name: "Violet & Teal",
    description: "The original Probability Playground look.",
    price: 0,
    swatch: ["#4f46e5", "#0d9488"],
    light: {
      accent: "79 70 229",
      accentHover: "67 56 202",
      accentContrast: "255 255 255",
      accent2: "13 148 136",
      accent2Hover: "15 118 110",
    },
    dark: {
      accent: "129 124 255",
      accentHover: "153 149 255",
      accentContrast: "17 18 28",
      accent2: "45 212 191",
      accent2Hover: "94 234 212",
    },
  },
  {
    id: "accent-oceanic",
    category: "accentTheme",
    name: "Oceanic",
    description: "Deep blue with bright cyan.",
    price: 300,
    swatch: ["#2563eb", "#06b6d4"],
    light: {
      accent: "37 99 235",
      accentHover: "29 78 216",
      accentContrast: "255 255 255",
      accent2: "6 182 212",
      accent2Hover: "8 145 178",
    },
    dark: {
      accent: "96 165 250",
      accentHover: "147 197 253",
      accentContrast: "9 14 30",
      accent2: "34 211 238",
      accent2Hover: "103 232 249",
    },
  },
  {
    id: "accent-sunset",
    category: "accentTheme",
    name: "Sunset",
    description: "Warm orange with rose pink.",
    price: 400,
    swatch: ["#ea580c", "#db2777"],
    light: {
      accent: "234 88 12",
      accentHover: "194 65 12",
      accentContrast: "255 255 255",
      accent2: "219 39 119",
      accent2Hover: "190 24 93",
    },
    dark: {
      accent: "251 146 60",
      accentHover: "253 186 116",
      accentContrast: "30 12 4",
      accent2: "244 114 182",
      accent2Hover: "249 168 212",
    },
  },
  {
    id: "accent-forest",
    category: "accentTheme",
    name: "Forest",
    description: "Earthy green with lime spark.",
    price: 400,
    swatch: ["#16a34a", "#65a30d"],
    light: {
      accent: "22 163 74",
      accentHover: "21 128 61",
      accentContrast: "255 255 255",
      accent2: "101 163 13",
      accent2Hover: "77 124 15",
    },
    dark: {
      accent: "74 222 128",
      accentHover: "134 239 172",
      accentContrast: "5 20 10",
      accent2: "163 230 53",
      accent2Hover: "190 242 100",
    },
  },
  {
    id: "accent-royal",
    category: "accentTheme",
    name: "Royal Gold",
    description: "Regal purple paired with gold.",
    price: 800,
    swatch: ["#7c3aed", "#eab308"],
    light: {
      accent: "124 58 237",
      accentHover: "109 40 217",
      accentContrast: "255 255 255",
      accent2: "202 138 4",
      accent2Hover: "161 98 7",
    },
    dark: {
      accent: "167 139 250",
      accentHover: "196 181 253",
      accentContrast: "20 10 35",
      accent2: "250 204 21",
      accent2Hover: "253 224 71",
    },
  },
  {
    id: "accent-neon",
    category: "accentTheme",
    name: "Neon Nights",
    description: "Electric magenta and acid green.",
    price: 1500,
    swatch: ["#d946ef", "#22c55e"],
    light: {
      accent: "192 38 211",
      accentHover: "162 28 175",
      accentContrast: "255 255 255",
      accent2: "22 163 74",
      accent2Hover: "21 128 61",
    },
    dark: {
      accent: "232 121 249",
      accentHover: "240 171 252",
      accentContrast: "26 6 28",
      accent2: "74 222 128",
      accent2Hover: "134 239 172",
    },
  },
  {
    id: "accent-midnight",
    category: "accentTheme",
    name: "Midnight Sapphire",
    description: "Deep navy with electric blue highlights.",
    price: 3500,
    swatch: ["#1e3a8a", "#38bdf8"],
    light: {
      accent: "30 58 138",
      accentHover: "29 78 216",
      accentContrast: "255 255 255",
      accent2: "56 189 248",
      accent2Hover: "14 165 233",
    },
    dark: {
      accent: "96 165 250",
      accentHover: "147 197 253",
      accentContrast: "8 12 30",
      accent2: "125 211 252",
      accent2Hover: "186 230 253",
    },
  },
  {
    id: "accent-chrome",
    category: "accentTheme",
    name: "Chrome Rose",
    description: "Metallic pink-silver for the fashion-forward.",
    price: 7500,
    swatch: ["#db2777", "#94a3b8"],
    light: {
      accent: "219 39 119",
      accentHover: "190 24 93",
      accentContrast: "255 255 255",
      accent2: "100 116 139",
      accent2Hover: "71 85 105",
    },
    dark: {
      accent: "244 114 182",
      accentHover: "249 168 212",
      accentContrast: "20 8 16",
      accent2: "148 163 184",
      accent2Hover: "203 213 225",
    },
  },
];

// ----------------------------- Chip styles -----------------------------

export const CHIP_STYLES: ChipStyle[] = [
  {
    id: "chip-classic",
    category: "chipStyle",
    name: "Casino Classic",
    description: "Red-white-blue edge spots.",
    price: 0,
    face: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
    edge: "#ffffff",
    label: "100",
  },
  {
    id: "chip-platinum",
    category: "chipStyle",
    name: "Platinum Stack",
    description: "Cool silver with holographic edge.",
    price: 2500,
    face: "linear-gradient(135deg, #e2e8f0 0%, #64748b 100%)",
    edge: "#cbd5e1",
    label: "500",
  },
  {
    id: "chip-obsidian",
    category: "chipStyle",
    name: "Obsidian High-Stakes",
    description: "Matte black with gold inlay.",
    price: 8000,
    face: "linear-gradient(135deg, #18181b 0%, #09090b 100%)",
    edge: "#eab308",
    label: "1K",
  },
  {
    id: "chip-crystal",
    category: "chipStyle",
    name: "Crystal Prism",
    description: "Translucent cyan facets.",
    price: 15000,
    face: "linear-gradient(135deg, #06b6d4 0%, #0891b2 50%, #164e63 100%)",
    edge: "#a5f3fc",
    label: "5K",
  },
  {
    id: "chip-inferno",
    category: "chipStyle",
    name: "Inferno Mega",
    description: "Molten orange core with ember sparks.",
    price: 28000,
    face: "radial-gradient(circle, #fb923c 0%, #ea580c 40%, #7c2d12 100%)",
    edge: "#fef3c7",
    label: "25K",
  },
];

// --------------------------- Avatar accessories ---------------------------

export const AVATAR_ACCESSORIES: AvatarAccessory[] = [
  {
    id: "acc-none",
    category: "avatarAccessory",
    name: "None",
    description: "Clean look, no accessory.",
    price: 0,
    emoji: "",
    color: "transparent",
  },
  {
    id: "acc-shades",
    category: "avatarAccessory",
    name: "Cool Shades",
    description: "Never let them see you sweat.",
    price: 1200,
    emoji: "🕶️",
    color: "#1e293b",
  },
  {
    id: "acc-crown",
    category: "avatarAccessory",
    name: "Table Crown",
    description: "Rule the felt.",
    price: 4500,
    emoji: "👑",
    color: "#eab308",
  },
  {
    id: "acc-headphones",
    category: "avatarAccessory",
    name: "Focus Headphones",
    description: "Block the table talk, crush the math.",
    price: 3000,
    emoji: "🎧",
    color: "#6366f1",
  },
  {
    id: "acc-cigar",
    category: "avatarAccessory",
    name: "Victory Cigar",
    description: "Celebrate every river hit.",
    price: 6500,
    emoji: "🎩",
    color: "#78350f",
  },
  {
    id: "acc-halo",
    category: "avatarAccessory",
    name: "Probability Halo",
    description: "Blessed by Bayes himself.",
    price: 12000,
    emoji: "✨",
    color: "#a855f7",
  },
  {
    id: "acc-dragon",
    category: "avatarAccessory",
    name: "Dragon Companion",
    description: "A tiny luck dragon on your shoulder.",
    price: 25000,
    emoji: "🐉",
    color: "#dc2626",
  },
];

// ----------------------------- Win animations -----------------------------

export const WIN_ANIMATIONS: WinAnimation[] = [
  {
    id: "anim-none",
    category: "animation",
    name: "Standard",
    description: "Classic chip slide, no frills.",
    price: 0,
    cssClass: "",
  },
  {
    id: "anim-confetti",
    category: "animation",
    name: "Confetti Burst",
    description: "Rainbow confetti on big pots.",
    price: 4000,
    cssClass: "pp-win-confetti",
  },
  {
    id: "anim-fireworks",
    category: "animation",
    name: "Fireworks Show",
    description: "Explosive celebration for monster wins.",
    price: 9000,
    cssClass: "pp-win-fireworks",
  },
  {
    id: "anim-gold-rain",
    category: "animation",
    name: "Gold Rain",
    description: "Golden particles shower the table.",
    price: 16000,
    cssClass: "pp-win-gold-rain",
  },
  {
    id: "anim-neon-pulse",
    category: "animation",
    name: "Neon Pulse",
    description: "Electric table glow on victory.",
    price: 30000,
    cssClass: "pp-win-neon-pulse",
  },
];

export const ALL_COSMETICS: Cosmetic[] = [
  ...DECK_SKINS,
  ...TABLE_THEMES,
  ...ACCENT_THEMES,
  ...CHIP_STYLES,
  ...AVATAR_ACCESSORIES,
  ...WIN_ANIMATIONS,
];

export function getCosmetic(id: string): Cosmetic | undefined {
  return ALL_COSMETICS.find((c) => c.id === id);
}

export function getDeckSkin(id: string): DeckSkin {
  return DECK_SKINS.find((d) => d.id === id) ?? DECK_SKINS[0];
}

export function getTableTheme(id: string): TableTheme {
  return TABLE_THEMES.find((t) => t.id === id) ?? TABLE_THEMES[0];
}

export function getAccentTheme(id: string): AccentTheme {
  return ACCENT_THEMES.find((a) => a.id === id) ?? ACCENT_THEMES[0];
}

export function getChipStyle(id: string): ChipStyle {
  return CHIP_STYLES.find((c) => c.id === id) ?? CHIP_STYLES[0];
}

export function getAvatarAccessory(id: string): AvatarAccessory {
  return AVATAR_ACCESSORIES.find((a) => a.id === id) ?? AVATAR_ACCESSORIES[0];
}

export function getWinAnimation(id: string): WinAnimation {
  return WIN_ANIMATIONS.find((a) => a.id === id) ?? WIN_ANIMATIONS[0];
}

export function cosmeticsByCategory(category: CosmeticCategory): Cosmetic[] {
  return ALL_COSMETICS.filter((c) => c.category === category);
}
