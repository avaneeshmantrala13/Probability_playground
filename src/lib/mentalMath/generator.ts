import type { MentalMathDifficulty, MentalMathOp, MentalMathProblem } from "./types";

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pickOp(ops: MentalMathOp[]): MentalMathOp {
  return ops[Math.floor(Math.random() * ops.length)]!;
}

function makeAddSub(max: number, allowNegative = false): MentalMathProblem {
  const op = pickOp(["+", "-"]);
  let a = randInt(0, max);
  let b = randInt(0, max);
  if (op === "-" && !allowNegative && b > a) [a, b] = [b, a];
  const answer = op === "+" ? a + b : a - b;
  return { prompt: `${a} ${op} ${b}`, answer, op };
}

function makeMul(aMin: number, aMax: number, bMin: number, bMax: number): MentalMathProblem {
  const a = randInt(aMin, aMax);
  const b = randInt(bMin, bMax);
  return { prompt: `${a} × ${b}`, answer: a * b, op: "×" };
}

function makeDivFromTable(maxFactor: number): MentalMathProblem {
  const a = randInt(2, maxFactor);
  const b = randInt(2, maxFactor);
  const product = a * b;
  const showA = Math.random() < 0.5;
  const prompt = showA ? `${product} ÷ ${a}` : `${product} ÷ ${b}`;
  const answer = showA ? b : a;
  return { prompt, answer, op: "÷" };
}

function makeHardDiv(): MentalMathProblem {
  const divisor = randInt(11, 99);
  const quotient = randInt(11, 99);
  const dividend = divisor * quotient;
  return { prompt: `${dividend} ÷ ${divisor}`, answer: quotient, op: "÷" };
}

function makeHardMul(): MentalMathProblem {
  const a = randInt(100, 999);
  const b = randInt(10, 99);
  return { prompt: `${a} × ${b}`, answer: a * b, op: "×" };
}

function makeMediumMul(): MentalMathProblem {
  if (Math.random() < 0.55) {
    const a = randInt(11, 99);
    const b = randInt(2, 9);
    return { prompt: `${a} × ${b}`, answer: a * b, op: "×" };
  }
  return makeMul(2, 15, 2, 15);
}

function makeMediumDiv(): MentalMathProblem {
  if (Math.random() < 0.5) return makeDivFromTable(15);
  const divisor = randInt(6, 18);
  const quotient = randInt(6, 18);
  const dividend = divisor * quotient;
  return { prompt: `${dividend} ÷ ${divisor}`, answer: quotient, op: "÷" };
}

/** Weighted mix — mirrors Zetamac-style variety per difficulty tier. */
export function generateProblem(difficulty: MentalMathDifficulty): MentalMathProblem {
  const roll = Math.random();

  if (difficulty === "easy") {
    if (roll < 0.28) return makeAddSub(100);
    if (roll < 0.56) return makeAddSub(100);
    if (roll < 0.78) return makeMul(1, 12, 1, 12);
    return makeDivFromTable(12);
  }

  if (difficulty === "medium") {
    if (roll < 0.22) return makeAddSub(200);
    if (roll < 0.44) return makeAddSub(350, true);
    if (roll < 0.72) return makeMediumMul();
    return makeMediumDiv();
  }

  if (roll < 0.15) return makeAddSub(500, true);
  if (roll < 0.3) return makeAddSub(999, true);
  if (roll < 0.65) return makeHardMul();
  return makeHardDiv();
}
