import { computeStreak, todayKey, type CourseProgress } from "../progress";
import {
  EMPTY_CHEST_STATS,
  isNewStreakDay,
  type PendingChest,
  type StreakDay,
} from "../streak";
import { rollChestLevel, rollChestReward } from "./chests";

export const FREE_PLAY_MINUTES_PER_DAY = 10;

export interface LoginRewardResult {
  progress: CourseProgress;
  processedNewDay: boolean;
  pendingChest: PendingChest | null;
}

export function processLoginRewards(
  remote: CourseProgress,
  today = todayKey(),
): LoginRewardResult {
  const newDay = isNewStreakDay(remote.lastActiveDate, today);
  const streak = computeStreak(remote.streak, remote.lastActiveDate, today);

  let progress: CourseProgress = {
    ...remote,
    streak,
    lastActiveDate: today,
    loginHistory: { ...(remote.loginHistory ?? {}) },
    chestStats: remote.chestStats ?? { ...EMPTY_CHEST_STATS },
    chestBadgesEarned: [...(remote.chestBadgesEarned ?? [])],
    freePlayMinutesRemaining: remote.freePlayMinutesRemaining ?? 0,
    quizLives: remote.quizLives ?? 0,
    pendingChest: remote.pendingChest ?? null,
    lastLoginRewardDate: remote.lastLoginRewardDate ?? null,
  };

  if (!newDay) {
    const chest =
      progress.pendingChest?.date === today ? progress.pendingChest : null;
    return {
      progress: { ...progress, pendingChest: chest },
      processedNewDay: false,
      pendingChest: chest,
    };
  }

  if (progress.lastLoginRewardDate === today) {
    const chest = progress.pendingChest?.date === today ? progress.pendingChest : null;
    return {
      progress: { ...progress, pendingChest: chest },
      processedNewDay: false,
      pendingChest: chest,
    };
  }

  const history = { ...progress.loginHistory };
  const dayEntry: StreakDay = {
    date: today,
    loggedIn: true,
    streakCount: streak,
    rewardType: "none",
  };

  if (streak <= 2) {
    progress.freePlayMinutesRemaining =
      (progress.freePlayMinutesRemaining ?? 0) + FREE_PLAY_MINUTES_PER_DAY;
    dayEntry.rewardType = "free_play";
    progress.pendingChest = null;
  } else {
    const level = rollChestLevel();
    const earned = new Set(progress.chestBadgesEarned ?? []);
    const reward = rollChestReward(level, earned);
    const chest: PendingChest = {
      date: today,
      streakDay: streak,
      level,
      reward,
    };
    progress.pendingChest = chest;
    dayEntry.rewardType = "chest";
    dayEntry.chestLevel = level;
    dayEntry.chestClaimed = false;
  }

  history[today] = dayEntry;
  progress.loginHistory = history;
  progress.lastLoginRewardDate = today;

  return {
    progress,
    processedNewDay: true,
    pendingChest: progress.pendingChest,
  };
}
