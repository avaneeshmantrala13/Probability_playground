import { describe, it, expect } from "vitest";
import {
  regularizedIncompleteBeta,
  betaQuantile,
  betaBinomialPosterior,
} from "./posterior";

describe("regularizedIncompleteBeta", () => {
  // Closed forms used as ground truth:
  //   Beta(1,1): I_x = x
  //   Beta(2,2): I_x = 3x^2 - 2x^3
  //   Beta(5,1): I_x = x^5
  //   Beta(1,5): I_x = 1 - (1-x)^5
  it("matches I_x(1,1) = x (uniform)", () => {
    expect(regularizedIncompleteBeta(0.05, 1, 1)).toBeCloseTo(0.05, 10);
    expect(regularizedIncompleteBeta(0.5, 1, 1)).toBeCloseTo(0.5, 10);
    expect(regularizedIncompleteBeta(0.9, 1, 1)).toBeCloseTo(0.9, 10);
  });
  it("matches I_x(2,2) = 3x^2 - 2x^3", () => {
    const f = (x: number) => 3 * x * x - 2 * x ** 3;
    expect(regularizedIncompleteBeta(0.5, 2, 2)).toBeCloseTo(f(0.5), 10);
    expect(regularizedIncompleteBeta(0.3, 2, 2)).toBeCloseTo(f(0.3), 10);
  });
  it("matches I_x(5,1) = x^5 and I_x(1,5) = 1-(1-x)^5", () => {
    expect(regularizedIncompleteBeta(0.8, 5, 1)).toBeCloseTo(0.8 ** 5, 10);
    expect(regularizedIncompleteBeta(0.2, 1, 5)).toBeCloseTo(1 - 0.8 ** 5, 10);
  });
  it("is 0 at x<=0 and 1 at x>=1", () => {
    expect(regularizedIncompleteBeta(0, 3, 4)).toBe(0);
    expect(regularizedIncompleteBeta(1, 3, 4)).toBe(1);
  });
});

describe("betaQuantile", () => {
  it("inverts the uniform CDF exactly", () => {
    expect(betaQuantile(0.05, 1, 1)).toBeCloseTo(0.05, 6);
    expect(betaQuantile(0.5, 1, 1)).toBeCloseTo(0.5, 6);
  });
  it("inverts Beta(5,1): quantile(p) = p^(1/5)", () => {
    expect(betaQuantile(0.05, 5, 1)).toBeCloseTo(0.05 ** (1 / 5), 6);
    expect(betaQuantile(0.5, 5, 1)).toBeCloseTo(0.5 ** (1 / 5), 6);
  });
  it("inverts Beta(1,5): quantile(p) = 1-(1-p)^(1/5)", () => {
    expect(betaQuantile(0.5, 1, 5)).toBeCloseTo(1 - 0.5 ** (1 / 5), 6);
  });
});

describe("betaBinomialPosterior", () => {
  it("uses a uniform prior by default: mean = (s+1)/(n+2)", () => {
    // 0 items -> prior mean 0.5
    expect(betaBinomialPosterior(0, 0).mean).toBeCloseTo(0.5, 10);
    // 3/3 correct -> Beta(4,1), mean = 4/5
    const p33 = betaBinomialPosterior(3, 3);
    expect(p33.alpha).toBe(4);
    expect(p33.beta).toBe(1);
    expect(p33.mean).toBeCloseTo(0.8, 10);
    // 2/2 correct -> Beta(3,1), mean = 3/4 (shrunk below 1: not over-trusted)
    expect(betaBinomialPosterior(2, 2).mean).toBeCloseTo(0.75, 10);
  });

  it("produces a 90% central interval by default", () => {
    // 3/3 correct -> Beta(4,1): I_x = x^4, so lo=0.05^(1/4), hi=0.95^(1/4)
    const p = betaBinomialPosterior(3, 3);
    expect(p.credibleMass).toBe(0.9);
    expect(p.lo).toBeCloseTo(0.05 ** (1 / 4), 5);
    expect(p.hi).toBeCloseTo(0.95 ** (1 / 4), 5);
    expect(p.lo).toBeLessThan(p.mean);
    expect(p.hi).toBeGreaterThan(p.mean);
  });

  it("widens the interval when there are fewer items", () => {
    const few = betaBinomialPosterior(1, 1); // Beta(2,1)
    const many = betaBinomialPosterior(8, 8); // Beta(9,1)
    expect(few.hi - few.lo).toBeGreaterThan(many.hi - many.lo);
  });
});
