import type { ComponentType, SVGProps } from "react";
import {
  CalendarIcon,
  ClockIcon,
  CrownIcon,
  DiceIcon,
  DoorIcon,
  FlagIcon,
  FlameIcon,
  GraduationCapIcon,
  MountainIcon,
  RocketIcon,
  SpadeIcon,
  SproutIcon,
  TargetIcon,
  ZapIcon,
} from "../components/icons";
import {
  AceCardIcon,
  ChipIcon,
  CoinStackIcon,
  DiamondIcon,
  GemIcon,
  JackpotIcon,
  PhoenixIcon,
  VaultIcon,
} from "../components/badges/tokenIcons";
import { LESSONS } from "../content";
import { GAMES } from "./games";
import { TOKEN_MILESTONES, peakTokens } from "./tokens";
import { emptyPokerStats } from "./progress";
import type { CourseProgress } from "./progress";
import { CHEST_BADGE_META, CHEST_BADGE_POOL } from "./dailyRewards/badges";

export type BadgeCategory = "lesson" | "game" | "streak" | "speed" | "token" | "quant";

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

export interface Badge {
  id: string;
  title: string;
  description: string;
  category: BadgeCategory;
  icon: IconComponent;
  /** Two-stop gradient [from, to] used to color the badge when earned. */
  gradient: [string, string];
  /** Whether this badge is satisfied by the given progress. */
  earned(progress: CourseProgress): boolean;
}

/** Every registered lesson, in course order (grows as new JSON lessons are added). */
const LESSON_IDS = LESSONS.map((lesson) => lesson.lessonId);

/** Mirrors the predicate games.ts uses: mastery (passed) of a lesson. */
function lessonPassed(lessonId: string, progress: CourseProgress): boolean {
  return (
    Boolean(progress.lessonMastery[lessonId]?.passed) ||
    progress.completedLessons.includes(lessonId)
  );
}

function allLessonsPassed(progress: CourseProgress): boolean {
  return LESSON_IDS.every((id) => lessonPassed(id, progress));
}

/**
 * Placeholder until market-making tracks its own hard-level completion.
 * For now, full lesson mastery stands in for finishing the module.
 */
function marketMakingHardComplete(progress: CourseProgress): boolean {
  return allLessonsPassed(progress);
}

/** True when any lesson has a recorded best finishing time under `ms`. */
function anyLessonUnder(progress: CourseProgress, ms: number): boolean {
  return Object.values(progress.lessonMastery).some(
    (m) => m.bestTimeMs != null && m.bestTimeMs < ms,
  );
}

const requiredLessonFor = (gameId: string): string =>
  GAMES.find((g) => g.id === gameId)?.requiredLessonId ?? "";

/** Quant-themed badge art keyed by lesson index (supports up to 10 lessons). */
const QUANT_LESSON_BADGE_PRESETS: Array<{
  title: string;
  blurb: string;
  icon: IconComponent;
  gradient: [string, string];
}> = [
  {
    title: "Sample Space Scout",
    blurb: "Probability foundations — combinatorics and basic odds.",
    icon: SproutIcon,
    gradient: ["#39ff14", "#15a32e"],
  },
  {
    title: "EV Calculator",
    blurb: "Expected value and fair-bet reasoning.",
    icon: RocketIcon,
    gradient: ["#22d3ee", "#0d9488"],
  },
  {
    title: "Bayes Intuition",
    blurb: "Updating beliefs with evidence and the law of large numbers.",
    icon: FlagIcon,
    gradient: ["#c4b5fd", "#8b5cf6"],
  },
  {
    title: "Independence Check",
    blurb: "Compound events and when trials don't affect each other.",
    icon: TargetIcon,
    gradient: ["#fbbf24", "#f59e0b"],
  },
  {
    title: "Conditional Edge",
    blurb: "Restricted sample spaces and conditional probability.",
    icon: DiceIcon,
    gradient: ["#fb7185", "#e11d48"],
  },
  {
    title: "Distribution Reader",
    blurb: "Center, spread, and reading data like a desk analyst.",
    icon: MountainIcon,
    gradient: ["#2dd4bf", "#0891b2"],
  },
  {
    title: "Random Walk Ready",
    blurb: "Stochastic intuition for paths and drift.",
    icon: ZapIcon,
    gradient: ["#a3e635", "#65a30d"],
  },
  {
    title: "Market Maker Trainee",
    blurb: "Spreads, inventory risk, and quoting under uncertainty.",
    icon: ChipIcon,
    gradient: ["#fcd34d", "#d97706"],
  },
  {
    title: "Poker Theorist",
    blurb: "Game theory, pot odds, and exploitative lines.",
    icon: SpadeIcon,
    gradient: ["#f87171", "#b91c1c"],
  },
  {
    title: "Interview Stack",
    blurb: "Full quant probability stack — ready for the hot seat.",
    icon: CrownIcon,
    gradient: ["#c084fc", "#9333ea"],
  },
];

function lessonBadgeMeta(lessonId: string, index: number) {
  const lesson = LESSONS.find((l) => l.lessonId === lessonId);
  const preset = QUANT_LESSON_BADGE_PRESETS[index];
  const lessonLabel = lesson?.title ?? `Lesson ${index + 1}`;

  if (preset) {
    return {
      title: preset.title,
      description: `Pass "${lessonLabel}" — ${preset.blurb}`,
      icon: preset.icon,
      gradient: preset.gradient,
    };
  }

  return {
    title: `Quant Track ${index + 1}`,
    description: `Pass "${lessonLabel}".`,
    icon: GraduationCapIcon,
    gradient: ["#fde047", "#eab308"] as [string, string],
  };
}

const lessonBadges: Badge[] = LESSON_IDS.map((lessonId, index) => {
  const meta = lessonBadgeMeta(lessonId, index);
  return {
    id: `lesson-${lessonId}`,
    title: meta.title,
    description: meta.description,
    category: "lesson",
    icon: meta.icon,
    gradient: meta.gradient,
    earned: (progress) => lessonPassed(lessonId, progress),
  };
});

/** Per-milestone icon + gradient, keyed by the shared TOKEN_MILESTONES id. */
const TOKEN_BADGE_META: Record<
  string,
  { icon: IconComponent; gradient: [string, string] }
> = {
  "tok-2k": { icon: ChipIcon, gradient: ["#fcd34d", "#d97706"] },
  "tok-5k": { icon: CoinStackIcon, gradient: ["#fde047", "#ca8a04"] },
  "tok-10k": { icon: DiamondIcon, gradient: ["#67e8f9", "#0891b2"] },
  "tok-25k": { icon: GemIcon, gradient: ["#f0abfc", "#a21caf"] },
  "tok-50k": { icon: VaultIcon, gradient: ["#a5f3fc", "#2563eb"] },
  "tok-100k": { icon: JackpotIcon, gradient: ["#fef08a", "#f59e0b"] },
};

const DEFAULT_TOKEN_META: { icon: IconComponent; gradient: [string, string] } = {
  icon: ChipIcon,
  gradient: ["#fcd34d", "#d97706"],
};

const tokenMilestoneBadges: Badge[] = TOKEN_MILESTONES.map((milestone) => {
  const meta = TOKEN_BADGE_META[milestone.id] ?? DEFAULT_TOKEN_META;
  return {
    id: `token-${milestone.id}`,
    title: milestone.title,
    description: milestone.description,
    category: "token",
    icon: meta.icon,
    gradient: meta.gradient,
    earned: (progress) => peakTokens(progress) >= milestone.threshold,
  };
});

/** Read poker stats defensively (older accounts may not have them). */
function pokerStatsOf(progress: CourseProgress) {
  return progress.pokerStats ?? emptyPokerStats();
}

function hasChestBadge(progress: CourseProgress, badgeId: string): boolean {
  return (progress.chestBadgesEarned ?? []).includes(badgeId);
}

const chestExclusiveBadges: Badge[] = CHEST_BADGE_POOL.map((id) => ({
  id,
  title: CHEST_BADGE_META[id].title,
  description: CHEST_BADGE_META[id].description,
  category: "streak" as const,
  icon: GemIcon,
  gradient: CHEST_BADGE_META[id].gradient,
  earned: (progress: CourseProgress) => hasChestBadge(progress, id),
}));

const chestMilestoneBadges: Badge[] = [
  {
    id: "chest-first-open",
    title: "First Chest",
    description: "Open your first daily treasure chest.",
    category: "streak",
    icon: JackpotIcon,
    gradient: ["#fcd34d", "#ca8a04"],
    earned: (progress) => (progress.chestStats?.opened ?? 0) >= 1,
  },
  {
    id: "chest-hoarder",
    title: "Chest Hoarder",
    description: "Open 5 daily treasure chests.",
    category: "streak",
    icon: JackpotIcon,
    gradient: ["#a78bfa", "#7c3aed"],
    earned: (progress) => (progress.chestStats?.opened ?? 0) >= 5,
  },
  {
    id: "chest-diamond",
    title: "Diamond Chest",
    description: "Roll a level-10 diamond chest.",
    category: "streak",
    icon: DiamondIcon,
    gradient: ["#B9F2FF", "#38BDF8"],
    earned: (progress) => (progress.chestStats?.bestLevel ?? 0) >= 10,
  },
];

const pokerStatBadges: Badge[] = [
  {
    id: "poker-first-pot",
    title: "First Pot",
    description: "Win your very first poker hand.",
    category: "token",
    icon: AceCardIcon,
    gradient: ["#34d399", "#059669"],
    earned: (progress) => pokerStatsOf(progress).handsWon >= 1,
  },
  {
    id: "poker-comeback-kid",
    title: "Comeback Kid",
    description: "Recover after going bust at least once.",
    category: "token",
    icon: PhoenixIcon,
    gradient: ["#fb7185", "#db2777"],
    earned: (progress) => pokerStatsOf(progress).bustCount >= 1,
  },
];

const quantBadges: Badge[] = [
  {
    id: "quant-master",
    title: "Quant Master",
    description: "Pass every lesson in the quant probability track.",
    category: "quant",
    icon: GraduationCapIcon,
    gradient: ["#fde047", "#eab308"],
    earned: allLessonsPassed,
  },
  {
    id: "market-making-complete",
    title: "Market Making Complete",
    description: "Finish the market-making module on hard difficulty.",
    category: "quant",
    icon: VaultIcon,
    gradient: ["#a5f3fc", "#2563eb"],
    earned: marketMakingHardComplete,
  },
  {
    id: "poker-theory-progress",
    title: "Poker Theory Progress",
    description: "Complete the conditional-probability lesson that unlocks poker drills.",
    category: "quant",
    icon: SpadeIcon,
    gradient: ["#f87171", "#b91c1c"],
    earned: (progress) => lessonPassed(requiredLessonFor("poker"), progress),
  },
  {
    id: "jane-street-ready",
    title: "Jane Street Ready",
    description: "Master every lesson and market-making hard mode (placeholder: full lesson mastery).",
    category: "quant",
    icon: DiamondIcon,
    gradient: ["#67e8f9", "#0891b2"],
    earned: (progress) => allLessonsPassed(progress) && marketMakingHardComplete(progress),
  },
  {
    id: "citadel-calibrated",
    title: "Citadel Calibrated",
    description: "Full lesson mastery plus a 7-day practice streak.",
    category: "quant",
    icon: FlameIcon,
    gradient: ["#f97316", "#dc2626"],
    earned: (progress) => allLessonsPassed(progress) && progress.streak >= 7,
  },
  {
    id: "sig-sharp",
    title: "SIG Sharp",
    description: "Full lesson mastery and finish any lesson in under 10 minutes.",
    category: "quant",
    icon: ClockIcon,
    gradient: ["#a3e635", "#65a30d"],
    earned: (progress) =>
      allLessonsPassed(progress) && anyLessonUnder(progress, 10 * 60_000),
  },
];

export const BADGES: Badge[] = [
  ...lessonBadges,
  ...quantBadges,
  {
    id: "monty-hall-unlocked",
    title: "Monty Hall Unlocked",
    description: "Master Bayes intuition to unlock the Monty Hall game.",
    category: "game",
    icon: DoorIcon,
    gradient: ["#818cf8", "#4f46e5"],
    earned: (progress) => lessonPassed(requiredLessonFor("monty-hall"), progress),
  },
  {
    id: "poker-unlocked",
    title: "Poker Table Unlocked",
    description: "Master conditional probability to unlock the Poker Scenario.",
    category: "game",
    icon: SpadeIcon,
    gradient: ["#f87171", "#b91c1c"],
    earned: (progress) => lessonPassed(requiredLessonFor("poker"), progress),
  },
  {
    id: "streak-3",
    title: "3-Day Streak",
    description: "Practice 3 days in a row.",
    category: "streak",
    icon: FlameIcon,
    gradient: ["#fb923c", "#ea580c"],
    earned: (progress) => progress.streak >= 3,
  },
  {
    id: "streak-7",
    title: "7-Day Streak",
    description: "Practice 7 days in a row.",
    category: "streak",
    icon: CalendarIcon,
    gradient: ["#f97316", "#dc2626"],
    earned: (progress) => progress.streak >= 7,
  },
  {
    id: "streak-30",
    title: "30-Day Streak",
    description: "Practice 30 days in a row.",
    category: "streak",
    icon: CrownIcon,
    gradient: ["#c084fc", "#9333ea"],
    earned: (progress) => progress.streak >= 30,
  },
  {
    id: "quick-thinker",
    title: "Quick Thinker",
    description: "Finish any lesson in under 10 minutes.",
    category: "speed",
    icon: ClockIcon,
    gradient: ["#a3e635", "#65a30d"],
    earned: (progress) => anyLessonUnder(progress, 10 * 60_000),
  },
  {
    id: "speed-demon",
    title: "Speed Demon",
    description: "Finish any lesson in under 5 minutes.",
    category: "speed",
    icon: ZapIcon,
    gradient: ["#e879f9", "#c026d3"],
    earned: (progress) => anyLessonUnder(progress, 5 * 60_000),
  },
  ...tokenMilestoneBadges,
  ...chestExclusiveBadges,
  ...chestMilestoneBadges,
  ...pokerStatBadges,
];

export function isEarned(badge: Badge, progress: CourseProgress): boolean {
  return badge.earned(progress);
}

/** Every badge satisfied by the given progress. */
export function earnedBadges(progress: CourseProgress): Badge[] {
  return BADGES.filter((badge) => badge.earned(progress));
}

export function earnedCount(progress: CourseProgress): number {
  return earnedBadges(progress).length;
}

export function earnedBadgeIds(progress: CourseProgress): Set<string> {
  return new Set(earnedBadges(progress).map((badge) => badge.id));
}

/** Badges earned in `after` that were not yet earned in `before`. */
export function newlyEarnedBadges(
  before: CourseProgress,
  after: CourseProgress,
): Badge[] {
  const had = earnedBadgeIds(before);
  return earnedBadges(after).filter((badge) => !had.has(badge.id));
}
