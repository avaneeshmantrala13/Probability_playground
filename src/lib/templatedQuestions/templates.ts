import { Frac } from "./fraction";
import type { BuiltQuestion, RNG, Template } from "./engine";

// ---------------------------------------------------------------------------
// Pure math helpers (the source of truth for every answer key below).
// ---------------------------------------------------------------------------

function comb(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
}

function perm(n: number, k: number): number {
  let r = 1;
  for (let i = 0; i < k; i++) r *= n - i;
  return r;
}

function diceSumWays(target: number): number {
  let w = 0;
  for (let i = 1; i <= 6; i++) {
    const j = target - i;
    if (j >= 1 && j <= 6) w++;
  }
  return w;
}

function money(x: number): string {
  return x < 0 ? `-$${-x}` : `$${x}`;
}

// ---------------------------------------------------------------------------
// Templates. Each computes the correct answer (and plausible wrong answers)
// entirely in code, so the answer key is correct by construction.
// ---------------------------------------------------------------------------

function singleDraw(rng: RNG): BuiltQuestion {
  const colors = [
    { n: "red", a: rng.int(2, 6) },
    { n: "blue", a: rng.int(2, 6) },
    { n: "green", a: rng.int(2, 6) },
  ];
  const total = colors.reduce((s, c) => s + c.a, 0);
  const target = rng.pick(colors);
  const other = rng.pick(colors.filter((c) => c !== target));
  const correct = new Frac(target.a, total);

  return {
    question: `A bag contains ${colors[0].a} red, ${colors[1].a} blue, and ${colors[2].a} green marbles (${total} total). If one marble is drawn at random, what is the probability that it is ${target.n}?`,
    concept: "single-draw probability",
    correct: {
      text: correct.toString(),
      why: `There are ${target.a} ${target.n} marbles out of ${total} total, so P = ${target.a}/${total} = ${correct.toString()}.`,
    },
    distractors: [
      {
        text: new Frac(total - target.a, total).toString(),
        why: `This is P(not ${target.n}) — the complement — rather than the probability of drawing ${target.n}.`,
      },
      {
        text: new Frac(target.a, total - target.a).toString(),
        why: `These are the odds of ${target.n} (favorable : unfavorable), not the probability (favorable / total).`,
      },
      {
        text: new Frac(other.a, total).toString(),
        why: `That is the probability of drawing ${other.n}, a different color.`,
      },
      {
        text: new Frac(1, colors.length).toString(),
        why: `The three colors are not equally likely — you must weight by how many marbles of each color there are.`,
      },
      {
        text: new Frac(target.a, total + 1).toString(),
        why: `The denominator should be the ${total} marbles actually in the bag.`,
      },
    ],
  };
}

function complementDraw(rng: RNG): BuiltQuestion {
  const colors = [
    { n: "red", a: rng.int(2, 6) },
    { n: "blue", a: rng.int(2, 6) },
    { n: "green", a: rng.int(2, 6) },
  ];
  const total = colors.reduce((s, c) => s + c.a, 0);
  const target = rng.pick(colors);
  const correct = new Frac(total - target.a, total);

  return {
    question: `A bag contains ${colors[0].a} red, ${colors[1].a} blue, and ${colors[2].a} green marbles (${total} total). If one marble is drawn at random, what is the probability that it is NOT ${target.n}?`,
    concept: "complement rule",
    correct: {
      text: correct.toString(),
      why: `P(not ${target.n}) = 1 − P(${target.n}) = 1 − ${target.a}/${total} = ${correct.toString()}.`,
    },
    distractors: [
      {
        text: new Frac(target.a, total).toString(),
        why: `That is P(${target.n}) itself, not its complement.`,
      },
      {
        text: new Frac(total - target.a, target.a).toString(),
        why: `These are odds (not-${target.n} : ${target.n}), not a probability over the total.`,
      },
      {
        text: new Frac(total - target.a, total - 1).toString(),
        why: `The denominator is still the full ${total} marbles, since no marble has been removed.`,
      },
      {
        text: new Frac(1, 2).toString(),
        why: `"Not ${target.n}" is not a coin flip — it depends on how many of the ${total} marbles are ${target.n}.`,
      },
    ],
  };
}

function diceSum(rng: RNG): BuiltQuestion {
  const k = rng.int(2, 12);
  const w = diceSumWays(k);
  const correct = new Frac(w, 36);

  return {
    question: `Two fair six-sided dice are rolled. What is the probability that their sum equals ${k}?`,
    concept: "equally likely outcomes",
    correct: {
      text: correct.toString(),
      why: `Of the 6 × 6 = 36 equally likely ordered outcomes, ${w} sum to ${k}, so P = ${w}/36 = ${correct.toString()}.`,
    },
    distractors: [
      {
        text: new Frac(w, 12).toString(),
        why: `There are 36 ordered outcomes for two dice, not 12.`,
      },
      {
        text: new Frac(1, 11).toString(),
        why: `The 11 possible sums (2–12) are not equally likely, so it is not 1/11.`,
      },
      {
        text: new Frac(Math.max(0, w - 1), 36).toString(),
        why: `Recount the ordered pairs that sum to ${k}; there are ${w}.`,
      },
      {
        text: new Frac(k, 36).toString(),
        why: `The numerator is the number of favorable outcomes (${w}), not the target sum ${k}.`,
      },
      {
        text: new Frac(w, 6).toString(),
        why: `The sample space for two dice has 36 outcomes, not 6.`,
      },
    ],
  };
}

function independentAnd(rng: RNG): BuiltQuestion {
  const k = rng.int(1, 6);
  const pCoin = new Frac(1, 2);
  const pDie = new Frac(1, 6);
  const correct = pCoin.mul(pDie);

  return {
    question: `A fair coin is flipped and a fair six-sided die is rolled, independently. What is the probability of getting heads AND rolling a ${k}?`,
    concept: "independent events (multiplication rule)",
    correct: {
      text: correct.toString(),
      why: `For independent events, multiply: P(heads) × P(${k}) = 1/2 × 1/6 = ${correct.toString()}.`,
    },
    distractors: [
      {
        text: pCoin.add(pDie).toString(),
        why: `For "AND" with independent events you multiply the probabilities, not add them.`,
      },
      { text: pCoin.toString(), why: `This only accounts for the coin, not the die.` },
      { text: pDie.toString(), why: `This only accounts for the die, not the coin.` },
      {
        text: new Frac(1, 8).toString(),
        why: `The die has 6 faces, so P(${k}) = 1/6; the product is 1/2 × 1/6, not 1/2 × 1/4.`,
      },
    ],
  };
}

function withoutReplacement(rng: RNG): BuiltQuestion {
  const r = rng.int(3, 6);
  const b = rng.int(3, 6);
  const total = r + b;
  const correct = new Frac(r * (r - 1), total * (total - 1));

  return {
    question: `A jar holds ${r} red and ${b} blue marbles. You draw 2 marbles without replacement. What is the probability that both are red?`,
    concept: "conditional probability / without replacement",
    correct: {
      text: correct.toString(),
      why: `P(both red) = ${r}/${total} × ${r - 1}/${total - 1} = ${correct.toString()} — the second draw has one fewer red and one fewer marble.`,
    },
    distractors: [
      {
        text: new Frac(r * r, total * total).toString(),
        why: `That assumes replacement; here the first marble is not put back, so the second draw is ${r - 1}/${total - 1}.`,
      },
      {
        text: new Frac(r - 1, total - 1).toString(),
        why: `This is only the second draw; you must also include the first draw's ${r}/${total}.`,
      },
      {
        text: new Frac(r, total).toString(),
        why: `This is just the first draw; drawing two reds requires both draws to succeed.`,
      },
      {
        text: new Frac(2 * r, total).toString(),
        why: `Probabilities of the two draws are multiplied, not added/doubled.`,
      },
    ],
  };
}

function conditionalDie(rng: RNG): BuiltQuestion {
  const k = rng.pick([2, 4, 6]);
  const correct = new Frac(1, 3);

  return {
    question: `A fair six-sided die is rolled. Given that the result is even, what is the probability that it is a ${k}?`,
    concept: "conditional probability (restricted sample space)",
    correct: {
      text: correct.toString(),
      why: `Knowing the roll is even restricts the sample space to {2, 4, 6} — three equally likely outcomes — so P = 1/3.`,
    },
    distractors: [
      {
        text: new Frac(1, 6).toString(),
        why: `This ignores the condition; once you know the roll is even, only {2, 4, 6} remain.`,
      },
      {
        text: new Frac(1, 2).toString(),
        why: `There are three even faces, not two, so each has probability 1/3.`,
      },
      {
        text: new Frac(2, 3).toString(),
        why: `Only one of the three even outcomes is a ${k}, so the probability is 1/3.`,
      },
      {
        text: new Frac(1, 4).toString(),
        why: `The restricted sample space {2, 4, 6} has three outcomes, not four.`,
      },
    ],
  };
}

function evCoin(rng: RNG): BuiltQuestion {
  let a = rng.int(2, 10);
  let b = rng.int(1, 8);
  if ((a - b) % 2 !== 0) b += b < 8 ? 1 : -1; // keep (a-b)/2 an integer
  if (a === b) a += 2;
  const ev = (a - b) / 2;

  return {
    question: `A fair coin is flipped once. You win ${money(a)} on heads and lose ${money(b)} on tails. What is the expected value of this game?`,
    concept: "expected value",
    correct: {
      text: money(ev),
      why: `EV = ½(+${a}) + ½(−${b}) = (${a} − ${b})/2 = ${money(ev)}.`,
    },
    distractors: [
      {
        text: money(a - b),
        why: `Each outcome happens with probability ½, so weight both by ½ before adding.`,
      },
      { text: money(-ev), why: `Sign error — the win is positive and the loss is negative.` },
      { text: money(a), why: `This counts only the winning outcome and ignores the ½ chance of losing ${money(b)}.` },
      { text: money(ev + 1), why: `Recompute: (${a} − ${b})/2 = ${money(ev)}.` },
    ],
  };
}

function combinations(rng: RNG): BuiltQuestion {
  const n = rng.int(5, 9);
  const k = rng.int(2, Math.min(4, n - 1));
  const correct = comb(n, k);

  return {
    question: `In how many ways can a committee of ${k} people be chosen from a group of ${n}? (Order does not matter.)`,
    concept: "combinations",
    correct: {
      text: `${correct}`,
      why: `Order doesn't matter, so use C(${n}, ${k}) = ${n}! / (${k}!·${n - k}!) = ${correct}.`,
    },
    // First three are guaranteed mutually distinct and ≠ correct
    // (perm > C(n,k) > C(n-1,k), and C(n+1,k) > C(n,k)).
    distractors: [
      {
        text: `${perm(n, k)}`,
        why: `That is P(${n}, ${k}) — arrangements where order matters. A committee is unordered, so divide by ${k}!.`,
      },
      { text: `${comb(n + 1, k)}`, why: `That counts as if there were ${n + 1} people; the group has ${n}.` },
      { text: `${comb(n - 1, k)}`, why: `That counts as if there were ${n - 1} people; the group has ${n}.` },
      { text: `${comb(n, k - 1)}`, why: `That is C(${n}, ${k - 1}); the committee has ${k} members.` },
      { text: `${n * k}`, why: `Choosing a set isn't simply n × k; use the combination formula.` },
    ],
  };
}

function permutations(rng: RNG): BuiltQuestion {
  const n = rng.int(5, 8);
  const k = rng.int(2, Math.min(4, n - 1));
  const correct = perm(n, k);

  return {
    question: `In how many ways can you award distinct 1st, 2nd${k >= 3 ? ", 3rd" : ""}${k >= 4 ? ", 4th" : ""} place medals among ${n} runners? (Order matters.)`,
    concept: "permutations",
    correct: {
      text: `${correct}`,
      why: `Order matters, so use P(${n}, ${k}) = ${n} × ${n - 1}${k >= 3 ? ` × ${n - 2}` : ""}${k >= 4 ? ` × ${n - 3}` : ""} = ${correct}.`,
    },
    // First three are guaranteed mutually distinct and ≠ correct
    // (P(n-1,k) < P(n,k) < P(n+1,k), and n^k > P(n,k), all distinct).
    distractors: [
      { text: `${perm(n + 1, k)}`, why: `That counts as if there were ${n + 1} runners; there are ${n}.` },
      { text: `${perm(n - 1, k)}`, why: `That counts as if there were ${n - 1} runners; there are ${n}.` },
      {
        text: `${Math.pow(n, k)}`,
        why: `A runner can't take two places, so the choices aren't independent ${n}^${k} — each pick removes a runner.`,
      },
      {
        text: `${comb(n, k)}`,
        why: `That is C(${n}, ${k}), which ignores order. Distinct placements are ordered, so don't divide by ${k}!.`,
      },
    ],
  };
}

function meanTemplate(rng: RNG): BuiltQuestion {
  const data = Array.from({ length: 5 }, () => rng.int(2, 18));
  let s = data.reduce((acc, x) => acc + x, 0);
  const r = ((s % 5) + 5) % 5;
  if (r !== 0) {
    data[0] += 5 - r; // nudge one value so the mean is a clean integer
    s += 5 - r;
  }
  const m = s / 5;
  const sorted = [...data].sort((x, y) => x - y);
  const median = sorted[2];
  const display = rng.shuffle(data);

  return {
    question: `What is the mean (average) of the data set {${display.join(", ")}}?`,
    concept: "mean",
    correct: {
      text: `${m}`,
      why: `The mean is the sum divided by the count: ${s} / 5 = ${m}.`,
    },
    distractors: [
      { text: `${median}`, why: `That is the median (middle value when sorted), not the mean.` },
      { text: `${s}`, why: `That is the sum; the mean divides the sum by the 5 data points.` },
      { text: `${m + 1}`, why: `Recompute: ${s} / 5 = ${m}.` },
      { text: `${Math.round(s / 4)}`, why: `There are 5 values, so divide by 5, not 4.` },
    ],
  };
}

function medianTemplate(rng: RNG): BuiltQuestion {
  const set = new Set<number>();
  while (set.size < 5) set.add(rng.int(1, 25));
  const arr = [...set];
  const sorted = [...arr].sort((x, y) => x - y);
  const median = sorted[2];
  const display = rng.shuffle(arr);

  return {
    question: `What is the median of the data set {${display.join(", ")}}?`,
    concept: "median",
    correct: {
      text: `${median}`,
      why: `Sort the values (${sorted.join(", ")}) and take the middle one: ${median}.`,
    },
    distractors: [
      { text: `${sorted[1]}`, why: `That is the 2nd-smallest value; the median is the middle (3rd) of five sorted values.` },
      { text: `${sorted[3]}`, why: `That is the 4th value; the median is the middle (3rd) of five sorted values.` },
      { text: `${sorted[0]}`, why: `That is the minimum, not the middle value.` },
      { text: `${sorted[4]}`, why: `That is the maximum, not the middle value.` },
    ],
  };
}

export const TEMPLATES: Template[] = [
  {
    id: "single-draw",
    lessons: ["lesson_1", "lesson_5"],
    keywords: ["sample space", "probability axiom", "equally likely"],
    build: singleDraw,
  },
  {
    id: "complement",
    lessons: ["lesson_1"],
    keywords: ["complement", "probability axiom"],
    build: complementDraw,
  },
  {
    id: "dice-sum",
    lessons: ["lesson_1"],
    keywords: ["counting principle", "sample space"],
    build: diceSum,
  },
  {
    id: "independent-and",
    lessons: ["lesson_1", "lesson_4"],
    keywords: ["independent", "multiplication"],
    build: independentAnd,
  },
  {
    id: "without-replacement",
    lessons: ["lesson_3", "lesson_5"],
    keywords: ["conditional", "without replacement", "restricted sample"],
    build: withoutReplacement,
  },
  {
    id: "conditional-die",
    lessons: ["lesson_3", "lesson_5"],
    keywords: ["conditional", "restricted sample", "bayes"],
    build: conditionalDie,
  },
  {
    id: "ev-coin",
    lessons: ["lesson_1", "lesson_4"],
    keywords: ["expected value", "expectation", "random variable"],
    build: evCoin,
  },
  {
    id: "combinations",
    lessons: ["lesson_2"],
    keywords: ["combination", "counting for probability"],
    build: combinations,
  },
  {
    id: "permutations",
    lessons: ["lesson_2"],
    keywords: ["permutation"],
    build: permutations,
  },
  {
    id: "mean",
    lessons: ["lesson_6"],
    keywords: ["mean"],
    build: meanTemplate,
  },
  {
    id: "median",
    lessons: ["lesson_6"],
    keywords: ["median"],
    build: medianTemplate,
  },
];
