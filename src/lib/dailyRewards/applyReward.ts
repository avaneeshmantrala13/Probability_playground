import type { CourseProgress } from "../progress";
import type { ChestReward, PendingChest } from "../streak";
import { CHEST_BADGE_POOL } from "./badges";

export interface AppliedChestReward {
  progress: CourseProgress;
  reward: ChestReward;
  chestLevel: number;
}

export function applyChestReward(
  progress: CourseProgress,
  chest: PendingChest,
): AppliedChestReward {
  const { reward, level } = chest;
  const history = { ...(progress.loginHistory ?? {}) };

  let next: CourseProgress = {
    ...progress,
    pendingChest: null,
    chestStats: {
      opened: (progress.chestStats?.opened ?? 0) + 1,
      bestLevel: Math.max(progress.chestStats?.bestLevel ?? 0, level),
    },
    loginHistory: history,
  };

  const day = history[chest.date];
  if (day) {
    history[chest.date] = { ...day, chestClaimed: true };
  }

  switch (reward.kind) {
    case "tokens": {
      const tokens = (next.tokens ?? 0) + reward.amount;
      next = {
        ...next,
        tokens,
        peakTokens: Math.max(next.peakTokens ?? 0, tokens),
        lifetimeTokens: (next.lifetimeTokens ?? 0) + reward.amount,
      };
      if (day) {
        history[chest.date] = {
          ...history[chest.date],
          tokensEarned: (day.tokensEarned ?? 0) + reward.amount,
        };
      }
      break;
    }
    case "lives":
      next = { ...next, quizLives: (next.quizLives ?? 0) + reward.amount };
      break;
    case "badge": {
      const earned = new Set(next.chestBadgesEarned ?? []);
      if (CHEST_BADGE_POOL.includes(reward.badgeId as (typeof CHEST_BADGE_POOL)[number])) {
        earned.add(reward.badgeId);
      }
      next = { ...next, chestBadgesEarned: [...earned] };
      if (day) {
        const badges = new Set(day.badgesEarned ?? []);
        badges.add(reward.badgeId);
        history[chest.date] = {
          ...history[chest.date],
          badgesEarned: [...badges],
        };
      }
      break;
    }
  }

  return { progress: next, reward, chestLevel: level };
}
