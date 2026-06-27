// Validates lesson JSON across quant, poker theory, and market making tracks.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "src", "content");

const TRACKS = [
  { dir: join(root, "lessons"), minLessons: 6, maxLessons: 15, minQ: 10, maxQ: 14 },
  {
    dir: join(root, "pokerTheory"),
    minLessons: 1,
    maxLessons: 20,
    minQ: 10,
    maxQ: 14,
  },
  {
    dir: join(root, "marketMakingLessons"),
    minLessons: 1,
    maxLessons: 20,
    minQ: 6,
    maxQ: 14,
    minChallenge: 1,
    placementMin: 6,
    placementMax: 8,
  },
];

const errors = [];
let totalAuthored = 0;

function checkExplanations(where, expl) {
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

function validateLesson(lesson, tag, minQ, maxQ, opts = {}) {
  if (!Array.isArray(lesson.intro) || lesson.intro.length === 0)
    errors.push(`${tag}: expected a non-empty intro (array of paragraphs)`);
  else if (!lesson.intro.every((p) => typeof p === "string" && p.trim().length > 0))
    errors.push(`${tag}: every intro paragraph must be a non-empty string`);

  const qCount = lesson.questions?.length ?? 0;
  if (qCount < minQ || qCount > maxQ)
    errors.push(`${tag}: expected ${minQ}–${maxQ} questions, found ${qCount}`);

  const challenge = lesson.questions.filter((q) => q.kind === "challenge").length;
  const minChallenge = opts.minChallenge ?? 2;
  const maxChallenge = opts.maxChallenge ?? (tag === "lesson_11" ? 8 : 6);
  if (challenge < minChallenge || challenge > maxChallenge)
    errors.push(`${tag}: expected ${minChallenge}–${maxChallenge} challenge questions, found ${challenge}`);

  const ids = new Set();
  for (const q of lesson.questions) {
    if (ids.has(q.id)) errors.push(`${tag}/${q.id}: duplicate question id`);
    ids.add(q.id);
    checkRenderable(`${tag}/${q.id}`, q);
    if (!Array.isArray(q.remediation) || q.remediation.length !== 2)
      errors.push(`${tag}/${q.id}: expected 2 remediation variants`);
    else q.remediation.forEach((v) => checkRenderable(`${tag}/${q.id}/${v.id}`, v));
  }

  if (lesson.placementQuestions != null) {
    const plMin = opts.placementMin ?? 8;
    const plMax = opts.placementMax ?? 8;
    if (
      !Array.isArray(lesson.placementQuestions) ||
      lesson.placementQuestions.length < plMin ||
      lesson.placementQuestions.length > plMax
    )
      errors.push(`${tag}: placementQuestions must have ${plMin}–${plMax} items when present`);
    else {
      for (const pq of lesson.placementQuestions) {
        checkRenderable(`${tag}/placement/${pq.id}`, pq);
      }
    }
  }
}

for (const track of TRACKS) {
  if (!existsSync(track.dir)) continue;
  const files = readdirSync(track.dir).filter((f) => f.endsWith(".json")).sort();
  if (files.length < track.minLessons || files.length > track.maxLessons)
    errors.push(`${track.dir}: expected ${track.minLessons}–${track.maxLessons} lesson files, found ${files.length}`);

  for (const file of files) {
    const lesson = JSON.parse(readFileSync(join(track.dir, file), "utf8"));
    validateLesson(lesson, lesson.lessonId ?? file, track.minQ, track.maxQ, {
      minChallenge: track.minChallenge,
      placementMin: track.placementMin,
      placementMax: track.placementMax,
    });
  }
}

if (errors.length) {
  console.error(`Content validation FAILED with ${errors.length} issue(s):`);
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}

console.log(`Content OK: all tracks validated, ${totalAuthored} authored questions (incl. remediation).`);
