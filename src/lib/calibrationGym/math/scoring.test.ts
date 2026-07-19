import { describe, it, expect } from "vitest";
import {
  brierScore,
  logLoss,
  winklerScore,
  isCovered,
  reliabilityBins,
  meanBrier,
  expectedCalibrationError,
} from "./scoring";

describe("brierScore", () => {
  it("is 0 for a perfect confident forecast", () => {
    expect(brierScore(1, 1)).toBe(0);
    expect(brierScore(0, 0)).toBe(0);
  });
  it("is 1 for a maximally wrong confident forecast", () => {
    expect(brierScore(1, 0)).toBe(1);
    expect(brierScore(0, 1)).toBe(1);
  });
  it("is 0.25 for a coin-flip forecast", () => {
    expect(brierScore(0.5, 1)).toBeCloseTo(0.25, 12);
    expect(brierScore(0.5, 0)).toBeCloseTo(0.25, 12);
  });
  it("matches (p-o)^2", () => {
    expect(brierScore(0.8, 1)).toBeCloseTo(0.04, 12);
    expect(brierScore(0.2, 0)).toBeCloseTo(0.04, 12);
  });
});

describe("logLoss", () => {
  it("equals -ln(0.5) at p=0.5", () => {
    expect(logLoss(0.5, 1)).toBeCloseTo(Math.log(2), 12);
    expect(logLoss(0.5, 0)).toBeCloseTo(Math.log(2), 12);
  });
  it("is small for a correct confident forecast and large for a wrong one", () => {
    expect(logLoss(0.99, 1)).toBeLessThan(0.02);
    expect(logLoss(0.01, 1)).toBeGreaterThan(4);
  });
  it("stays finite at the extremes via clamping", () => {
    expect(Number.isFinite(logLoss(1, 0))).toBe(true);
    expect(Number.isFinite(logLoss(0, 1))).toBe(true);
  });
});

describe("winklerScore", () => {
  it("equals the width when the value is covered", () => {
    expect(winklerScore(2, 4, 3, 0.9)).toBeCloseTo(2, 12);
  });
  it("adds a (2/alpha) penalty proportional to the shortfall", () => {
    // alpha = 0.1 -> factor 20; miss by 1 above -> 2 + 20*1 = 22
    expect(winklerScore(2, 4, 5, 0.9)).toBeCloseTo(22, 12);
    // miss by 0.5 below -> 2 + 20*0.5 = 12
    expect(winklerScore(2, 4, 1.5, 0.9)).toBeCloseTo(12, 12);
  });
});

describe("isCovered", () => {
  it("is inclusive of endpoints", () => {
    expect(isCovered(1, 3, 1)).toBe(true);
    expect(isCovered(1, 3, 3)).toBe(true);
    expect(isCovered(1, 3, 3.0001)).toBe(false);
  });
});

describe("reliabilityBins / aggregate metrics", () => {
  it("bins forecasts and computes observed frequency", () => {
    const obs = [
      { forecast: 0.05, outcome: 0 as const },
      { forecast: 0.95, outcome: 1 as const },
      { forecast: 0.55, outcome: 1 as const },
      { forecast: 0.55, outcome: 0 as const },
    ];
    const bins = reliabilityBins(obs, 10);
    expect(bins[0].count).toBe(1);
    expect(bins[0].observedFreq).toBe(0);
    expect(bins[9].count).toBe(1);
    expect(bins[9].observedFreq).toBe(1);
    expect(bins[5].count).toBe(2);
    expect(bins[5].observedFreq).toBe(0.5);
  });
  it("computes mean Brier and a perfect-calibration ECE of ~0", () => {
    const obs = [
      { forecast: 1, outcome: 1 as const },
      { forecast: 0, outcome: 0 as const },
    ];
    expect(meanBrier(obs)).toBe(0);
    expect(expectedCalibrationError(obs)).toBeCloseTo(0, 12);
  });
});
