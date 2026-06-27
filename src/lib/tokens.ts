import type { CourseProgress } from "./progress";

/** Starting stake granted once when Poker Night unlocks. */
export const STARTING_TOKENS = 1000;

export {
  BYPASS_POKER_NIGHT_GATE,
  canAccessPokerNight,
  hasFreePlayMinutes,
  isPokerNightUnlocked,
  allPokerTheoryLessonsPassed,
  completedPokerTheoryToday,
  pokerNightLockMessage,
} from "./pokerNightUnlock";

/** @deprecated Use pokerNightLockMessage — kept for imports. */
export function lessonsRemainingForPoker(_progress: CourseProgress): number {
  return 0;
}

export const POKER_ROUTE = "/poker";
export const STORE_ROUTE = "/store";
export const COMEBACK_ROUTE = "/comeback";

/** A cash-game table tier the player can choose to sit at. */
export interface TableTier {
  id: string;
  name: string;
  blurb: string;
  smallBlind: number;
  bigBlind: number;
  minBuyIn: number;
  maxBuyIn: number;
  /** Number of bot opponents (excluding the human) seated at this table. */
  opponents: number;
  /** 0..1 difficulty knob the bot AI uses to scale aggression/accuracy. */
  botSkill: number;
}

export const TABLE_TIERS: TableTier[] = [
  {
    id: "low",
    name: "Beginner's Table",
    blurb: "Low stakes, friendly bots. A safe place to learn the ropes.",
    smallBlind: 5,
    bigBlind: 10,
    minBuyIn: 200,
    maxBuyIn: 500,
    opponents: 3,
    botSkill: 0.45,
  },
  {
    id: "mid",
    name: "High Roller Lounge",
    blurb: "Sharper opponents who punish loose play.",
    smallBlind: 25,
    bigBlind: 50,
    minBuyIn: 1000,
    maxBuyIn: 3000,
    opponents: 4,
    botSkill: 0.7,
  },
  {
    id: "high",
    name: "The Whale Room",
    blurb: "Brutal, equity-perfect sharks. Bring a big stack.",
    smallBlind: 100,
    bigBlind: 200,
    minBuyIn: 5000,
    maxBuyIn: 15000,
    opponents: 5,
    botSkill: 0.92,
  },
];

export function getTableTier(id: string): TableTier | undefined {
  return TABLE_TIERS.find((t) => t.id === id);
}

/** Below this balance the player is "bankrupt" and routed to the comeback. */
export const BANKRUPTCY_THRESHOLD = 0;

/**
 * Token milestone badges — earned by reaching a peak Poker Night balance.
 * Thresholds and names live here so badges.ts can stay in sync.
 */
export interface TokenMilestone {
  id: string;
  threshold: number;
  title: string;
  description: string;
}

export const TOKEN_MILESTONES: TokenMilestone[] = [
  { id: "tok-2k", threshold: 2_000, title: "In the Black", description: "Reach a balance of 2,000 tokens." },
  { id: "tok-5k", threshold: 5_000, title: "High Roller", description: "Reach a balance of 5,000 tokens." },
  { id: "tok-10k", threshold: 10_000, title: "Card Shark", description: "Reach a balance of 10,000 tokens." },
  { id: "tok-25k", threshold: 25_000, title: "Whale", description: "Reach a balance of 25,000 tokens." },
  { id: "tok-50k", threshold: 50_000, title: "Table Captain", description: "Reach a balance of 50,000 tokens." },
  { id: "tok-100k", threshold: 100_000, title: "Casino Legend", description: "Reach a balance of 100,000 tokens." },
];

/** Current token balance (0 when undefined for older accounts). */
export function tokenBalance(progress: CourseProgress): number {
  return progress.tokens ?? 0;
}

/** Highest balance ever reached. */
export function peakTokens(progress: CourseProgress): number {
  return progress.peakTokens ?? 0;
}
