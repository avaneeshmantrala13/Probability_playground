# Flagship Lesson Review

This document is the owner sign-off package for the **Lesson Experience overhaul**
(branch `feature/lesson-experience-overhaul`). It defines the new interview-grade
content standard, shows exactly what changed in the three flagship lessons, documents
the new schemas, and explains how to mass-produce the rest of the catalog.

---

## 1. The new content standard

Every flagship lesson now ships **three layers**, in order of how a learner meets them:

1. **Narrated concept primer** (`primerNarration`) — an auto-advancing, voiced
   slideshow ("free in-app AI video") that introduces the key terms in ~5 slides.
   Uses the browser Web Speech API; captions are always on so it degrades gracefully
   with no voice. Skippable, replayable, never forced on restart.
2. **Rich paced primer** (`primer`) — a multi-page, one-concept-per-page reading flow
   with worked examples that teach the **solving method**, key-term glossaries, and
   declarative visuals (formulas, callouts, step lists, tables, bars). Also browsable
   independently in the new **/learn** library.
3. **Difficulty-ramped question set** — authored questions plus the matching practice
   bank, drawn per attempt with a seeded RNG and ordered easy→hard. Every option has a
   teaching explanation (why the right answer is right *and* why each distractor is the
   tempting mistake).

**Quality bar applied to all three flagships:**

- 100% answer correctness — all math re-derived by hand (see §3 for two bugs fixed).
- Explanations teach the *process*, not just the verdict.
- Interview-grade depth and a genuine difficulty ramp.
- Accessible, modern UI using existing Tailwind tokens; no new heavy dependencies.

---

## 2. What changed per flagship

### `lesson_1` — Probability Basics for Quants
- **Added `primer`** (5 sections): the language of uncertainty (sample space / event),
  the three Kolmogorov axioms, complements & inclusion–exclusion, counting equally
  likely outcomes + the multiplication rule, and expected value as the trader's number.
- **Added `primerNarration`** (5 slides) covering sample space, axioms, complement rule,
  favorable/total, and expected value.
- **Fixed a correctness bug:** `l1_q8` previously claimed
  `0.08×50 + 0.92×(−10) = −$6.00` (actual value `−5.2`, which was not even an option).
  Re-cut to clean numbers: win `$50` w.p. `0.10`, lose `$10` w.p. `0.90` →
  `E = 5 − 9 = −$4.00`, and `correctAnswer` updated to the matching option with rewritten
  explanations.

### `lesson_2` — Combinatorics & Counting (owner flagged "too basic")
- **Upgraded to interview-grade.** Added a 6-section `primer` that goes well beyond rote
  factorials: order-vs-repetition decision framework, permutations, combinations,
  **stars-and-bars**, **inclusion–exclusion** (2 and 3 sets), and **combinatorial
  probability + expected counts via linearity of expectation**.
- **Added `primerNarration`** (5 slides) mirroring those concepts.
- **Added two challenge questions** with two remediation variants each:
  - `l2_q13` (**stars-and-bars**): distribute 10 identical lots across 4 books →
    `C(13,3) = 286`. Distractors encode the classic off-by-one (`C(12,3)`),
    `k`-vs-`k−1` bar error (`C(13,4)`), and the "treat as distinct" trap (`4^10`).
  - `l2_q14` (**expected counts / linearity of expectation**): expected aces in a
    5-card hand → `5 × 4/52 = 5/13 ≈ 0.385`. Remediations: expected 6s in 12 rolls (`2`)
    and expected heads in 10 flips (`5`).
- Lesson now has 14 questions (within the 10–14 validator bound) and 6 challenge
  questions (at the allowed max). All pre-existing answers were re-verified correct.

### `pt_fundamentals` — Poker Fundamentals (Poker Theory L1)
- **Added `primer`** (5 sections): how a hand unfolds (streets/showdown), blinds & stakes
  (SB/BB, reading `$1/$2`, measuring stacks in big blinds), position & the button,
  **stack-to-pot ratio (SPR)**, and **pot odds** (breakeven equity = `call / (pot + call)`).
- **Added `primerNarration`** (6 slides) covering streets, blinds, stakes/stacks,
  position, SPR, and pot odds — exactly the L1 terms the brief called out.
- Existing questions were re-verified (e.g. SPR `200/18 ≈ 11`, `150/30 = 5`); all correct,
  so the question set was preserved.

> **Authoring note for primers in money-heavy domains (poker):** primer/narration bodies
> render through a markdown-lite parser where `$ … $` denotes inline math. Wrap dollar
> amounts in backticks (`` `$1/$2` ``) so they render as literal code and never get parsed
> as math. Narration *captions* are plain text (and spoken aloud), so write amounts there
> as words ("a small blind of one").

---

## 3. New schemas (additive, backward-compatible)

All additions live in `src/content/types.ts` and are **optional**, so every existing
lesson keeps working with no changes; `intro` remains the fallback when `primer` is absent.

```ts
interface PrimerKeyTerm { term: string; definition: string; }

interface PrimerExample {
  prompt: string;
  steps: string[];   // the METHOD, ordered
  result?: string;
}

type PrimerVisual =
  | { kind: "formula"; expression: string; caption?: string }
  | { kind: "callout"; tone?: "info" | "warning" | "success"; title?: string; text: string }
  | { kind: "bars"; caption?: string; items: { label: string; value: number; note?: string }[] }
  | { kind: "steps"; caption?: string; items: string[] }
  | { kind: "table"; caption?: string; headers: string[]; rows: string[][] };

interface PrimerSection {
  heading: string;
  body: string[];          // markdown-lite: **bold**, `code`, \( … \) or $ … $ math
  keyTerms?: PrimerKeyTerm[];
  example?: PrimerExample;
  visual?: PrimerVisual;
}

interface NarrationSlide {
  title: string;
  caption: string;         // spoken AND shown as captions
  term?: string;
  bullets?: string[];
  visual?: PrimerVisual;
}

interface Lesson {
  /* …existing… */
  primer?: PrimerSection[];
  primerNarration?: NarrationSlide[];
}
```

Attempt persistence (`src/lib/progress.ts`) gained an additive `AttemptSelection`
(`{ seed, questionIds }`) stored on `ActiveAttempt.selection`. All existing
save-resilience logic (retry/backoff, read-back verification, `stripUndefined`,
failure banner) is untouched.

---

## 4. How randomization persists: reload vs restart

- **Fresh attempt / restart** → a new `seed` is generated, a difficulty-ramped set is
  drawn from `authored questions + practice bank` (`src/lib/attempt.ts:drawAttemptSelection`),
  and `{ seed, questionIds }` is saved into `activeAttempt.selection`.
- **Mid-attempt reload** → the player rehydrates from `activeAttempt.selection` and
  `resolveAttemptQuestions` reconstructs the **exact same** questions in the same order,
  so progress and answers line up.
- **Legacy attempts** (saved before this feature) have no `selection`; players fall back
  to `buildAttemptQuestions`, so nothing breaks.
- Applied consistently across all three players (`LessonPlayer`,
  `MarketMakingLessonPlayer`, `PokerTheoryPlayer`). `PracticeSession` keeps its own shuffle.

---

## 5. How to mass-produce the rest

For each remaining lesson, repeat this recipe (no code changes needed — content only):

1. **Write `primer` sections (4–6).** One concept per page. Each should have a short
   `body`, and where it helps, a `visual` and a worked `example` whose `steps` show the
   method. Add `keyTerms` for any vocabulary the questions assume.
2. **Write `primerNarration` (4–6 slides)** from the same concepts. Keep captions
   conversational (they are read aloud); put symbols/formulas in the slide `visual`,
   not the spoken caption.
3. **Audit the question set** for an easy→hard ramp and interview relevance. Add 1–2
   challenge questions if the lesson is thin (mind the validator bounds: 10–14 questions,
   ≤6 challenge, each challenge needs 2 remediation variants).
4. **Re-derive every answer by hand.** Make distractors *diagnostic* — each should be the
   result of a specific, nameable mistake, and the explanation should name it.
5. **Validate & build:** `npm run validate:content` then `npm run build:fast` (must exit 0).
6. In money-heavy domains, follow the backtick/word convention from §2 to keep `$` out of
   the math parser.

**Validation commands**

```bash
npm run validate:content   # structural + count rules across all tracks
npm run build:fast         # tsc + vite; must exit 0
```
