/**
 * One-shot generator for Poker Theory lesson JSON files.
 * Run: node scripts/generate-poker-theory.mjs
 *
 * Lesson definitions live in poker-theory-lessons.mjs (exported from authored JSON).
 */
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { lessons } from "./poker-theory-lessons.mjs";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "content", "pokerTheory");

const errors = [];

function checkExplanations(where, expl) {
  for (const key of ["A", "B", "C", "D"]) {
    if (!(key in expl)) errors.push(`${where}: missing explanation ${key}`);
    else if (typeof expl[key] !== "string" || !expl[key].trim())
      errors.push(`${where}: explanation ${key} must be a non-empty string`);
  }
}

function checkRenderable(where, q) {
  if (!Array.isArray(q.options) || q.options.length !== 4)
    errors.push(`${where}: must have 4 options`);
  if (typeof q.correctAnswer !== "number" || q.correctAnswer < 0 || q.correctAnswer > 3)
    errors.push(`${where}: correctAnswer out of range`);
  if (!q.explanations) errors.push(`${where}: missing explanations`);
  else checkExplanations(where, q.explanations);
}

for (const lesson of lessons) {
  const tag = lesson.lessonId;
  if (!Array.isArray(lesson.intro) || lesson.intro.length === 0)
    errors.push(`${tag}: expected a non-empty intro`);
  if (!Array.isArray(lesson.questions) || lesson.questions.length !== 10)
    errors.push(`${tag}: expected 10 questions`);
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
  if (!Array.isArray(lesson.placementQuestions) || lesson.placementQuestions.length !== 8)
    errors.push(`${tag}: placementQuestions must have exactly 8 items`);
  else {
    for (const pq of lesson.placementQuestions) {
      checkRenderable(`${tag}/placement/${pq.id}`, pq);
    }
  }
}

if (errors.length) {
  console.error(`Validation FAILED with ${errors.length} issue(s):`);
  errors.forEach((e) => console.error(" -", e));
  process.exit(1);
}

for (const lesson of lessons) {
  const path = join(outDir, `${lesson.lessonId}.json`);
  writeFileSync(path, JSON.stringify(lesson, null, 2) + "\n");
  console.log(`Wrote ${path}`);
}

console.log(`\nDone: ${lessons.length} poker theory lesson files generated.`);
