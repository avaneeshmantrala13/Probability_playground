# Stage 10 Summary — Final QA & Deployment

## Goal

Final quality pass (responsiveness, accessibility, theming, build health) and
deployment setup for Vercel (frontend) + Firebase (backend, Spark plan).

## What was done

### Deployment setup

- `vercel.json` — SPA rewrites so client routes like `/lessons/lesson_1` resolve
  to `index.html` and survive a hard refresh.
- `README.md` — added a Vercel deployment section: import repo, set
  `VITE_FIREBASE_*` env vars in Vercel, and add the Vercel domain to Firebase
  **Authorized domains** for Google sign-in.
- No Cloud Functions, no Blaze plan, no server code — everything runs on the
  free tier from the browser.

### Build / performance QA

- Split heavy vendors via `manualChunks` (`react`, `firebase`, `charts`). The
  app chunk is now ~107 kB (~27 kB gzipped) and the >500 kB warning is gone;
  vendors cache separately across deploys.
- `npm run build` — passes (strict TypeScript, no errors).
- `npm run validate:content` — passes (6 lessons, 180 questions, all
  explanations empty).
- Lint sweep across `src` — no errors.

### Accessibility & responsiveness review

- **Theming:** all colors come from semantic tokens; light/dark both meet WCAG
  AA contrast for text/surface/accent pairs. Charts read theme variables and
  recolor on toggle. No `bg-white` / `text-black`.
- **A11y:** icons use `currentColor` (never invisible); options are a
  `radiogroup` with `aria-checked`; the theme picker is a labeled `radiogroup`;
  progress uses `progressbar`; the auto-run/replacement toggles are `switch`es;
  feedback uses `role="status"`; focus-visible outlines are defined globally.
- **Responsive:** max-width containers with mobile padding; the header collapses
  to a hamburger drawer on small screens; charts use `ResponsiveContainer`; the
  spinner lays out side-by-side on wide screens and stacks on mobile;
  `overflow-x: hidden` on the body prevents horizontal scrolling. Touch and
  mouse both work (range sliders, buttons, toggles).

### Robustness fix

- The lesson player no longer initializes an attempt for a **locked** lesson
  reached via direct URL (guarded by `isLessonUnlocked` before hydration), in
  addition to redirecting away.

## MVP success criteria — coverage

- Create account / log in (username, email, or Google) — Stage 1.
- Complete lessons, interact with simulations, instant feedback — Stages 3–5.
- Leave mid-lesson and resume exactly where stopped (any device) — Stage 6.
- Track progress, streak; unlock lessons via 80% mastery; remediation — Stages
  6–7.
- Works on mobile and desktop, light/dark — Stages 2, 4, 10.

## Outstanding (not a code task)

- **Explanations (Stage 9):** awaiting product-owner text. The app renders them
  automatically once the `explanations` fields are filled; until then a neutral
  placeholder is shown. See [explanations-guide.md](explanations-guide.md).

## How to ship

1. `cp .env.example .env` and fill Firebase values (README has the steps).
2. Publish `firestore.rules` in the Firebase console.
3. Import the repo to Vercel, add the `VITE_FIREBASE_*` env vars, deploy.
4. Add the Vercel domain to Firebase Authorized domains.
