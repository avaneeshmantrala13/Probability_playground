import type { ComponentType, SVGProps } from "react";
import { BookIcon, HomeIcon, SettingsIcon } from "../icons";

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
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];
