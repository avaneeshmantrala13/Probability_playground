/**
 * Merges src/content/expansions/*.json into lesson files.
 * Each expansion file: { lessonId, introAppend?, appendQuestions?, placementQuestions? }
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const expansionsDir = path.join(root, "src/content/expansions");

const lessonDirs = [
  path.join(root, "src/content/lessons"),
  path.join(root, "src/content/pokerTheory"),
  path.join(root, "src/content/marketMakingLessons"),
];

function findLessonFile(lessonId) {
  for (const dir of lessonDirs) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".json")) continue;
      const full = path.join(dir, file);
      const data = JSON.parse(fs.readFileSync(full, "utf8"));
      if (data.lessonId === lessonId) return full;
    }
  }
  return null;
}

const files = fs.existsSync(expansionsDir)
  ? fs.readdirSync(expansionsDir).filter((f) => f.endsWith(".json"))
  : [];

let merged = 0;
for (const file of files) {
  const raw = JSON.parse(fs.readFileSync(path.join(expansionsDir, file), "utf8"));
  const expansions = Array.isArray(raw) ? raw : [raw];

  for (const exp of expansions) {
  const target = exp.targetFile
    ? path.join(root, exp.targetFile)
    : findLessonFile(exp.lessonId);

  if (!target || !fs.existsSync(target)) {
    console.warn(`Skip ${file}: no target for ${exp.lessonId ?? exp.targetFile}`);
    continue;
  }

  const lesson = JSON.parse(fs.readFileSync(target, "utf8"));
  const existingIds = new Set(lesson.questions.map((q) => q.id));

  if (exp.introAppend?.length) {
    lesson.intro = [...(lesson.intro ?? []), ...exp.introAppend];
  }

  if (exp.appendQuestions?.length) {
    for (const q of exp.appendQuestions) {
      if (existingIds.has(q.id)) continue;
      lesson.questions.push(q);
      existingIds.add(q.id);
    }
  }

  if (exp.placementQuestions?.length) {
    lesson.placementQuestions = exp.placementQuestions;
  }

  if (exp.topicsAppend?.length) {
    lesson.topics = [...new Set([...(lesson.topics ?? []), ...exp.topicsAppend])];
  }

  fs.writeFileSync(target, JSON.stringify(lesson, null, 2) + "\n");
  merged++;
  console.log(`Merged ${file} → ${path.relative(root, target)} (+${exp.appendQuestions?.length ?? 0} q)`);
  }
}

console.log(`Done. ${merged} expansion file(s) applied.`);
