import type { ChestReward } from "../streak";
import { CHEST_BADGE_POOL } from "./badges";

export const CHEST_TIER_GRADIENTS: [string, string][] = [
  ["#8B5A2B", "#5C3D1E"],
  ["#CD7F32", "#8B4513"],
  ["#708090", "#4A5568"],
  ["#C0C0C0", "#808080"],
  ["#FFD700", "#B8860B"],
  ["#E5E4E2", "#9CA3AF"],
  ["#E0115F", "#9B1B30"],
  ["#0F52BA", "#1E3A8A"],
  ["#50C878", "#047857"],
  ["#B9F2FF", "#38BDF8"],
];

export function rollChestLevel(): number {
  const roll = Math.random();
  if (roll < 0.28) return 1;
  if (roll < 0.48) return 2;
  if (roll < 0.62) return 3;
  if (roll < 0.74) return 4;
  if (roll < 0.83) return 5;
  if (roll < 0.9) return 6;
  if (roll < 0.95) return 7;
  if (roll < 0.98) return 8;
  if (roll < 0.995) return 9;
  return 10;
}

function tokenAmountForLevel(level: number): number {
  const min = 3 + level * 2;
  const max = 8 + level * 4;
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function rollChestReward(
  level: number,
  earnedBadgeIds: Set<string>,
): ChestReward {
  const roll = Math.random();
  const availableBadges = CHEST_BADGE_POOL.filter((id) => !earnedBadgeIds.has(id));
  const badgeChance = level >= 7 ? 0.22 : level >= 4 ? 0.16 : 0.1;
  const lifeChance = level >= 5 ? 0.28 : 0.2;

  if (availableBadges.length > 0 && roll < badgeChance) {
    const badgeId = availableBadges[Math.floor(Math.random() * availableBadges.length)];
    return { kind: "badge", badgeId };
  }

  if (roll < badgeChance + lifeChance) {
    return { kind: "lives", amount: level >= 8 ? 2 : 1 };
  }

  return { kind: "tokens", amount: tokenAmountForLevel(level) };
}
