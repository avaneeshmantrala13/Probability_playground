/** Exact rational arithmetic so generated probabilities are always correct and
 *  presented in a single canonical (reduced) form — no 1/5-vs-2/10 duplicates. */

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}

export class Frac {
  readonly num: number;
  readonly den: number;

  constructor(num: number, den = 1) {
    if (den === 0) throw new Error("Frac: zero denominator");
    if (den < 0) {
      num = -num;
      den = -den;
    }
    const g = gcd(num, den);
    this.num = num / g;
    this.den = den / g;
  }

  add(o: Frac): Frac {
    return new Frac(this.num * o.den + o.num * this.den, this.den * o.den);
  }

  sub(o: Frac): Frac {
    return new Frac(this.num * o.den - o.num * this.den, this.den * o.den);
  }

  mul(o: Frac): Frac {
    return new Frac(this.num * o.num, this.den * o.den);
  }

  value(): number {
    return this.num / this.den;
  }

  /** Canonical reduced string: "3" for integers, "3/4" otherwise. */
  toString(): string {
    return this.den === 1 ? `${this.num}` : `${this.num}/${this.den}`;
  }
}
