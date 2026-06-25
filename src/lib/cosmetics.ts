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

export type Cosmetic = DeckSkin | TableTheme | AccentTheme;

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
];

export const ALL_COSMETICS: Cosmetic[] = [
  ...DECK_SKINS,
  ...TABLE_THEMES,
  ...ACCENT_THEMES,
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

export function cosmeticsByCategory(category: CosmeticCategory): Cosmetic[] {
  return ALL_COSMETICS.filter((c) => c.category === category);
}
