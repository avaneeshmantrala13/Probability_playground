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

/** Format an integer number of cents as a dollar string (exact, 2 decimals). */
function centsToMoney(c: number): string {
  const s = (Math.abs(c) / 100).toFixed(2);
  return c < 0 ? `-$${s}` : `$${s}`;
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

function expectedValueGame(rng: RNG): BuiltQuestion {
  // Denominators that divide 100 keep every probability and EV exact to the cent.
  const d = rng.pick([4, 5, 10, 20, 25, 50]);
  const a = rng.int(1, d - 1);
  const win = rng.pick([20, 30, 40, 50, 60, 100]);
  const lose = -rng.pick([5, 10, 15, 20, 25]);
  const scale = 100 / d; // integer, since d divides 100

  const term1C = a * win * scale; // cents contributed by the win outcome
  const term2C = (d - a) * lose * scale; // cents contributed by the loss outcome
  const evC = term1C + term2C;
  const pWin = (a / d).toFixed(2);
  const pLose = ((d - a) / d).toFixed(2);

  return {
    question: `A trade pays ${money(win)} with probability ${pWin} and ${money(lose)} with probability ${pLose}. What is the expected value of one trade?`,
    concept: "expected value",
    correct: {
      text: centsToMoney(evC),
      why: `E = ${pWin}×(${money(win)}) + ${pLose}×(${money(lose)}) = ${centsToMoney(term1C)} + (${centsToMoney(term2C)}) = ${centsToMoney(evC)}. The game is ${evC < 0 ? "unfavorable" : "favorable"} on average.`,
    },
    distractors: [
      {
        text: centsToMoney(term1C),
        why: `This counts only the winning outcome; the ${pLose} chance of ${money(lose)} must be included.`,
      },
      {
        text: centsToMoney((win + lose) * 50),
        why: `That is a plain average of the two payoffs; you must weight each by its probability.`,
      },
      {
        text: centsToMoney((a * win + a * lose) * scale),
        why: `The losing outcome has probability ${pLose}, not ${pWin}.`,
      },
      {
        text: centsToMoney(-evC),
        why: `Sign slip — the win is positive and the loss is negative; recompute carefully.`,
      },
      {
        text: centsToMoney(term2C),
        why: `This counts only the losing outcome; the ${pWin} chance of ${money(win)} must be included.`,
      },
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

// ---------------------------------------------------------------------------
// Market-making templates. Prices are plain integer ticks (matching the curated
// MM bank style), and every answer is pure integer arithmetic — correct by
// construction. Generation guarantees the mid is an exact integer (even spread).
// ---------------------------------------------------------------------------

/** A bid/ask quote with an EVEN spread so the midpoint is an exact integer. */
function makeQuote(rng: RNG): { bid: number; ask: number; spread: number; mid: number } {
  const bid = rng.int(20, 90);
  const spread = rng.pick([2, 4, 6, 8]); // even ⇒ mid is a whole number
  const ask = bid + spread;
  return { bid, ask, spread, mid: bid + spread / 2 };
}

function mmFairValue(rng: RNG): BuiltQuestion {
  const { bid, ask, spread, mid } = makeQuote(rng);
  // bid < mid < ask < sum, all distinct for any bid>0, spread>0.
  return {
    question: `A market is quoted ${bid} bid / ${ask} offer. With no other information, what is the fair value (the mid price)?`,
    concept: "fair value (mid price)",
    correct: {
      text: `${mid}`,
      why: `With no signal favoring either side, fair value is the midpoint: (${bid} + ${ask}) / 2 = ${mid}.`,
    },
    distractors: [
      { text: `${bid}`, why: `${bid} is the bid (where you buy from sellers), not the midpoint of the market.` },
      { text: `${ask}`, why: `${ask} is the offer (where you sell to buyers), not the midpoint of the market.` },
      { text: `${bid + ask}`, why: `${bid + ask} is the sum of bid and offer; the mid is their average, so divide by 2.` },
      { text: `${spread}`, why: `${spread} is the spread (offer − bid), not the fair value.` },
    ],
  };
}

function mmSpread(rng: RNG): BuiltQuestion {
  const { bid, ask, spread, mid } = makeQuote(rng);
  // spread is small (≤8) while bid≥20, so spread differs from bid/ask/sum/mid.
  return {
    question: `You quote ${bid} bid / ${ask} offer. What is your spread?`,
    concept: "bid-ask spread",
    correct: {
      text: `${spread}`,
      why: `The spread is the distance between your quotes: offer − bid = ${ask} − ${bid} = ${spread}.`,
    },
    distractors: [
      { text: `${bid + ask}`, why: `${bid + ask} adds the two prices; the spread is their difference, not their sum.` },
      { text: `${bid}`, why: `${bid} is the bid price itself, not the width between bid and offer.` },
      { text: `${ask}`, why: `${ask} is the offer price itself, not the width between bid and offer.` },
      { text: `${mid}`, why: `${mid} is the mid price; the spread is offer − bid, not the midpoint.` },
    ],
  };
}

// ---------------------------------------------------------------------------
// Poker pot-odds templates. Pure arithmetic / exact rationals, unambiguous by
// the standard definitions, so the answer key is correct by construction.
// ---------------------------------------------------------------------------

function pokerPotSize(rng: RNG): BuiltQuestion {
  // "Pot before the bet" P and the bet B. Pot you can win if you call = P + 2B.
  const bet = rng.pick([10, 20, 25, 50, 100]);
  const pot = bet * rng.int(2, 6); // a clean, realistic pot relative to the bet
  const winnable = pot + 2 * bet;
  return {
    question: `The pot is $${pot} and your opponent bets $${bet}. If you call $${bet}, how big is the pot you can win?`,
    concept: "pot odds (pot size)",
    correct: {
      text: `$${winnable}`,
      why: `Add it all up: the $${pot} pot + your opponent's $${bet} bet + your $${bet} call = $${winnable}.`,
    },
    distractors: [
      { text: `$${pot + bet}`, why: `$${pot + bet} counts the bet but forgets to add your own $${bet} call.` },
      { text: `$${pot}`, why: `$${pot} is the pot before the bet; it ignores both the $${bet} bet and your $${bet} call.` },
      { text: `$${bet}`, why: `$${bet} is only the size of your call, not the whole pot you stand to win.` },
      { text: `$${pot + 3 * bet}`, why: `That over-counts the call; only one $${bet} call is added, giving $${winnable}.` },
    ],
  };
}

function pokerBreakEvenEquity(rng: RNG): BuiltQuestion {
  // Required equity to call = call / (final pot after the call) = B / (P + 2B).
  // Constraints B≠P and P≠2B keep all four options distinct (see distractor notes).
  const bet = rng.pick([10, 20, 25, 50]);
  let pot = bet * rng.int(2, 6);
  if (pot === bet) pot += bet; // enforce P ≠ B (P is already a multiple ≥ 2·bet)
  if (pot === 2 * bet) pot += bet; // enforce P ≠ 2B
  const total = pot + 2 * bet;
  const correct = new Frac(bet, total);
  return {
    question: `The pot is $${pot} and your opponent bets $${bet}. You must call $${bet} to continue. What is the minimum equity (win probability) you need for calling to break even?`,
    concept: "pot odds (break-even equity)",
    correct: {
      text: correct.toString(),
      why: `You risk $${bet} to win a final pot of $${pot} + $${bet} + $${bet} = $${total}, so you need to win at least ${bet}/${total} = ${correct.toString()} of the time.`,
    },
    distractors: [
      {
        text: new Frac(bet, pot + bet).toString(),
        why: `This uses the pot before your call ($${pot + bet}) as the denominator; break-even equity uses the final pot $${total} that includes your own call.`,
      },
      {
        text: new Frac(bet, pot).toString(),
        why: `This divides by the original pot $${pot}, ignoring the $${bet} bet and your $${bet} call that are also in the final pot.`,
      },
      {
        text: new Frac(pot, total).toString(),
        why: `This flips the ratio — equity needed is the call $${bet} over the final pot $${total}, not the pot over the total.`,
      },
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
    id: "ev-game",
    lessons: ["lesson_1", "lesson_4", "lesson_11"],
    keywords: ["expected value", "expectation", "random variable"],
    build: expectedValueGame,
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
  {
    id: "mm-fair-value",
    lessons: ["mm_fair_value", "mm_bid_ask", "mm_interview"],
    keywords: ["fair value", "fair_value", "mid price", "midpoint", "fair price"],
    build: mmFairValue,
  },
  {
    id: "mm-spread",
    lessons: ["mm_spread", "mm_bid_ask", "mm_interview"],
    keywords: ["spread", "bid-ask", "bid/ask", "bid ask"],
    build: mmSpread,
  },
  {
    id: "poker-pot-size",
    lessons: ["pt_pot_odds"],
    keywords: ["pot odds", "pot_odds", "pot size", "pot-odds"],
    build: pokerPotSize,
  },
  {
    id: "poker-break-even-equity",
    lessons: ["pt_pot_odds"],
    keywords: ["pot odds", "pot_odds", "equity", "break-even", "breakeven", "break even"],
    build: pokerBreakEvenEquity,
  },
];
