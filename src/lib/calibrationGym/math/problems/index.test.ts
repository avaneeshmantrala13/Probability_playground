import { describe, it, expect } from "vitest";
import { F } from "../frac";
import { mulberry32 } from "../../rng";
import {
  buildFromSeed,
  generateBatch,
  generateProblem,
  templateInfo,
} from "./index";

describe("problem registry", () => {
  it("rebuilds an identical instance from its seed", () => {
    for (let s = 1; s <= 200; s++) {
      const inst = generateProblem({ rng: mulberry32(s) });
      const rebuilt = buildFromSeed(inst.seed);
      expect(rebuilt.truthValue).toBe(inst.truthValue);
      expect(rebuilt.prompt).toBe(inst.prompt);
      expect(rebuilt.resolvesTrue).toBe(inst.resolvesTrue);
      expect(rebuilt.threshold).toBe(inst.threshold);
    }
  });

  it("generateBatch is deterministic for a given seed", () => {
    const a = generateBatch(20, 999);
    const b = generateBatch(20, 999);
    expect(a.map((x) => x.seed)).toEqual(b.map((x) => x.seed));
  });

  it("proposition instances resolve consistently with exact comparison", () => {
    const batch = generateBatch(300, 42);
    for (const inst of batch) {
      if (inst.mode !== "proposition") continue;
      expect(inst.threshold).toBeDefined();
      const cmp = F(inst.truthValue).compare(F(inst.threshold!));
      // direction is encoded in the proposition text
      const isGreater = /greater than/.test(inst.proposition!);
      const expected = isGreater ? cmp > 0 : cmp < 0;
      expect(inst.resolvesTrue).toBe(expected);
      // threshold sits on a 5% grid and never exactly equals the truth
      expect(cmp).not.toBe(0);
    }
  });

  it("numeric instances carry a positive exact truth and sensible bounds", () => {
    const batch = generateBatch(200, 7);
    for (const inst of batch) {
      if (inst.mode !== "numeric") continue;
      expect(inst.truthDecimal).toBeGreaterThan(0);
      expect(inst.suggestedMax).toBeGreaterThan(inst.truthDecimal);
      expect(inst.unit).toBeTruthy();
    }
  });

  it("covers both families", () => {
    const fams = new Set(templateInfo().map((t) => t.family));
    expect(fams.has("coin-flip")).toBe(true);
    expect(fams.has("bayes")).toBe(true);
  });
});
