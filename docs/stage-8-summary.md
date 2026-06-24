# Stage 8 Summary — Curriculum Integration (180 Questions)

## Goal

Author the full curriculum — 6 lessons, 10 questions each (8 standard + 2
challenge) = 60 primary questions, plus 2 remediation variants per question =
120 remediation questions. Grand total: **180 authored questions**, all with
**empty explanation fields**.

## What was built

Six lesson JSON files in `src/content/lessons/`, each matching the PRD topics,
simulations, and question themes:

| Lesson | Title | Simulations used |
| ------ | ----- | ---------------- |
| 1 | Randomness & Probability Basics | coin_flip, dice |
| 2 | Theoretical Probability | dice, spinner |
| 3 | Experimental vs Theoretical Probability | coin_flip, dice, experimental_probability |
| 4 | Compound Events | two_coin, two_dice |
| 5 | Conditional Probability Foundations | card_marble (marbles + cards) |
| 6 | Introductory Statistics | distribution_builder |

Each question includes: a `kind` (standard/challenge), a `concept` tag (used to
pair remediation), the simulation config, prompt, 4 options, the
zero-based `correctAnswer`, empty `explanations` (A–D), and exactly 2
remediation variants that test the same concept with different numbers or
scenarios.

Tooling:

- `scripts/validate-content.mjs` + `npm run validate:content` — verifies 6
  lessons, 10 questions each (8+2), 4 options, in-range answer keys, exactly 2
  remediation variants per question, and that **every** explanation field is an
  empty string. Run output: `Content OK: 6 lessons, 180 authored questions`.

## Thought process & key decisions

- **Authored, not generated, content within policy.** Per the Explanation
  Policy, the agent may write prompts, options, correct keys, and remediation
  variants — but never explanation text. Every `explanations` value is `""`. The
  validator enforces this so a stray explanation can't slip in.
- **Intuition before formulas.** Questions emphasize reasoning ("small samples
  vary", "the law of large numbers", "which estimate is more reliable") and use
  friendly numbers, matching the Grades 9–12 / pre-AP audience.
- **Remediation = same concept, new numbers.** Each variant shares the parent's
  `concept` and tests the same idea with different values/scenarios, so a student
  who fails gets genuinely fresh-but-equivalent practice (served by the Stage 7
  round logic), with zero AI generation.
- **Simulations matched to content.** Each question's `simulation.type` (and
  optional params like `sectors`, `probability`, `shape`, `mode`) drives the
  right interactive engine, so the simulation a student manipulates is relevant
  to the question.
- **Answer-key spread.** Correct answers are distributed across positions A–D to
  avoid a guessable pattern.

## Verification

- `npm run validate:content` — passes (180 questions, all explanations empty).
- `npm run build` — success, no type errors (JSON validated against the `Lesson`
  type by the loader).
- All six lessons now appear in the grid; progression, mastery, and remediation
  (Stages 6–7) operate on the real curriculum.

## Not done yet (by design)

Explanation text (Stage 9) — must be provided by the product owner. Final QA +
deployment (Stage 10).

## STOP — awaiting approval before Stage 9.
