import { describe, it, expect } from "vitest";
import { fracFromBig, fracStr } from "../frac";
import { bayesDisease, montyHall, twoChild } from "./bayes";

// Independent "natural frequencies" check for the disease posterior, using a
// common integer population and exact BigInt counts (no Fraction algebra).
function diseasePosteriorByCounts(p: {
  prevN: number;
  prevD: number;
  senN: number;
  senD: number;
  spN: number;
  spD: number;
}) {
  const prevN = BigInt(p.prevN),
    prevD = BigInt(p.prevD),
    senN = BigInt(p.senN),
    senD = BigInt(p.senD),
    spN = BigInt(p.spN),
    spD = BigInt(p.spD);
  // population N = prevD*senD*spD keeps every subgroup an integer
  const truePos = prevN * senN * spD; // diseased * sensitivity
  const falsePos = (prevD - prevN) * senD * (spD - spN); // healthy * (1 - specificity)
  return fracFromBig(truePos, truePos + falsePos);
}

describe("bayes: disease testing posterior (exact)", () => {
  it("prevalence 1/100, sens 9/10, spec 9/10 -> 1/12", () => {
    const inst = bayesDisease.build({
      prevN: 1,
      prevD: 100,
      senN: 9,
      senD: 10,
      spN: 9,
      spD: 10,
    });
    expect(inst.truthValue).toBe("1/12");
  });
  it("prevalence 1/1000, sens 99/100, spec 99/100 -> 11/122", () => {
    const inst = bayesDisease.build({
      prevN: 1,
      prevD: 1000,
      senN: 99,
      senD: 100,
      spN: 99,
      spD: 100,
    });
    expect(inst.truthValue).toBe("11/122");
  });
  it("matches an independent natural-frequency count across parameters", () => {
    const params = [
      { prevN: 1, prevD: 200, senN: 95, senD: 100, spN: 90, spD: 100 },
      { prevN: 2, prevD: 100, senN: 98, senD: 100, spN: 95, spD: 100 },
      { prevN: 5, prevD: 100, senN: 9, senD: 10, spN: 19, spD: 20 },
      { prevN: 1, prevD: 50, senN: 19, senD: 20, spN: 98, spD: 100 },
    ];
    for (const p of params) {
      expect(bayesDisease.build(p).truthValue).toBe(
        fracStr(diseasePosteriorByCounts(p)),
      );
    }
  });
});

describe("bayes: generalized Monty Hall (exact)", () => {
  it("classic 3 doors, host opens 1 -> 2/3", () => {
    expect(montyHall.build({ n: 3, k: 1 }).truthValue).toBe("2/3");
  });
  it("4 doors open 1 -> 3/8, 5 doors open 2 -> 2/5", () => {
    expect(montyHall.build({ n: 4, k: 1 }).truthValue).toBe("3/8");
    expect(montyHall.build({ n: 5, k: 2 }).truthValue).toBe("2/5");
  });
  it("states the uniform-random-switch rule explicitly when >1 door remains", () => {
    // 5 doors, host opens 1 -> 3 remaining switch doors (the ambiguous case).
    const inst = montyHall.build({ n: 5, k: 1 });
    expect(inst.prompt).toContain("uniformly at random");
    expect(inst.prompt).toMatch(/equally likely/);
  });
  it("uses unambiguous single-door wording when exactly one door remains", () => {
    // n-2 = k leaves exactly one switch door.
    const inst = montyHall.build({ n: 4, k: 2 });
    expect(inst.prompt).toContain("the single still-closed door");
  });
});

describe("bayes: two-child paradox (exact)", () => {
  it("older is a boy -> 1/2", () => {
    expect(
      twoChild.build({ subtype: "older-boy", w: 1, attribute: "" }).truthValue,
    ).toBe("1/2");
  });
  it("at least one boy -> 1/3", () => {
    expect(
      twoChild.build({ subtype: "attribute", w: 1, attribute: "" }).truthValue,
    ).toBe("1/3");
  });
  it("fair-coin attribute (w=2) -> 3/7", () => {
    expect(
      twoChild.build({
        subtype: "attribute",
        w: 2,
        attribute: "for whom a fair coin flipped at birth came up heads",
      }).truthValue,
    ).toBe("3/7");
  });
  it("fair-die attribute (w=6) -> 11/23", () => {
    expect(
      twoChild.build({
        subtype: "attribute",
        w: 6,
        attribute: "who rolled a 6 on a single throw of a fair six-sided die",
      }).truthValue,
    ).toBe("11/23");
  });
});
