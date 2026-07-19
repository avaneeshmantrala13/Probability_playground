import { clamp } from "../math/scoring";
import { extractJson, type ForecastInput, type ForecastResult } from "./types";

/** Turn arbitrary model text into a structured, clamped ForecastResult. */
export function parseForecast(input: ForecastInput, text: string): ForecastResult {
  const json = extractJson(text);
  if (input.mode === "proposition") {
    let p: number | undefined;
    if (json && typeof json.probability === "number") p = json.probability;
    else if (json && typeof json.prob === "number") p = json.prob;
    else {
      const m = text.match(/(-?\d*\.?\d+)\s*%?/);
      if (m) {
        p = parseFloat(m[1]);
        if (text.includes("%") || p > 1) p = p / 100;
      }
    }
    if (p === undefined || Number.isNaN(p)) {
      return { error: "could not parse probability", raw: text };
    }
    return { probabilityTrue: clamp(p, 0, 1), raw: text };
  }

  let lo: number | undefined;
  let hi: number | undefined;
  let confidence = 0.9;
  if (json) {
    if (typeof json.lo === "number") lo = json.lo;
    if (typeof json.hi === "number") hi = json.hi;
    if (typeof json.confidence === "number") confidence = json.confidence;
  }
  if (lo === undefined || hi === undefined) {
    const nums = text.match(/-?\d*\.?\d+/g)?.map(Number) ?? [];
    if (nums.length >= 2) {
      lo = nums[0];
      hi = nums[1];
    }
  }
  if (lo === undefined || hi === undefined || Number.isNaN(lo) || Number.isNaN(hi)) {
    return { error: "could not parse interval", raw: text };
  }
  return {
    lo: Math.min(lo, hi),
    hi: Math.max(lo, hi),
    confidence: clamp(confidence, 0.5, 0.999),
    raw: text,
  };
}
