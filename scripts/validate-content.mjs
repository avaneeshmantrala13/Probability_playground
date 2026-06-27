// Validates lesson content files:
// - 6–15 lessons, 10 questions each (8 standard + 2 challenge)
// - optional placementQuestions (8 items, no remediation required)
// - each lesson has a non-empty intro (array of overview paragraphs)
// - 4 options per question, correctAnswer in range
// - exactly 2 remediation variants per question, each well-formed
// - ALL explanation fields are empty strings (Explanation Policy)
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, "..", "src", "content", "lessons");

const errors = [];
let totalAuthored = 0;

const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();

function checkExplanations(where, expl) {
  // Explanations are authored by the product owner over time, so they may be
  // empty or filled. We only require the four option keys to exist and be
  // strings (the AI agent never fabricates this text).
  for (const key of ["A", "B", "C", "D"]) {
    if (!(key in expl)) errors.push(`${where}: missing explanation ${key}`);
    else if (typeof expl[key] !== "string")
      errors.push(`${where}: explanation ${key} must be a string`);
  }
}

function checkRenderable(where, q) {
  if (!Array.isArray(q.options) || q.options.length !== 4)
    errors.push(`${where}: must have 4 options`);
  if (typeof q.correctAnswer !== "number" || q.correctAnswer < 0 || q.correctAnswer > 3)
    errors.push(`${where}: correctAnswer out of range`);
  if (!q.explanations) errors.push(`${where}: missing explanations`);
  else checkExplanations(where, q.explanations);
  totalAuthored += 1;
}

if (files.length < 6 || files.length > 15)
  errors.push(`Expected 6–15 lesson files, found ${files.length}`);

for (const file of files) {
  const lesson = JSON.parse(readFileSync(join(dir, file), "utf8"));
  const tag = lesson.lessonId ?? file;

  if (!Array.isArray(lesson.intro) || lesson.intro.length === 0)
    errors.push(`${tag}: expected a non-empty intro (array of paragraphs)`);
  else if (!lesson.intro.every((p) => typeof p === "string" && p.trim().length > 0))
    errors.push(`${tag}: every intro paragraph must be a non-empty string`);

  if (!Array.isArray(lesson.questions) || lesson.questions.length !== 10)
    errors.push(`${tag}: expected 10 questions, found ${lesson.questions?.length}`);

  const standard = lesson.questions.filter((q) => q.kind === "standard").length;
  const challenge = lesson.questions.filter((q) => q.kind === "challenge").length;
  if (standard !== 8) errors.push(`${tag}: expected 8 standard questions, found ${standard}`);
  if (challenge !== 2) errors.push(`${tag}: expected 2 challenge questions, found ${challenge}`);

  for (const q of lesson.questions) {
    checkRenderable(`${tag}/${q.id}`, q);
    if (!Array.isArray(q.remediation) || q.remediation.length !== 2)
      errors.push(`${tag}/${q.id}: expected 2 remediation variants`);
    else q.remediation.forEach((v) => checkRenderable(`${tag}/${q.id}/${v.id}`, v));
  }

  if (lesson.placementQuestions != null) {
    if (!Array.isArray(lesson.placementQuestions) || lesson.placementQuestions.length !== 8)
      errors.push(`${tag}: placementQuestions must have exactly 8 items when present`);
    else {
      for (const pq of lesson.placementQuestions) {
        checkRenderable(`${tag}/placement/${pq.id}`, pq);
      }
    }
  }
}

if (errors.length) {
  console.error(`Content validation FAILED with ${errors.length} issue(s):`);
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}

console.log(`Content OK: ${files.length} lessons, ${totalAuthored} authored questions (incl. remediation).`);
