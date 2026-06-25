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
import { GAMES } from "./games";
import { TOKEN_MILESTONES, peakTokens } from "./tokens";
import { emptyPokerStats } from "./progress";
import type { CourseProgress } from "./progress";

export type BadgeCategory = "lesson" | "game" | "streak" | "speed" | "token";

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

/** All six lessons in id order. */
const LESSON_IDS = ["lesson_1", "lesson_2", "lesson_3", "lesson_4", "lesson_5", "lesson_6"];

/** Mirrors the predicate games.ts uses: mastery (passed) of a lesson. */
function lessonPassed(lessonId: string, progress: CourseProgress): boolean {
  return (
    Boolean(progress.lessonMastery[lessonId]?.passed) ||
    progress.completedLessons.includes(lessonId)
  );
}

/** True when any lesson has a recorded best finishing time under `ms`. */
function anyLessonUnder(progress: CourseProgress, ms: number): boolean {
  return Object.values(progress.lessonMastery).some(
    (m) => m.bestTimeMs != null && m.bestTimeMs < ms,
  );
}

const requiredLessonFor = (gameId: string): string =>
  GAMES.find((g) => g.id === gameId)?.requiredLessonId ?? "";

const LESSON_BADGE_META: Record<
  string,
  { title: string; description: string; icon: IconComponent; gradient: [string, string] }
> = {
  lesson_1: {
    title: "First Steps",
    description: "Pass your first lesson.",
    icon: SproutIcon,
    gradient: ["#39ff14", "#15a32e"],
  },
  lesson_2: {
    title: "Building Momentum",
    description: "Pass Lesson 2.",
    icon: RocketIcon,
    gradient: ["#22d3ee", "#0d9488"],
  },
  lesson_3: {
    title: "Halfway Hero",
    description: "Pass Lesson 3.",
    icon: FlagIcon,
    gradient: ["#c4b5fd", "#8b5cf6"],
  },
  lesson_4: {
    title: "Four Down",
    description: "Pass Lesson 4.",
    icon: TargetIcon,
    gradient: ["#fbbf24", "#f59e0b"],
  },
  lesson_5: {
    title: "On a Roll",
    description: "Pass Lesson 5.",
    icon: DiceIcon,
    gradient: ["#fb7185", "#e11d48"],
  },
  lesson_6: {
    title: "Going the Distance",
    description: "Pass Lesson 6.",
    icon: MountainIcon,
    gradient: ["#2dd4bf", "#0891b2"],
  },
};

const lessonBadges: Badge[] = LESSON_IDS.map((lessonId) => ({
  id: `lesson-${lessonId}`,
  title: LESSON_BADGE_META[lessonId].title,
  description: LESSON_BADGE_META[lessonId].description,
  category: "lesson",
  icon: LESSON_BADGE_META[lessonId].icon,
  gradient: LESSON_BADGE_META[lessonId].gradient,
  earned: (progress) => lessonPassed(lessonId, progress),
}));

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

export const BADGES: Badge[] = [
  ...lessonBadges,
  {
    id: "graduate",
    title: "Probability Graduate",
    description: "Pass all six lessons.",
    category: "lesson",
    icon: GraduationCapIcon,
    gradient: ["#fde047", "#eab308"],
    earned: (progress) => LESSON_IDS.every((id) => lessonPassed(id, progress)),
  },
  {
    id: "monty-hall-unlocked",
    title: "Monty Hall Unlocked",
    description: "Master the lesson that unlocks Monty Hall.",
    category: "game",
    icon: DoorIcon,
    gradient: ["#818cf8", "#4f46e5"],
    earned: (progress) => lessonPassed(requiredLessonFor("monty-hall"), progress),
  },
  {
    id: "poker-unlocked",
    title: "Poker Table Unlocked",
    description: "Master the lesson that unlocks the Poker Scenario.",
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
