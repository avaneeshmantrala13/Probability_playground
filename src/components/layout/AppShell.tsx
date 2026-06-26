import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Brand } from "../Brand";
import { ThemeToggle } from "../ThemeToggle";
import { useAuth } from "../../context/AuthContext";
import { signOut } from "../../lib/auth";
import { useThemeSync } from "../../hooks/useThemeSync";
import { useQuizDifficultySync } from "../../hooks/useQuizDifficultySync";
import { CloseIcon, LogOutIcon, MenuIcon } from "../icons";
import { FallingCards } from "../home/FallingCards";
import { NAV_ITEMS } from "./navItems";

function navLinkClass(isActive: boolean): string {
  return [
    "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-surface-muted text-primary"
      : "text-secondary hover:bg-surface-muted hover:text-primary",
  ].join(" ");
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  useThemeSync();
  useQuizDifficultySync();

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const displayName = user?.displayName ?? user?.email ?? "Learner";

  return (
    <div className="relative flex min-h-screen flex-col">
      <FallingCards />
      <header className="sticky top-0 z-30 border-b border-subtle bg-surface/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center" aria-label="Home">
              <Brand size={30} withWordmark />
            </Link>
            <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={!item.matchPrefix}
                  className={({ isActive }) => navLinkClass(isActive)}
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => void signOut()}
              className="hidden pp-btn-secondary md:inline-flex"
            >
              <LogOutIcon size={18} />
              Sign out
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-secondary hover:bg-surface-muted hover:text-primary md:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-subtle bg-surface md:hidden">
            <nav className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-4 py-3" aria-label="Mobile">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={!item.matchPrefix}
                  className={({ isActive }) => navLinkClass(isActive)}
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}
              <div className="mt-2 flex items-center justify-between border-t border-subtle pt-3">
                <span className="truncate text-sm text-secondary">{displayName}</span>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="pp-btn-secondary"
                >
                  <LogOutIcon size={18} />
                  Sign out
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        {children}
      </main>

      <footer className="relative z-10 border-t border-subtle py-6">
        <div className="mx-auto w-full max-w-5xl px-4 text-center text-xs text-muted sm:px-6">
          Probability Playground &middot; Learn by doing
        </div>
      </footer>
    </div>
  );
}
