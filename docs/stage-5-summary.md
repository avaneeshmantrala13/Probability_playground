# Stage 5 Summary — Feedback Engine & Explanation Section

## Goal

Complete the per-question flow: after the student selects an answer and checks
it, give **immediate** correct/incorrect feedback and reveal the explanation
section — which must exist but stay empty until the product owner provides text.

## What was built

- `src/components/lesson/FeedbackPanel.tsx`
  - A status banner: green "Correct!" or red "Not quite — the answer is X."
  - An **Explanation section** that always renders. For a correct answer it
    shows the correct option's explanation; for an incorrect answer it shows
    both "why your choice is incorrect" and "why the correct choice is correct".
  - Because all explanation fields are currently empty strings, each shows a
    neutral placeholder ("Explanation coming soon."). **No explanation text is
    invented** — when the owner fills the JSON fields in Stage 9, the real text
    appears automatically.

- `src/pages/LessonPlayer.tsx` — upgraded the question flow:
  - Per-question state is now `{ selected, checked }`.
  - "Check answer" is disabled until an option is chosen; checking locks the
    options and renders the feedback panel.
  - After checking, options recolor via `getOptionState`: the correct option
    turns green, an incorrect selection turns red, the rest are muted.
  - The action button advances: Check answer -> Next -> Finish.

The full required sequence is now live for every question:
**simulation -> live chart -> prompt -> multiple choice -> immediate feedback ->
explanation section.**

## Thought process & key decisions

- **Reused Stage 3 seams.** `QuestionCard`'s `getOptionState`, `locked`, and
  `footer` props were designed for exactly this, so the feedback engine slotted
  in with no changes to the card or option components.
- **Explanation policy enforced in code.** `FeedbackPanel` reads
  `explanations[letter]`; if empty it renders a placeholder. There is no code
  path that fabricates explanation copy. This guarantees the app honors the
  "STOP — ask the product owner" rule while still showing the section's
  structure.
- **Correctness is tracked but not yet scored.** Per-question correctness is
  computed here; turning it into a lesson score, mastery, and remediation is
  Stage 7. Persisting it is Stage 6.

## Verification

- `npm run build` — success, no type errors.
- No linter errors.
- Manual flow: select -> check shows feedback + colored options + explanation
  placeholder; Next/Finish advance correctly.

## Not done yet (by design)

Progress persistence and resume (Stage 6); scoring, 80% mastery gate, and
remediation variants (Stage 7); full curriculum (Stage 8); real explanation text
(Stage 9).

## STOP — awaiting approval before Stage 6.
