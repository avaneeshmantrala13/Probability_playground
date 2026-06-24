import { useTheme } from "../context/ThemeContext";
import { MoonIcon, SunIcon } from "./icons";

export function ThemeToggle() {
  const { resolved, toggle } = useTheme();
  const isDark = resolved === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-secondary transition-colors hover:bg-surface-muted hover:text-primary"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? <SunIcon size={20} /> : <MoonIcon size={20} />}
    </button>
  );
}
