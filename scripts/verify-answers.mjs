// Answer-verification harness.
//
// Goes beyond structural validation (validate-content.mjs) to actually check
// that each question's marked answer key is internally CONSISTENT and that any
// machine-checkable computation resolves to the marked correct option:
//
//   1. Answer-key consistency — the correct option's explanation must not
//      explicitly endorse a DIFFERENT letter, and a wrong option's explanation
//      must not declare ITSELF correct. (Catches key/explanation mismatches —
//      the real defect behind "wrong answer keys".)
//   2. Unambiguous options — no two options may be identical strings (that would
//      make the "single correct answer" undefined).
//   3. Computational re-derivation — when a question carries an optional
//      `verify` arithmetic expression, it is evaluated in a sandbox and must
//      equal the numeric value of the marked correct option.
//
// Emits src/content/verified.json (counts + timestamp) consumed by the UI, and
// exits non-zero on any inconsistency so it can gate the build.

import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "src", "content");

const errors = [];
let totalChecked = 0;
let mathVerified = 0;

const LETTERS = ["A", "B", "C", "D"];

// Phrases that *assert* a specific letter is the correct one. Deliberately
// conservative so prose like "Option A describes…" never trips the check.
const ASSERTION_PATTERNS = [
  /correct answer is\s*\(?([A-D])\)?/i,
  /the answer is\s*\(?([A-D])\)?/i,
  /answer:\s*\(?([A-D])\)?/i,
  /\(([A-D])\)\s+is\s+correct/i,
  /option\s+\(?([A-D])\)?\s+is\s+correct/i,
];

function assertedLetter(text) {
  if (typeof text !== "string") return null;
  for (const re of ASSERTION_PATTERNS) {
    const m = text.match(re);
    if (m) return m[1].toUpperCase();
  }
  return null;
}

/** Safe arithmetic evaluator: digits, operators, parens, decimals only. */
function safeEvalNumber(expr) {
  if (typeof expr !== "string" || !/^[\d\s+\-*/().]+$/.test(expr)) return null;
  try {
    // eslint-disable-next-line no-new-func
    const val = Function(`"use strict"; return (${expr});`)();
    return typeof val === "number" && Number.isFinite(val) ? val : null;
  } catch {
    return null;
  }
}

/** Parse a leading number/fraction/percentage out of an option string. */
function optionNumber(option) {
  if (typeof option !== "string") return null;
  const cleaned = option.replace(/[$,%\s]/g, "");
  const frac = cleaned.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  if (frac) {
    const d = Number(frac[2]);
    return d !== 0 ? Number(frac[1]) / d : null;
  }
  const num = cleaned.match(/^-?\d+(?:\.\d+)?$/);
  return num ? Number(num[0]) : null;
}

function verifyQuestion(where, q) {
  totalChecked += 1;

  // --- unambiguous options ---
  if (Array.isArray(q.options)) {
    const seen = new Map();
    q.options.forEach((opt, i) => {
      const key = String(opt).trim().toLowerCase();
      if (seen.has(key)) {
        errors.push(`${where}: duplicate option text ("${opt}") at ${seen.get(key)} & ${i}`);
      } else {
        seen.set(key, i);
      }
    });
  }

  const correct = q.correctAnswer;
  if (typeof correct !== "number" || correct < 0 || correct > 3) return; // structure caught elsewhere
  const correctLetter = LETTERS[correct];
  const expl = q.explanations ?? {};

  // --- answer-key consistency ---
  const inCorrect = assertedLetter(expl[correctLetter]);
  if (inCorrect && inCorrect !== correctLetter) {
    errors.push(
      `${where}: correctAnswer is ${correctLetter} but its explanation asserts ${inCorrect} is correct`,
    );
  }
  for (const L of LETTERS) {
    if (L === correctLetter) continue;
    const a = assertedLetter(expl[L]);
    if (a === L) {
      errors.push(`${where}: option ${L} is marked wrong but its explanation declares ${L} correct`);
    }
  }

  // --- computational re-derivation (opt-in via `verify`) ---
  if (typeof q.verify === "string" && q.verify.trim()) {
    const computed = safeEvalNumber(q.verify);
    const target = Array.isArray(q.options) ? optionNumber(q.options[correct]) : null;
    if (computed == null) {
      errors.push(`${where}: verify expression "${q.verify}" is not a safe number`);
    } else if (target == null) {
      errors.push(`${where}: correct option "${q.options?.[correct]}" is not numeric but has a verify expr`);
    } else if (Math.abs(computed - target) > 1e-6) {
      errors.push(`${where}: verify "${q.verify}"=${computed} != correct option ${target}`);
    } else {
      mathVerified += 1;
    }
  }
}

function walkLessonFile(tag, lesson) {
  const qs = lesson.questions ?? [];
  for (const q of qs) {
    verifyQuestion(`${tag}/${q.id}`, q);
    if (Array.isArray(q.remediation)) {
      q.remediation.forEach((v) => verifyQuestion(`${tag}/${q.id}/${v.id}`, v));
    }
  }
  if (Array.isArray(lesson.placementQuestions)) {
    lesson.placementQuestions.forEach((pq) => verifyQuestion(`${tag}/placement/${pq.id}`, pq));
  }
}

// Lesson tracks
for (const sub of ["lessons", "pokerTheory", "marketMakingLessons"]) {
  const dir = join(root, sub);
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
    const lesson = JSON.parse(readFileSync(join(dir, file), "utf8"));
    walkLessonFile(lesson.lessonId ?? `${sub}/${file}`, lesson);
  }
}

// Practice banks
const practiceDir = join(root, "practice", "banks");
if (existsSync(practiceDir)) {
  for (const file of readdirSync(practiceDir).filter((f) => f.endsWith(".json")).sort()) {
    const bank = JSON.parse(readFileSync(join(practiceDir, file), "utf8"));
    const tag = `practice/${bank.lessonId ?? file}`;
    for (const q of bank.questions ?? []) verifyQuestion(`${tag}/${q.id}`, q);
  }
}

if (errors.length) {
  console.error(`Answer verification FAILED with ${errors.length} issue(s):`);
  for (const e of errors.slice(0, 100)) console.error("  - " + e);
  if (errors.length > 100) console.error(`  …and ${errors.length - 100} more`);
  process.exit(1);
}

const manifest = {
  generatedAt: new Date().toISOString(),
  totalChecked,
  mathVerified,
};
writeFileSync(join(root, "verified.json"), JSON.stringify(manifest, null, 2) + "\n");

console.log(
  `Answer verification OK: ${totalChecked} questions code-checked for answer-key ` +
    `consistency & unambiguous options (${mathVerified} also math re-derived).`,
);
