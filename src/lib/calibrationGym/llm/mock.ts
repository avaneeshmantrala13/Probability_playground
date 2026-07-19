import { mulberry32, hashString } from "../rng";
import type { Forecaster, ForecastInput, ForecastResult } from "./types";

/**
 * Deterministic mock "frontier model". It CANNOT see the ground truth, so its
 * answers are a hash-seeded pseudo-forecast that is intentionally OVERCONFIDENT
 * (pushed toward the extremes for propositions, too-narrow intervals for
 * numeric questions). This reproduces the product thesis: strong-sounding
 * models that are badly miscalibrated, so a disciplined human can beat them.
 * Works with zero API keys.
 */
export function createMockForecaster(
  id = "gpt-5.x-mock",
  label = "GPT-5.x (mock)",
): Forecaster {
  return {
    id,
    label,
    kind: "mock",
    available: true,
    async forecast(input: ForecastInput): Promise<ForecastResult> {
      const rng = mulberry32(hashString(id + "|" + input.prompt + "|" + (input.proposition ?? "")));
      if (input.mode === "proposition") {
        // Base belief, then sharpen toward 0/1 to model overconfidence.
        const belief = 0.15 + 0.7 * rng();
        const gamma = 3.2; // > 1 => overconfident
        const a = Math.pow(belief, gamma);
        const b = Math.pow(1 - belief, gamma);
        let p = a / (a + b);
        // Occasionally commit hard to a near-certain (often wrong) answer.
        if (rng() < 0.4) p = p > 0.5 ? 0.97 : 0.03;
        p = Math.max(0.02, Math.min(0.98, p));
        return { probabilityTrue: p, raw: `mock:${p.toFixed(3)}` };
      }
      const max = input.suggestedMax ?? 10;
      const center = 1 + rng() * (max - 1);
      const halfWidth = Math.max(0.4, (max * 0.06) * (0.5 + rng())); // narrow => overconfident
      const lo = Math.max(0, center - halfWidth);
      const hi = center + halfWidth;
      return { lo, hi, confidence: 0.9, raw: `mock:[${lo.toFixed(2)},${hi.toFixed(2)}]` };
    },
  };
}
