# Stage 6 Summary — Progress Persistence & Exact Resume

## Goal

Persist student progress to Firestore so it survives refresh, logout/login,
browser restart, and device switch — and let the student resume **exactly** where
they stopped (same lesson, same question, same answered state). Track the daily
streak.

## What was built

- `src/lib/progress.ts` — the progress model + Firestore I/O:
  - `CourseProgress`: `currentLesson`, `currentQuestion`, `completedLessons`,
    `lessonMastery`, `streak`, `lastActiveDate`, and `activeAttempt`
    (`{ lessonId, answers: [{ selected, checked }] }`) for exact resume.
  - `fetchProgress` / `saveProgress` against `courseProgress/{uid}` (merge
    writes, `serverTimestamp`).
  - `computeStreak` — same day = unchanged, consecutive day = +1, any gap or
    first visit = reset to 1; `todayKey` for local YYYY-MM-DD.

- `src/context/ProgressContext.tsx` — app-wide progress state:
  - Hydrates from Firestore on sign-in (and bumps the streak/`lastActiveDate`
    once per day), resets on sign-out.
  - `update`, `setPosition`, `saveAttempt`, `clearActiveAttempt`.
  - **Debounced writes** (700 ms) so rapid navigation/answering doesn't spam
    Firestore, plus a `beforeunload` flush so nothing is lost on tab close.
  - Wired into `main.tsx` inside `AuthProvider`.

- `src/pages/LessonPlayer.tsx` — now persistence-aware:
  - On load (after progress hydrates) it **resumes**: if there's an
    `activeAttempt` for this lesson it restores all answers and jumps to the
    saved `currentQuestion`; otherwise it starts a fresh attempt and records the
    position.
  - Saves position on every question change and saves the attempt on every
    answer/check.
  - Finishing clears the active attempt.

- `src/pages/Lessons.tsx` — shows the **day streak**, a "Continue where you left
  off" resume card, and per-lesson `Best %` / completion check (these fill in
  once Stage 7 records mastery).

## Thought process & key decisions

- **`activeAttempt` enables true exact resume.** Storing only lesson+question
  would lose which options were already answered/checked. Persisting the full
  answers array means a student can close the tab mid-lesson on their phone and
  reopen on a laptop to the identical state.
- **Debounce + unload flush.** Free-tier Firestore has quotas; debouncing keeps
  writes economical while the `beforeunload` flush guarantees durability. All
  writes are client-side `setDoc(merge)` — no Cloud Functions.
- **Streak computed at hydration.** Opening the app counts as activity for the
  day; the streak is derived from `lastActiveDate` so it's resilient to multiple
  logins per day and missed days.
- **Hydration guard.** A `hydratedFor` ref prevents the resume effect from
  re-running (and clobbering local edits) when the debounced save updates the
  shared progress object.

## Verification

- `npm run build` — success, no type errors.
- No linter errors.
- Logic check: refresh/login restores position and answers from
  `courseProgress/{uid}`; security rules (Stage 1) already restrict the doc to
  its owner.

## Not done yet (by design)

Scoring + the 80% mastery gate + lesson locking + remediation variant serving
(Stage 7); full curriculum (Stage 8); explanations (Stage 9). `completedLessons`
and `lessonMastery` are persisted but only populated starting in Stage 7.

## STOP — awaiting approval before Stage 7.
