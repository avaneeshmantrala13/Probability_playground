# Stage 9 Summary — Explanation Integration (BLOCKED on product owner)

## Goal

Integrate the per-question explanation text. Per the Explanation Policy, the AI
agent may NOT write explanations, hints, or any explanatory copy. This stage
therefore requires the **product owner** to supply the text.

## Status: AWAITING EXPLANATION CONTENT

No explanation text has been written or invented. All 180 `explanations` fields
remain empty strings, exactly as authored in Stage 8.

## What is already in place (so integration is instant)

- **Rendering path is built and verified** (Stage 5). `FeedbackPanel` reads
  `explanations[letter]`:
  - If the field has text, it renders that text after the student checks an
    answer (correct option for a right answer; both the chosen wrong option and
    the correct option for a wrong answer).
  - If the field is empty, it shows a neutral "Explanation coming soon."
    placeholder. There is no code path that fabricates explanation copy.
- **Authoring target is documented:** see
  [docs/explanations-guide.md](explanations-guide.md). It explains exactly which
  JSON fields to fill (`explanations.A`–`D`), how letters map to options, and how
  the app displays them.

## What is needed from the product owner

Explanation text for the questions you want explained, in any of these forms:

1. Edit the `explanations` values directly in `src/content/lessons/lesson*.json`,
   or
2. Provide the copy (per question/option) and the agent will paste it verbatim
   into the fields — without altering meaning.

## Follow-up code change (only after content is provided)

`scripts/validate-content.mjs` currently asserts that every explanation is
empty (to guard the policy during Stages 1–8). Once authoring begins, that one
assertion will be flipped to instead require the four keys to exist (allowing
non-empty text). This is a one-line change, deferred until you start providing
explanations.

## STOP — Per the PRD Explanation Policy, please provide the explanation text
(or confirm you want to ship with the empty/placeholder explanations for now).
Stage 10 (final QA + deployment) does not depend on this and has been prepared.
