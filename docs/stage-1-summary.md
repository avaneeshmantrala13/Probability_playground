# Stage 1 Summary — Project Setup, Firebase Auth & Responsive Shell

## Goal

Lay the foundation: a Vite + React + TypeScript + Tailwind + React Router app,
Firebase Authentication (Google + username/email/password), and a responsive app
shell. Everything must run on the Firebase **Spark (free) plan** with no Cloud
Functions and no paid services.

## What was built

### Tooling & configuration

- `package.json` — React 18, React Router 6, Firebase 10, Recharts (for later
  simulation charts), Tailwind 3, Vite 5, TypeScript 5.
- `vite.config.ts`, `tsconfig*.json` — strict TypeScript, project references.
- `tailwind.config.js` + `src/index.css` — semantic design tokens via CSS
  variables (`bg`, `surface`, `primary`, `secondary`, `accent`, `success`,
  `danger`, chart palette) for both light and dark themes. Reusable component
  classes: `pp-card`, `pp-btn-primary`, `pp-input`, etc. No raw `bg-white` /
  `text-black` anywhere.
- `index.html` — applies the persisted theme **before paint** to avoid a flash
  of the wrong theme; mobile viewport meta with `viewport-fit=cover`.
- `.env.example`, `src/vite-env.d.ts` — typed `VITE_FIREBASE_*` env config.
- `.gitignore` — keeps real `.env` / secrets out of git.

### Firebase + auth

- `src/lib/firebase.ts` — initializes Firebase only when all env values exist;
  exports `isFirebaseConfigured` so the UI degrades gracefully.
- `src/lib/auth.ts` — the auth service:
  - `signUpWithUsername(username, email, password)` — creates the auth account,
    then writes `users/{uid}`, `settings/{uid}`, and the public
    `usernameMappings/{usernameLower}` doc in a single batch.
  - `signInWithIdentifier(identifier, password)` — if the identifier is a
    username, it resolves the email from `usernameMappings` first, then signs in.
    Emails sign in directly.
  - `signInWithGoogle()` — popup sign-in; provisions a user doc on first login.
  - Username validation (3–20 chars, `[a-zA-Z0-9_]`), uniqueness check, and
    friendly error mapping (`AuthError`).
- `src/context/AuthContext.tsx` — `onAuthStateChanged` subscription exposing
  `{ user, loading, configured }`.
- `firestore.rules` — Spark-safe rules: users can only touch their own docs;
  `usernameMappings` is publicly readable (needed for pre-auth username lookup)
  and create-only, pointing at the creating user.

### UI & routing

- `src/main.tsx` — `BrowserRouter` + `AuthProvider`.
- `src/App.tsx` — routes: `/login`, `/signup`, and protected `/`. Shows the
  Firebase setup notice when unconfigured and a loading screen while auth
  resolves.
- Pages: `Login` (username **or** email + password, plus Google), `Signup`
  (username + email + password, plus Google), `Dashboard` (placeholder).
- Components: `Brand`, `GoogleButton`, `FirebaseSetupNotice`, `LoadingScreen`,
  `ProtectedRoute`, `AppShell` (sticky responsive header + footer).

## Thought process & key decisions

- **Username/email/password without Cloud Functions.** The Spark plan forbids
  server code, so username→email resolution happens client-side via a publicly
  readable `usernameMappings` collection. Security rules make it create-only and
  owner-bound to prevent hijacking. This is the standard free-tier pattern and
  matches the PRD's "store usernames separately and map to email" requirement.
- **Graceful unconfigured state.** Rather than crashing when `.env` is empty,
  `isFirebaseConfigured` drives a setup screen, so the project runs immediately
  after clone and tells the owner exactly what to do.
- **Theme tokens up front.** Even though the full theme toggle is Stage 2, the
  token system is foundational, so all colors are already semantic and
  dark-mode-ready. This avoids retrofitting colors later.
- **Recharts pre-installed** so Stage 4 simulations can render responsive,
  theme-aware charts without another dependency pass.

## Verification

- `npm install` — success.
- `npm run build` (`tsc -b && vite build`) — success, no type errors.
- No linter errors.

## How to run

```bash
npm install
cp .env.example .env   # fill in Firebase values (README has step-by-step)
npm run dev
```

## Not done yet (by design)

Theme toggle UI, full navigation, lesson engine, simulations, feedback,
progress persistence, mastery, curriculum content, explanations. These are
Stages 2–10.

## STOP — awaiting approval before Stage 2.
