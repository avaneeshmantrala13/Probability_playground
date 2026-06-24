# Explanation Authoring Guide (Product Owner)

Per the Explanation Policy, **only the product owner** writes explanation text.
The app and the content files are already wired to display explanations the
moment you add them — no code changes needed. Until then, each explanation shows
a neutral "Explanation coming soon." placeholder.

## Where explanations live

Every question (and every remediation variant) in
`src/content/lessons/lesson*.json` has an `explanations` object keyed by the
option letter:

```json
"options": ["0.25", "0.5", "0.75", "It never settles"],
"correctAnswer": 1,
"explanations": { "A": "", "B": "", "C": "", "D": "" }
```

- `A` corresponds to `options[0]`, `B` to `options[1]`, `C` to `options[2]`,
  `D` to `options[3]`.
- `correctAnswer` is the zero-based index of the correct option (here `1` = `B`).

## What to write

Fill in each letter's string:

- **The correct option** (e.g. `B` above): explain *why it is correct*.
- **Each incorrect option**: explain *why that choice is wrong* / the likely
  misconception.

Example (illustrative only — your wording):

```json
"explanations": {
  "A": "0.25 would be right if heads were only one of four equal outcomes, but a coin has two.",
  "B": "Correct. With two equally likely sides, the long-run fraction of heads approaches 1/2.",
  "C": "0.75 over-weights heads; the two outcomes are equally likely.",
  "D": "It does settle: the law of large numbers pulls the proportion toward 0.5."
}
```

## How the app uses them

- **Correct answer:** the explanation for the correct option is shown.
- **Incorrect answer:** the student sees both "why your choice is incorrect"
  (their option's text) and "why the correct choice is correct".

So it's most valuable to fill all four letters, but any non-empty field will
display immediately.

## Workflow

1. Edit the `explanations` values in the six `lesson*.json` files (60 primary
   questions + 120 remediation variants = 180 sets).
2. Save. The app picks them up on rebuild/reload.
3. The content validator (`npm run validate:content`) currently **requires**
   explanations to be empty; once you begin authoring, that single check should
   be relaxed (see Stage 9 notes) so it instead verifies the four keys exist.

## Important

The AI agent will not write any explanation text. Provide the copy (or approve
specific wording) and it will be inserted verbatim into these fields.
