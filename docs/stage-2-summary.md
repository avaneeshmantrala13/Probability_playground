# Stage 2 Summary — Theme System, Dark Mode & Navigation

## Goal

Add a complete light/dark theme system (with no invisible text/icons and WCAG AA
contrast), persist the user's preference across devices, and build responsive
navigation.

## What was built

### Theme system

- `src/context/ThemeContext.tsx` — tri-state preference (`light` / `dark` /
  `system`) with a resolved value. Listens to the OS `prefers-color-scheme`
  media query so "system" updates live, applies the `dark` class + `colorScheme`
  to `<html>`, and persists to `localStorage` under `pp-theme`.
- The pre-paint script in `index.html` (added Stage 1) reads the same key so
  there is no flash of the wrong theme on load.
- `src/components/ThemeToggle.tsx` — sun/moon toggle button with an accessible
  label.
- `src/hooks/useThemeSync.ts` — syncs the preference to the user's
  `settings/{uid}` Firestore doc on change and hydrates it on login, so the
  theme follows the student across devices. localStorage stays the fast local
  source of truth; Firestore is the cross-device backup. Guarded so the default
  never overwrites the stored remote value before it is read.

### Navigation

- `src/components/icons.tsx` — a small inline SVG icon set (`currentColor`, so
  icons inherit theme text colors and never go invisible).
- `src/components/layout/navItems.ts` — single source of truth for nav links
  (Home, Lessons, Settings).
- `src/components/layout/AppShell.tsx` — rebuilt with:
  - Desktop horizontal nav with active-state highlighting (`NavLink`).
  - Mobile hamburger menu that expands a full nav drawer and auto-closes on
    route change.
  - Theme toggle and sign-out in the header.
- `src/pages/Settings.tsx` — appearance section (light/dark/system radio group)
  + account info. Built as an accessible `radiogroup`.

### Routing

- `src/App.tsx` — refactored with a `Protected` wrapper; added `/settings` and a
  `/lessons` route (currently mapped to the dashboard placeholder until Stage 3
  builds the lesson list).
- `src/main.tsx` — wraps the tree in `ThemeProvider`.

## Thought process & key decisions

- **Semantic tokens, not hardcoded colors.** All colors resolve through CSS
  variables defined per theme in `index.css`, so adding dark mode required zero
  per-component color changes — the tokens just swap. This is what keeps text and
  icons visible in both themes and satisfies the "no invisible text/icons" rule.
- **`currentColor` icons.** Icons inherit the surrounding text color, so they
  can never become invisible against a themed background.
- **System option + live updates.** Respecting the OS preference is the modern
  default; the media-query listener keeps it correct without a reload.
- **localStorage first, Firestore second.** localStorage enables instant,
  pre-paint theming with no network dependency; Firestore makes it portable
  across devices. The hydration guard prevents a race where the local default
  clobbers the saved remote value.

## Verification

- `npm run build` — success, no type errors.
- No linter errors.
- Contrast: text/surface/accent token pairs chosen to meet WCAG AA in both
  themes.

## Not done yet (by design)

Lesson list/engine, simulations, feedback, progress, mastery, curriculum,
explanations.

## STOP — awaiting approval before Stage 3.
