# Stage 3 Summary — Lesson Engine & JSON Rendering

## Goal

Define the content model and build a data-driven engine that renders lessons and
questions from JSON files (not Firestore), following the PRD question layout:
simulation -> prompt -> multiple-choice options.

## What was built

### Content model

- `src/content/types.ts` — TypeScript types for the whole curriculum:
  `SimulationType` (the 8 engines), `SimulationConfig`, `Question`
  (`kind: standard | challenge`, `concept` tag, `correctAnswer` index,
  `explanations`, two `remediation` variants), `RemediationVariant`, `Lesson`,
  and `RenderableQuestion` (the shared shape used to render either a primary
  question or a remediation variant). `OPTION_LETTERS = [A, B, C, D]`.
- `src/content/index.ts` — a loader that uses Vite's `import.meta.glob` to
  eagerly import every `lessons/*.json` file and sort them by `order`. Helpers:
  `getLesson`, `getLessonIndex`, `getNextLesson`, `TOTAL_LESSONS`. Dropping in a
  new lesson JSON auto-registers it.
- `src/content/lessons/lesson1.json` — a representative Lesson 1 sample (3
  questions incl. one challenge, each with 2 remediation variants) used to drive
  and validate the engine. All `explanations` fields are empty strings per the
  Explanation Policy. The full 6-lesson / 180-question curriculum is authored in
  Stage 8.

### Rendering components

- `src/components/simulations/SimulationView.tsx` — placeholder simulation
  surface keyed by `simulation.type`; the real interactive engines land in
  Stage 4.
- `src/components/lesson/OptionButton.tsx` — accessible multiple-choice option
  with lettered badge and visual states (`idle`, `selected`, `correct`,
  `incorrect`, `muted`). The correct/incorrect states are ready for Stage 5's
  feedback engine.
- `src/components/lesson/QuestionCard.tsx` — composes the simulation slot, the
  prompt, the options (`radiogroup`), and an optional `footer` slot reserved for
  feedback/explanations. Accepts a `getOptionState` resolver and `locked` flag so
  later stages can drive feedback without changing this component.
- `src/components/lesson/ProgressBar.tsx` — accessible `progressbar`.

### Pages & routing

- `src/pages/Lessons.tsx` — the home/lessons grid (lesson cards with order,
  title, subtitle, question count). Used for both `/` and `/lessons`.
- `src/pages/LessonPlayer.tsx` — `/lessons/:lessonId`; loads the lesson, walks
  through questions with Previous/Next, tracks per-question selection in local
  state, shows the progress bar, and redirects invalid IDs back to the list.
- `src/App.tsx` — added `/lessons/:lessonId`; removed the old placeholder
  `Dashboard` page.

## Thought process & key decisions

- **JSON in the bundle, not Firestore.** Per the PRD, curriculum is static
  content. `import.meta.glob` keeps it zero-config: authors just add files in
  Stage 8.
- **One renderable shape for primary + remediation.** `RenderableQuestion` lets
  the same `QuestionCard` render a primary question or a remediation variant,
  which keeps Stage 7 (remediation) simple.
- **Feedback-ready, feedback-free.** Stage 3 intentionally renders and navigates
  without scoring. `QuestionCard`'s `getOptionState`/`locked`/`footer` props are
  the seams Stage 5 (feedback) and Stage 7 (mastery) plug into, so no rewrite is
  needed later.
- **Empty explanations enforced from day one.** The sample lesson ships with
  empty explanation strings, modeling the policy the full curriculum must follow.

## Verification

- `npm run build` — success, no type errors (JSON validated against `Lesson`).
- No linter errors.

## Not done yet (by design)

Interactive simulations (Stage 4), answer checking + feedback + explanation
panel (Stage 5), progress persistence (Stage 6), mastery/locking + remediation
(Stage 7), full curriculum authoring (Stage 8).

## STOP — awaiting approval before Stage 4.
