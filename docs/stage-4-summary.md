# Stage 4 Summary — Simulation Framework (8 Engines)

## Goal

Build the reusable, theme-aware, responsive simulation engines and dispatch them
by `simulation.type`. These are the heart of the "learn by doing" experience:
students manipulate them and watch charts update in real time before answering.

## What was built

### Shared framework

- `src/components/simulations/useChartColors.ts` — reads the chart palette from
  CSS variables and **recomputes when the theme changes**, giving Recharts the
  concrete color strings it needs while staying dark-mode-aware.
- `src/components/simulations/ui.tsx` — shared controls and layout: `SimFrame`
  (visual + stats + controls), `SimButton`, `TrialSlider` (the required trial
  slider), `ToggleControl` (accessible switch for auto-run / replacement),
  `StatGrid`/`Stat`, and themed Recharts tooltip styles.
- `src/components/simulations/charts.tsx` — two reusable themed charts:
  `FrequencyBarChart` (per-bar palette colors, responsive) and
  `RunningLineChart` (running proportion with an optional theoretical target
  line). Both use `ResponsiveContainer` so they reflow on mobile.
- `src/components/simulations/random.ts` — `randomInt`, `randomNormal`
  (Box-Muller), `mean`, `median`, `clamp`.
- Themed range-slider styles added to `index.css` (`.pp-range`).

### The 8 engines (`src/components/simulations/engines/`)

1. **CoinFlip** — trial slider, Flip button, auto-run toggle, Heads/Tails bar
   chart + % heads. (Lessons 1–3)
2. **Dice** — trial slider, Roll button, face-frequency chart. (Lessons 1–4)
3. **Spinner** — adjustable sectors (2–8), animated SVG wheel + spin button +
   frequency chart. (Lesson 2)
4. **ExperimentalProbability** — large-sample runs (up to 2000), running-
   proportion line chart converging to the theoretical target. (Lesson 3)
5. **TwoCoin** — HH/HT/TH/TT visualization. (Lesson 4)
6. **TwoDice** — sum distribution (2–12) with most-frequent-sum stat. (Lesson 4)
7. **CardMarble** — draw marbles or cards, with/without replacement, live
   "P(next = color)" updates and a draw-frequency chart. (Lesson 5)
8. **DistributionBuilder** — generate samples (bell / uniform / skewed),
   histogram, and mean / median / range stats. (Lesson 6)

### Wiring

- `src/components/simulations/registry.ts` — maps every `SimulationType` to its
  component.
- `src/components/simulations/SimulationView.tsx` — replaced the Stage 3
  placeholder; now renders the real engine from the registry (with a graceful
  fallback for unknown types). Because `QuestionCard` already renders
  `SimulationView`, every question now shows a live simulation automatically.

## Thought process & key decisions

- **One registry, JSON-driven.** Questions only declare `{ "type": "..." }`;
  the registry resolves the component. Adding or swapping a simulation in
  content requires no code change.
- **Theme-aware charts the hard part.** Recharts needs literal colors, but the
  app themes via CSS variables. `useChartColors` bridges this by reading the
  computed variables on each theme change, so charts never show invisible or
  off-theme colors in dark mode.
- **Shared primitives, thin engines.** Controls, stats, and charts are shared,
  so each engine is small and focused on its probability logic. This keeps all 8
  consistent and responsive (`SimFrame` stacks visual/stats/controls; charts use
  `ResponsiveContainer`; the spinner lays out side-by-side on wide screens and
  stacks on mobile).
- **Animations off for data.** Chart animations are disabled so rapid runs
  update instantly without flicker; only the spinner wheel animates (for feel).
- **Config-driven defaults.** Engines read optional params from
  `SimulationConfig` (e.g. `sectors`, `probability`, `shape`, `trials`) so Stage
  8 content can tune them, with sensible fallbacks.

## Verification

- `npm run build` — success, no type errors (886 modules). Bundle grew due to
  Recharts (~277 kB gzipped); acceptable for the MVP and can be code-split later
  if needed.
- No linter errors.

## Not done yet (by design)

Answer checking, feedback, and the explanation panel (Stage 5); progress
(Stage 6); mastery + remediation (Stage 7); full curriculum (Stage 8).

## STOP — awaiting approval before Stage 5.
