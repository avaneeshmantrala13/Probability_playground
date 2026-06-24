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
import { GAMES } from "./games";
import type { CourseProgress } from "./progress";

export type BadgeCategory = "lesson" | "game" | "streak" | "speed";

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
    gradient: ["#34d399", "#059669"],
  },
  lesson_2: {
    title: "Building Momentum",
    description: "Pass Lesson 2.",
    icon: RocketIcon,
    gradient: ["#38bdf8", "#2563eb"],
  },
  lesson_3: {
    title: "Halfway Hero",
    description: "Pass Lesson 3.",
    icon: FlagIcon,
    gradient: ["#a78bfa", "#7c3aed"],
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
