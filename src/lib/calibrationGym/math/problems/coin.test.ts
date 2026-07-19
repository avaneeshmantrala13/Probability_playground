import { describe, it, expect } from "vitest";
import { Fraction, F, fracStr, fracFromBig, powBig } from "../frac";
import {
  coinExactlyK,
  coinAtLeastK,
  coinFirstSuccess,
  coinRun,
} from "./coin";

// --- Independent reference implementations (no binomial / closed form) ------

// Brute-force P(exactly k heads) by enumerating all 2^n head/tail sequences,
// weighting each by a^(#heads) * (b-a)^(#tails), all in exact BigInt.
function bruteExactly(a: number, b: number, n: number, k: number): Fraction {
  let num = 0n;
  const ba = BigInt(b - a);
  const A = BigInt(a);
  for (let mask = 0; mask < 1 << n; mask++) {
    let heads = 0;
    for (let i = 0; i < n; i++) if (mask & (1 << i)) heads++;
    if (heads === k) num += powBig(A, heads) * powBig(ba, n - heads);
  }
  return fracFromBig(num, powBig(BigInt(b), n));
}

function bruteAtLeast(a: number, b: number, n: number, k: number): Fraction {
  let num = 0n;
  const ba = BigInt(b - a);
  const A = BigInt(a);
  for (let mask = 0; mask < 1 << n; mask++) {
    let heads = 0;
    for (let i = 0; i < n; i++) if (mask & (1 << i)) heads++;
    if (heads >= k) num += powBig(A, heads) * powBig(ba, n - heads);
  }
  return fracFromBig(num, powBig(BigInt(b), n));
}

// Exact rational Gaussian elimination.
function solveRational(A: Fraction[][], b: Fraction[]): Fraction[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let piv = col;
    while (piv < n && M[piv][col].equals(0)) piv++;
    [M[col], M[piv]] = [M[piv], M[col]];
    const p = M[col][col];
    for (let j = col; j <= n; j++) M[col][j] = M[col][j].div(p);
    for (let i = 0; i < n; i++) {
      if (i !== col && !M[i][col].equals(0)) {
        const f = M[i][col];
        for (let j = col; j <= n; j++) M[i][j] = M[i][j].sub(f.mul(M[col][j]));
      }
    }
  }
  return M.map((row) => row[n]);
}

// Expected flips to a run of r heads, solved from the state recursion:
// E_s = 1 + p E_{s+1} + (1-p) E_0  for s < r, E_r = 0.  Answer = E_0.
function runExpectationByRecursion(a: number, b: number, r: number): Fraction {
  const p = F(a, b);
  const q = F(1).sub(p);
  const A: Fraction[][] = [];
  const rhs: Fraction[] = [];
  for (let s = 0; s < r; s++) {
    const row = Array.from({ length: r }, () => F(0));
    row[s] = row[s].add(F(1));
    row[0] = row[0].sub(q); // - (1-p) E_0
    if (s + 1 < r) row[s + 1] = row[s + 1].sub(p); // - p E_{s+1}
    A.push(row);
    rhs.push(F(1));
  }
  return solveRational(A, rhs)[0];
}

describe("coin: exactly k heads (exact)", () => {
  it("fair coin, 2 of 4 = 3/8", () => {
    const inst = coinExactlyK.build({ a: 1, b: 2, n: 4, k: 2 });
    expect(inst.truthValue).toBe("3/8");
    expect(inst.truthDecimal).toBeCloseTo(0.375, 12);
  });
  it("biased p=1/3, 1 of 3 = 4/9", () => {
    const inst = coinExactlyK.build({ a: 1, b: 3, n: 3, k: 1 });
    expect(inst.truthValue).toBe("4/9");
  });
  it("matches brute-force enumeration across many parameters", () => {
    for (const b of [2, 3, 4, 5]) {
      for (let a = 1; a < b; a++) {
        for (let n = 1; n <= 9; n++) {
          for (let k = 0; k <= n; k++) {
            const inst = coinExactlyK.build({ a, b, n, k });
            expect(inst.truthValue).toBe(fracStr(bruteExactly(a, b, n, k)));
          }
        }
      }
    }
  });
});

describe("coin: heads pluralization grammar", () => {
  it("uses 'head' (singular) for k=1 and 'heads' for k>1 in exactly-k", () => {
    const one = coinExactlyK.build({ a: 1, b: 2, n: 4, k: 1 });
    expect(one.prompt).toContain("exactly 1 head");
    expect(one.prompt).not.toContain("exactly 1 heads");
    expect(one.proposition).toContain("exactly 1 head");
    expect(one.proposition).not.toContain("exactly 1 heads");

    const two = coinExactlyK.build({ a: 1, b: 2, n: 4, k: 2 });
    expect(two.prompt).toContain("exactly 2 heads");
    expect(two.proposition).toContain("exactly 2 heads");
  });
  it("uses 'head' (singular) for k=1 and 'heads' for k>1 in at-least-k", () => {
    const one = coinAtLeastK.build({ a: 1, b: 2, n: 4, k: 1 });
    expect(one.prompt).toContain("at least 1 head");
    expect(one.prompt).not.toContain("at least 1 heads");
    expect(one.proposition).toContain("at least 1 head");

    const three = coinAtLeastK.build({ a: 1, b: 2, n: 4, k: 3 });
    expect(three.prompt).toContain("at least 3 heads");
  });
});

describe("coin: at least k heads (exact)", () => {
  it("fair coin, at least 1 of 3 = 7/8", () => {
    const inst = coinAtLeastK.build({ a: 1, b: 2, n: 3, k: 1 });
    expect(inst.truthValue).toBe("7/8");
  });
  it("matches brute-force enumeration across many parameters", () => {
    for (const b of [2, 3, 4, 5]) {
      for (let a = 1; a < b; a++) {
        for (let n = 1; n <= 9; n++) {
          for (let k = 0; k <= n; k++) {
            const inst = coinAtLeastK.build({ a, b, n, k });
            expect(inst.truthValue).toBe(fracStr(bruteAtLeast(a, b, n, k)));
          }
        }
      }
    }
  });
});

describe("coin: expected flips to first head", () => {
  it("fair coin = 2, p=1/3 -> 3", () => {
    expect(coinFirstSuccess.build({ a: 1, b: 2 }).truthValue).toBe("2");
    expect(coinFirstSuccess.build({ a: 1, b: 3 }).truthValue).toBe("3");
  });
});

describe("coin: expected flips to a run of r heads", () => {
  it("known hand values: HH fair = 6, HHH fair = 14, HH p=1/3 = 12", () => {
    expect(coinRun.build({ a: 1, b: 2, r: 2 }).truthValue).toBe("6");
    expect(coinRun.build({ a: 1, b: 2, r: 3 }).truthValue).toBe("14");
    expect(coinRun.build({ a: 1, b: 3, r: 2 }).truthValue).toBe("12");
  });
  it("matches an independent exact recursion solve across parameters", () => {
    for (const b of [2, 3, 4, 5]) {
      for (let a = 1; a < b; a++) {
        for (let r = 1; r <= 4; r++) {
          const inst = coinRun.build({ a, b, r });
          expect(inst.truthValue).toBe(fracStr(runExpectationByRecursion(a, b, r)));
        }
      }
    }
  });
});
