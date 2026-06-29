import { makeRng, assemble } from "../src/lib/templatedQuestions/engine";
import { TEMPLATES } from "../src/lib/templatedQuestions/templates";

/** Parse an option to a number where possible, to detect equal-value duplicates. */
function numValue(raw: string): number | null {
  let s = raw.trim().replace(/\s+/g, "");
  s = s.replace(/^-\$/, "-").replace(/^\$/, ""); // money
  if (/^[-+]?\d*\.?\d+%$/.test(s)) return parseFloat(s) / 100;
  const frac = /^([-+]?\d+)\/(\d+)$/.exec(s);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  if (/^[-+]?\d*\.?\d+$/.test(s)) return Number(s);
  return null;
}

let failures = 0;
let nulls = 0;
const ITER = 5000;

for (const tpl of TEMPLATES) {
  let nullCount = 0;
  for (let i = 0; i < ITER; i++) {
    const rng = makeRng();
    const built = tpl.build(rng);
    const q = assemble("test", built, rng);
    if (!q) {
      nullCount++;
      continue;
    }
    const issues: string[] = [];
    if (q.options.length !== 4) issues.push("not 4 options");
    if (new Set(q.options.map((o) => o.trim())).size !== 4) issues.push("duplicate option text");
    const vals = q.options.map(numValue);
    for (let a = 0; a < 4; a++)
      for (let b = a + 1; b < 4; b++) {
        if (vals[a] !== null && vals[b] !== null && Math.abs(vals[a]! - vals[b]!) < 1e-9)
          issues.push(`equal numeric values: ${q.options[a]} == ${q.options[b]}`);
      }
    if (q.correctAnswer < 0 || q.correctAnswer > 3) issues.push("bad correctAnswer index");
    if (q.options[q.correctAnswer] !== built.correct.text.trim())
      issues.push("correctAnswer does not point to computed correct value");
    for (const L of ["A", "B", "C", "D"] as const)
      if (!q.explanations[L] || !q.explanations[L].trim()) issues.push(`empty explanation ${L}`);

    if (issues.length) {
      failures++;
      if (failures <= 20) {
        console.log(`\n[FAIL ${tpl.id}] ${q.question}`);
        console.log(`  options: ${JSON.stringify(q.options)} correct=${q.correctAnswer}`);
        console.log(`  issues: ${issues.join("; ")}`);
      }
    }
  }
  nulls += nullCount;
  const rate = ((nullCount / ITER) * 100).toFixed(1);
  console.log(`${tpl.id.padEnd(22)} null-rate ${rate}%`);
}

console.log(`\nTotal failures: ${failures}, total nulls: ${nulls}`);
process.exit(failures > 0 ? 1 : 0);
