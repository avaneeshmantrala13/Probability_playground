/**
 * Badge ids that can ONLY be earned from daily-login treasure chests.
 */

export const CHEST_BADGE_POOL = [
  "chest-lucky-clover",
  "chest-fortune-seeker",
  "chest-probability-pirate",
  "chest-dice-diplomat",
  "chest-royal-flush-fan",
] as const;

export type ChestBadgeId = (typeof CHEST_BADGE_POOL)[number];

export const CHEST_BADGE_META: Record<
  ChestBadgeId,
  { title: string; description: string; gradient: [string, string] }
> = {
  "chest-lucky-clover": {
    title: "Lucky Clover",
    description: "Found in a daily treasure chest.",
    gradient: ["#4ade80", "#16a34a"],
  },
  "chest-fortune-seeker": {
    title: "Fortune Seeker",
    description: "Discovered while opening a streak chest.",
    gradient: ["#fbbf24", "#d97706"],
  },
  "chest-probability-pirate": {
    title: "Probability Pirate",
    description: "Plundered from a streak-day treasure chest.",
    gradient: ["#f472b6", "#be185d"],
  },
  "chest-dice-diplomat": {
    title: "Dice Diplomat",
    description: "Negotiated this badge out of a chest.",
    gradient: ["#60a5fa", "#2563eb"],
  },
  "chest-royal-flush-fan": {
    title: "Royal Flush Fan",
    description: "A rare badge from a high-tier chest.",
    gradient: ["#c084fc", "#7c3aed"],
  },
};
