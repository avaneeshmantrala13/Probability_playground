import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Brand } from "../Brand";
import { ThemeToggle } from "../ThemeToggle";
import { useAuth } from "../../context/AuthContext";
import { signOut } from "../../lib/auth";
import { useThemeSync } from "../../hooks/useThemeSync";
import { CloseIcon, LogOutIcon, MenuIcon } from "../icons";
import { FallingCards } from "../home/FallingCards";
import { NAV_ITEMS, type NavItem } from "./navItems";

function navLinkClass(isActive: boolean, item: NavItem): string {
  return [
    "inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
    isActive
      ? item.activeClassName
      : "text-secondary hover:bg-surface-muted/80 hover:text-primary",
  ].join(" ");
}

function NavItemLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  return (
    <NavLink
      to={item.to}
      end={!item.matchPrefix}
      onClick={onNavigate}
      className={({ isActive }) => navLinkClass(isActive, item)}
    >
      <item.icon size={22} className={item.iconClassName} />
      <span className="whitespace-nowrap">{item.label}</span>
    </NavLink>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  useThemeSync();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const displayName = user?.displayName ?? user?.email ?? "Learner";

  return (
    <div className="relative flex min-h-screen flex-col">
      <FallingCards />
      <header className="sticky top-0 z-30 border-b border-subtle bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-[4.25rem] w-full max-w-[90rem] items-center justify-between gap-3 px-3 sm:px-5">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
            <Link to="/" className="flex shrink-0 items-center" aria-label="Home">
              <Brand size={32} withWordmark />
            </Link>
            <nav
              className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto pb-0.5 md:flex [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-accent/30"
              aria-label="Primary"
            >
              {NAV_ITEMS.map((item) => (
                <NavItemLink key={item.to} item={item} />
              ))}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
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
            <nav
              className="mx-auto flex w-full max-w-[90rem] gap-2 overflow-x-auto px-3 py-3 [&::-webkit-scrollbar]:hidden"
              aria-label="Mobile"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {NAV_ITEMS.map((item) => (
                <NavItemLink key={item.to} item={item} onNavigate={() => setMenuOpen(false)} />
              ))}
            </nav>
            <div className="mx-auto flex w-full max-w-[90rem] items-center justify-between border-t border-subtle px-3 py-3">
              <span className="truncate text-sm text-secondary">{displayName}</span>
              <button type="button" onClick={() => void signOut()} className="pp-btn-secondary">
                <LogOutIcon size={18} />
                Sign out
              </button>
            </div>
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
