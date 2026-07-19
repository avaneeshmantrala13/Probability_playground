import { Fraction, F, fracStr, pct } from "../frac";
import { type RNG, randInt, choice, mulberry32, hashString } from "../../rng";
import type { ProblemTemplate } from "./types";
import { makeProposition } from "./proposition";

function seedRngFor(type: string, params: unknown): RNG {
  return mulberry32(hashString(type + JSON.stringify(params)));
}

// ---------------------------------------------------------------------------
// Template: disease testing / base-rate (proposition)
// Posterior P(D | +) = pr*se / [ pr*se + (1-pr)*(1-sp) ]
// ---------------------------------------------------------------------------
interface DiseaseParams {
  prevN: number;
  prevD: number; // prevalence = prevN/prevD
  senN: number;
  senD: number; // sensitivity  P(+ | D)
  spN: number;
  spD: number; // specificity  P(- | ~D)
}

export const bayesDisease: ProblemTemplate<DiseaseParams> = {
  type: "bayes-disease",
  family: "bayes",
  mode: "proposition",
  label: "Disease testing / base rate",
  sample(rng) {
    const prevalence = choice(rng, [
      [1, 1000],
      [1, 500],
      [1, 200],
      [1, 100],
      [2, 100],
      [5, 100],
      [1, 50],
    ]);
    const sensitivity = choice(rng, [
      [9, 10],
      [19, 20],
      [95, 100],
      [98, 100],
      [99, 100],
    ]);
    const specificity = choice(rng, [
      [9, 10],
      [19, 20],
      [90, 100],
      [95, 100],
      [98, 100],
    ]);
    return {
      prevN: prevalence[0],
      prevD: prevalence[1],
      senN: sensitivity[0],
      senD: sensitivity[1],
      spN: specificity[0],
      spD: specificity[1],
    };
  },
  build(params) {
    const pr = F(params.prevN, params.prevD);
    const se = F(params.senN, params.senD);
    const sp = F(params.spN, params.spD);
    const num = pr.mul(se);
    const denom = num.add(F(1).sub(pr).mul(F(1).sub(sp)));
    const value = num.div(denom);

    const rng = seedRngFor("bayes-disease", params);
    const prop = makeProposition(value, rng);
    return {
      family: "bayes",
      problemType: "bayes-disease",
      mode: "proposition",
      title: "Disease testing",
      prompt: `A disease affects ${pct(pr.valueOf(), 2)} of a population (prevalence ${fracStr(
        pr,
      )}). A test has sensitivity ${pct(se.valueOf(), 1)} (it is positive in ${fracStr(
        se,
      )} of people who have the disease) and specificity ${pct(
        sp.valueOf(),
        1,
      )} (it is negative in ${fracStr(
        sp,
      )} of people who don't). A randomly selected person tests POSITIVE. Consider the probability that they actually have the disease.`,
      proposition: prop.text(
        "The probability the person actually has the disease, given a positive test,",
      ),
      threshold: fracStr(prop.threshold),
      resolvesTrue: prop.resolvesTrue,
      truthValue: fracStr(value),
      truthDecimal: value.valueOf(),
      explanation: `Bayes: P(D|+) = P(+|D)P(D) / [P(+|D)P(D) + P(+|\u00acD)P(\u00acD)] = (${fracStr(
        pr,
      )}\u00b7${fracStr(se)}) / (${fracStr(pr)}\u00b7${fracStr(se)} + ${fracStr(
        F(1).sub(pr),
      )}\u00b7${fracStr(F(1).sub(sp))}) = ${fracStr(value)} \u2248 ${pct(
        value.valueOf(),
        2,
      )}. Base-rate neglect makes people badly overestimate this. Claim resolves ${
        prop.resolvesTrue ? "TRUE" : "FALSE"
      }.`,
      seed: JSON.stringify({ type: "bayes-disease", params }),
    };
  },
};

// ---------------------------------------------------------------------------
// Template: generalized Monty Hall (proposition)
// N doors, host opens k goat doors, you switch. P(win|switch) = (N-1)/(N(N-1-k))
// ---------------------------------------------------------------------------
interface MontyParams {
  n: number;
  k: number;
}

export const montyHall: ProblemTemplate<MontyParams> = {
  type: "monty-hall",
  family: "bayes",
  mode: "proposition",
  label: "Monty Hall (N doors)",
  sample(rng) {
    const n = randInt(rng, 3, 8);
    const k = randInt(rng, 1, n - 2); // must leave >=1 switch door and open only goats
    return { n, k };
  },
  build(params) {
    const { n, k } = params;
    const value = F(n - 1, n * (n - 1 - k)); // P(win by switching)
    const rng = seedRngFor("monty-hall", params);
    const prop = makeProposition(value, rng);
    const remaining = n - 1 - k;
    return {
      family: "bayes",
      problemType: "monty-hall",
      mode: "proposition",
      title: "Monty Hall variant",
      prompt: `There are ${n} closed doors; behind exactly one is a car, the rest hide goats. You pick one door at random. The host, who knows where the car is, then opens ${k} other door${
        k === 1 ? "" : "s"
      }, always revealing goats and never your door. You now SWITCH: you abandon your original door and ${
        remaining === 1
          ? `move to the single still-closed door you didn't originally choose`
          : `choose uniformly at random among the ${remaining} still-closed doors you didn't originally choose (each of those ${remaining} doors is equally likely — the host does NOT reveal which of them holds the car)`
      }. Consider the probability of winning the car after this switch.`,
      proposition: prop.text(
        "The probability of winning the car by switching",
      ),
      threshold: fracStr(prop.threshold),
      resolvesTrue: prop.resolvesTrue,
      truthValue: fracStr(value),
      truthDecimal: value.valueOf(),
      explanation: `You win by switching iff the car isn't behind your first pick (prob (N\u22121)/N = ${
        n - 1
      }/${n}) and you then choose the right door among the ${remaining} remaining (prob 1/${remaining}). So P = (${
        n - 1
      })/(${n}\u00b7${remaining}) = ${fracStr(value)} \u2248 ${pct(
        value.valueOf(),
        2,
      )}. Claim resolves ${prop.resolvesTrue ? "TRUE" : "FALSE"}.`,
      seed: JSON.stringify({ type: "monty-hall", params }),
    };
  },
};

// ---------------------------------------------------------------------------
// Template: two-child paradox (proposition)
//  - "older-boy": P(both boys | older is a boy) = 1/2
//  - "attribute": P(both boys | at least one boy with attribute of w kinds)
//        = (2w-1)/(4w-1);  w=1 -> 1/3 ("at least one boy"), w=7 -> 13/27 (Tuesday)
// ---------------------------------------------------------------------------
interface TwoChildParams {
  subtype: "older-boy" | "attribute";
  w: number; // only used for "attribute"
  attribute: string;
}

export const twoChild: ProblemTemplate<TwoChildParams> = {
  type: "two-child",
  family: "bayes",
  mode: "proposition",
  label: "Two-child paradox",
  sample(rng) {
    const subtype = choice(rng, ["older-boy", "attribute", "attribute"] as const);
    // Attributes are chosen to be *exactly* uniform (a fair coin / a fair die) so
    // the "w equally likely kinds" assumption is literally true and the stated
    // answer (2w-1)/(4w-1) is airtight — unlike real months/days-of-week, which
    // are not equally likely and only approximate the idealized paradox.
    const opt = choice(rng, [
      { w: 1, attribute: "" },
      { w: 2, attribute: "for whom a fair coin flipped at birth came up heads" },
      { w: 6, attribute: "who rolled a 6 on a single throw of a fair six-sided die" },
    ]);
    return { subtype, w: opt.w, attribute: opt.attribute };
  },
  build(params) {
    const { subtype, w, attribute } = params;
    let value: Fraction;
    let prompt: string;
    let explanation: string;

    if (subtype === "older-boy") {
      value = F(1, 2);
      prompt =
        "A family has two children. You are told the OLDER child is a boy. Consider the probability that both children are boys.";
      explanation =
        "Conditioning on the older child (a specific child) being a boy leaves the younger child's sex independent and uniform, so P(both boys) = 1/2. (Contrast with the unordered 'at least one boy' case, which gives 1/3.)";
    } else if (w === 1) {
      value = F(1, 3);
      prompt =
        "A family has two children. You are told that at least one of them is a boy. Consider the probability that both children are boys.";
      explanation =
        "Equally likely ordered outcomes are BB, BG, GB, GG. Conditioning on 'at least one boy' removes GG, leaving {BB, BG, GB}; only BB has two boys, so P = 1/3.";
    } else {
      value = F(2 * w - 1, 4 * w - 1);
      prompt = `A family has two children. You are told that at least one of them is a boy ${attribute}. Assume boys and girls are equally likely and the attribute (${w} equally likely kinds) is independent of sex. Consider the probability that both children are boys.`;
      explanation = `With ${w} equally likely attribute kinds, counting ordered (sex, attribute) outcomes gives P(both boys | at least one boy ${attribute}) = (2\u00b7${w}\u22121)/(4\u00b7${w}\u22121) = ${
        2 * w - 1
      }/${4 * w - 1} \u2248 ${pct(value.valueOf(), 2)}. The surprising dependence on the attribute is the paradox.`;
    }

    const rng = seedRngFor("two-child", params);
    const prop = makeProposition(value, rng);
    return {
      family: "bayes",
      problemType: "two-child",
      mode: "proposition",
      title: "Two-child paradox",
      prompt,
      proposition: prop.text("The probability that both children are boys"),
      threshold: fracStr(prop.threshold),
      resolvesTrue: prop.resolvesTrue,
      truthValue: fracStr(value),
      truthDecimal: value.valueOf(),
      explanation: `${explanation} Exact value ${fracStr(value)}. Claim resolves ${
        prop.resolvesTrue ? "TRUE" : "FALSE"
      }.`,
      seed: JSON.stringify({ type: "two-child", params }),
    };
  },
};

export const bayesTemplates = [bayesDisease, montyHall, twoChild];
