import type { ComponentType, SVGProps } from "react";
import {
  BookIcon,
  DiceIcon,
  HomeIcon,
  SettingsIcon,
  SpadeIcon,
  StoreIcon,
  TrophyIcon,
} from "../icons";

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
  /** Match nested routes (e.g. /lessons/lesson_1) as active. */
  matchPrefix?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Home", icon: HomeIcon },
  { to: "/lessons", label: "Lessons", icon: BookIcon, matchPrefix: true },
  { to: "/playground", label: "Playground", icon: DiceIcon, matchPrefix: true },
  { to: "/poker", label: "Poker Night", icon: SpadeIcon, matchPrefix: true },
  { to: "/store", label: "Store", icon: StoreIcon, matchPrefix: true },
  { to: "/badges", label: "Badges", icon: TrophyIcon, matchPrefix: true },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];
