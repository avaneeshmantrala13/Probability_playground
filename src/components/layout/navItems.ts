import type { ComponentType, SVGProps } from "react";
import {
  BookIcon,
  BrainIcon,
  CalendarIcon,
  ChartIcon,
  CrownIcon,
  DiamondIcon,
  DiceIcon,
  GaugeIcon,
  GraduationCapIcon,
  HeartIcon,
  HomeIcon,
  LibraryIcon,
  MedalIcon,
  RocketIcon,
  SettingsIcon,
  SpadeIcon,
  StoreIcon,
  TargetIcon,
  TrophyIcon,
} from "../icons";

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
  /** Match nested routes (e.g. /lessons/lesson_1) as active. */
  matchPrefix?: boolean;
  /** Tailwind classes for the icon color. */
  iconClassName: string;
  /** Tailwind classes when this nav item is active. */
  activeClassName: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    to: "/",
    label: "Home",
    icon: HomeIcon,
    iconClassName: "text-violet-500",
    activeClassName: "bg-violet-500/15 text-primary ring-1 ring-violet-500/25",
  },
  {
    to: "/lessons",
    label: "Lessons",
    icon: BookIcon,
    matchPrefix: true,
    iconClassName: "text-sky-500",
    activeClassName: "bg-sky-500/15 text-primary ring-1 ring-sky-500/25",
  },
  {
    to: "/learn",
    label: "Learn",
    icon: LibraryIcon,
    matchPrefix: true,
    iconClassName: "text-indigo-500",
    activeClassName: "bg-indigo-500/15 text-primary ring-1 ring-indigo-500/25",
  },
  {
    to: "/poker-theory",
    label: "Poker Theory",
    icon: HeartIcon,
    matchPrefix: true,
    iconClassName: "text-red-500",
    activeClassName: "bg-red-500/15 text-primary ring-1 ring-red-500/25",
  },
  {
    to: "/market-making",
    label: "Market Making",
    icon: ChartIcon,
    matchPrefix: true,
    iconClassName: "text-emerald-500",
    activeClassName: "bg-emerald-500/15 text-primary ring-1 ring-emerald-500/25",
  },
  {
    to: "/mental-math",
    label: "Mental Math",
    icon: BrainIcon,
    matchPrefix: true,
    iconClassName: "text-orange-500",
    activeClassName: "bg-orange-500/15 text-primary ring-1 ring-orange-500/25",
  },
  {
    to: "/practice",
    label: "Practice",
    icon: BookIcon,
    matchPrefix: true,
    iconClassName: "text-indigo-500",
    activeClassName: "bg-indigo-500/15 text-primary ring-1 ring-indigo-500/25",
  },
  {
    to: "/calibration-gym",
    label: "Calibration Gym",
    icon: GaugeIcon,
    matchPrefix: true,
    iconClassName: "text-blue-500",
    activeClassName: "bg-blue-500/15 text-primary ring-1 ring-blue-500/25",
  },
  {
    to: "/readiness",
    label: "Readiness",
    icon: TargetIcon,
    matchPrefix: true,
    iconClassName: "text-teal-500",
    activeClassName: "bg-teal-500/15 text-primary ring-1 ring-teal-500/25",
  },
  {
    to: "/mock-interview",
    label: "Mock Interview",
    icon: GraduationCapIcon,
    matchPrefix: true,
    iconClassName: "text-rose-500",
    activeClassName: "bg-rose-500/15 text-primary ring-1 ring-rose-500/25",
  },
  {
    to: "/playground",
    label: "Playground",
    icon: DiceIcon,
    matchPrefix: true,
    iconClassName: "text-fuchsia-500",
    activeClassName: "bg-fuchsia-500/15 text-primary ring-1 ring-fuchsia-500/25",
  },
  {
    to: "/poker",
    label: "Poker Night",
    icon: SpadeIcon,
    matchPrefix: true,
    iconClassName: "text-neutral-900 dark:text-neutral-100",
    activeClassName: "bg-neutral-500/15 text-primary ring-1 ring-neutral-500/30",
  },
  {
    to: "/store",
    label: "Store",
    icon: StoreIcon,
    matchPrefix: true,
    iconClassName: "text-amber-500",
    activeClassName: "bg-amber-500/15 text-primary ring-1 ring-amber-500/25",
  },
  {
    to: "/calendar",
    label: "Calendar",
    icon: CalendarIcon,
    matchPrefix: true,
    iconClassName: "text-cyan-500",
    activeClassName: "bg-cyan-500/15 text-primary ring-1 ring-cyan-500/25",
  },
  {
    to: "/leaderboard",
    label: "Leaderboard",
    icon: MedalIcon,
    matchPrefix: true,
    iconClassName: "text-yellow-500",
    activeClassName: "bg-yellow-500/15 text-primary ring-1 ring-yellow-500/25",
  },
  {
    to: "/badges",
    label: "Badges",
    icon: TrophyIcon,
    matchPrefix: true,
    iconClassName: "text-lime-500",
    activeClassName: "bg-lime-500/15 text-primary ring-1 ring-lime-500/25",
  },
  {
    to: "/pricing",
    label: "Upgrade",
    icon: CrownIcon,
    matchPrefix: true,
    iconClassName: "text-amber-500",
    activeClassName: "bg-amber-500/15 text-primary ring-1 ring-amber-500/25",
  },
  {
    to: "/settings",
    label: "Settings",
    icon: SettingsIcon,
    iconClassName: "text-slate-500",
    activeClassName: "bg-slate-500/15 text-primary ring-1 ring-slate-500/25",
  },
];

/**
 * Sprint dashboard entry. Only shown when the user has an active sprint (see
 * `hasSprint`), so pure subscribers and free users don't see a dead link.
 */
export const SPRINT_NAV_ITEM: NavItem = {
  to: "/sprint",
  label: "My Sprint",
  icon: RocketIcon,
  matchPrefix: true,
  iconClassName: "text-pink-500",
  activeClassName: "bg-pink-500/15 text-primary ring-1 ring-pink-500/25",
};

/** Decorative suit used on home/marketing only — not in main nav. */
export { DiamondIcon };
