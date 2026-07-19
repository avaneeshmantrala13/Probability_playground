import { describe, it, expect } from "vitest";
import {
  scoreDiagnosticItem,
  classifyMastery,
  aggregateTopic,
  buildReadinessReport,
  type ItemScore,
} from "./mastery";

describe("scoreDiagnosticItem", () => {
  it("proposition: correct iff forecast is on the true side of 50%", () => {
    // claim TRUE, forecast 80% -> correct, brier (0.8-1)^2 = 0.04
    const a = scoreDiagnosticItem({ mode: "proposition", outcome: 1, forecastProb: 0.8 });
    expect(a.correct).toBe(true);
    expect(a.calibrationBrier).toBeCloseTo(0.04, 12);
    // claim FALSE, forecast 80% -> wrong, brier (0.8-0)^2 = 0.64
    const b = scoreDiagnosticItem({ mode: "proposition", outcome: 0, forecastProb: 0.8 });
    expect(b.correct).toBe(false);
    expect(b.calibrationBrier).toBeCloseTo(0.64, 12);
  });
  it("proposition: exactly 50% is not a commitment (incorrect)", () => {
    const r = scoreDiagnosticItem({ mode: "proposition", outcome: 1, forecastProb: 0.5 });
    expect(r.correct).toBe(false);
    expect(r.calibrationBrier).toBeCloseTo(0.25, 12);
  });
  it("numeric: correct iff covered; confidence Brier-scored against coverage", () => {
    const hit = scoreDiagnosticItem({ mode: "numeric", covered: true, confidence: 0.9 });
    expect(hit.correct).toBe(true);
    expect(hit.calibrationBrier).toBeCloseTo(0.01, 12); // (0.9-1)^2
    const miss = scoreDiagnosticItem({ mode: "numeric", covered: false, confidence: 0.9 });
    expect(miss.correct).toBe(false);
    expect(miss.calibrationBrier).toBeCloseTo(0.81, 12); // (0.9-0)^2
  });
});

describe("classifyMastery", () => {
  it("applies the documented skill + Brier thresholds", () => {
    expect(classifyMastery(0.8, 0.15)).toBe("mastered");
    expect(classifyMastery(0.8, 0.16)).toBe("developing"); // good skill, weak calibration
    expect(classifyMastery(0.6, 0.2)).toBe("developing");
    expect(classifyMastery(0.54, 0.2)).toBe("not-ready");
    expect(classifyMastery(0.9, 0.4)).toBe("not-ready"); // confidently wrong
    expect(classifyMastery(0.2, 0.05)).toBe("not-ready");
  });
});

function items(correct: boolean, brier: number, n: number): ItemScore[] {
  return Array.from({ length: n }, () => ({ correct, calibrationBrier: brier }));
}

describe("aggregateTopic", () => {
  const meta = { topicId: "t", label: "T", short: "T", family: "coin-flip" };

  it("3/3 correct with good calibration reaches Mastered", () => {
    // posterior Beta(4,1) mean = 0.8; brier 0.04 <= 0.15
    const r = aggregateTopic(meta, items(true, 0.04, 3));
    expect(r.skillAccuracy).toBe(1);
    expect(r.posterior.mean).toBeCloseTo(0.8, 10);
    expect(r.brier).toBeCloseTo(0.04, 12);
    expect(r.mastery).toBe("mastered");
  });

  it("2/2 correct is only Developing (few-item shrinkage prevents mastery)", () => {
    // posterior Beta(3,1) mean = 0.75 < 0.8 -> not mastered
    const r = aggregateTopic(meta, items(true, 0.04, 2));
    expect(r.posterior.mean).toBeCloseTo(0.75, 10);
    expect(r.mastery).toBe("developing");
  });

  it("2/3 correct with ok calibration is Developing", () => {
    const mixed: ItemScore[] = [
      { correct: true, calibrationBrier: 0.1 },
      { correct: true, calibrationBrier: 0.1 },
      { correct: false, calibrationBrier: 0.3 },
    ];
    const r = aggregateTopic(meta, mixed);
    // posterior Beta(3,2) mean = 3/5 = 0.6; brier mean ~0.1667 <= 0.25
    expect(r.posterior.mean).toBeCloseTo(0.6, 10);
    expect(r.brier).toBeCloseTo((0.1 + 0.1 + 0.3) / 3, 12);
    expect(r.mastery).toBe("developing");
  });

  it("0/3 correct is Not-ready", () => {
    const r = aggregateTopic(meta, items(false, 0.7, 3));
    expect(r.posterior.mean).toBeCloseTo(0.2, 10); // Beta(1,4)
    expect(r.mastery).toBe("not-ready");
  });
});

describe("buildReadinessReport", () => {
  const meta = (id: string) => ({ topicId: id, label: id, short: id, family: "coin-flip" });

  it("computes readiness as fraction mastered and sorts focus areas weakest-first", () => {
    const mastered = aggregateTopic(meta("m"), items(true, 0.04, 3));
    const developing = aggregateTopic(meta("d"), items(true, 0.04, 2));
    const notReady = aggregateTopic(meta("n"), items(false, 0.7, 3));
    const report = buildReadinessReport([mastered, developing, notReady]);

    expect(report.totalTopics).toBe(3);
    expect(report.masteredCount).toBe(1);
    expect(report.readiness).toBeCloseTo(1 / 3, 10);
    // focus areas exclude the mastered topic, weakest (lowest posterior) first
    expect(report.focusAreas.map((t) => t.topicId)).toEqual(["n", "d"]);
  });
});
