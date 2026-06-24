# Stage 7 Summary — Mastery System & Remediation

## Goal

Gate progression on mastery: a student must score >= 80% to unlock the next
lesson. If they fall short, do not unlock — instead serve the authored
remediation variants (same concept, different numbers/scenarios). No AI
generation; all variants come from the content files.

## What was built

- `src/lib/mastery.ts` — the mastery + remediation rules:
  - `PASS_THRESHOLD = 0.8`, `scoreToPercent`, `isPassing`.
  - `isLessonUnlocked(lessonId, progress)` — first lesson is always open;
    others unlock only when the previous lesson is `passed`.
  - `roundForLesson` — 0 for primary questions, then one remediation round per
    prior failed attempt.
  - `buildAttemptQuestions(lesson, round)` — round 0 renders the primary
    questions; rounds >= 1 substitute authored remediation variants, cycling
    through the two variants (`variantIndex = (round - 1) % 2`). Explanations
    pass through untouched (still empty).

- `src/lib/progress.ts` — added `round` to `ActiveAttempt` and
  `recordLessonAttempt` (writes an immutable record to
  `lessonAttempts/{uid}/attempts`).

- `src/context/ProgressContext.tsx` — `completeAttempt(lessonId, round, correct,
  total)` scores the attempt, updates `lessonMastery` (best score, attempt
  count, passed flag), appends the lesson to `completedLessons` on a pass,
  clears the active attempt, and records the attempt doc. Returns an
  `AttemptResult` for the UI.

- `src/pages/LessonPlayer.tsx` — now mastery-aware:
  - Redirects away from locked lessons.
  - Initializes the correct round on entry (primary or remediation) and rebuilds
    the question set via `buildAttemptQuestions`.
  - On "Finish lesson", scores the attempt and shows a **results screen**:
    pass -> "Lesson mastered! Next lesson unlocked" with a link onward; fail ->
    "Keep practicing" with a "Practice again" button that starts the next
    remediation round (fresh variant set).
  - Remediation rounds are clearly badged ("Practice round N") with a short
    explainer.

- `src/pages/Lessons.tsx` — locked lessons render non-clickable with a lock icon
  and "Locked" label; passed lessons show a check and "Best %".

## Thought process & key decisions

- **Rounds drive remediation deterministically.** Tying the remediation round to
  the number of failed attempts (and the variant index to the round) means each
  retry shows a genuinely different authored variant, cycling through the two
  per the PRD — with zero generation.
- **Mastery is monotonic.** `bestScore` and `passed` never regress, so a student
  who passes stays unlocked even if a later review attempt scores lower.
- **Locking enforced in two places.** The lessons grid disables locked cards and
  the player redirects locked routes, so progression can't be bypassed via URL.
- **Attempt history persisted.** Each finished attempt is recorded under
  `lessonAttempts` (round, score, pass/fail) per the Firestore schema — useful
  data with no extra cost on the free tier.

## Verification

- `npm run build` — success, no type errors.
- No linter errors.
- Logic check: scoring computes correct/total over the rendered question set;
  >= 80% passes and unlocks the next lesson; < 80% serves the next variant round
  and keeps the next lesson locked.

## Not done yet (by design)

The full 6-lesson, 180-question curriculum (Stage 8) — currently only the Lesson
1 sample exists, so lock/remediation behavior is exercised against that. Real
explanation text is Stage 9.

## STOP — awaiting approval before Stage 8.
