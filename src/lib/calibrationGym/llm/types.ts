import type { ProblemMode } from "../math/problems/types";

/** What a forecaster is allowed to see (never the ground truth). */
export interface ForecastInput {
  mode: ProblemMode;
  prompt: string;
  proposition?: string; // proposition mode: the claim to assign P(true)
  unit?: string; // numeric mode
  suggestedMax?: number; // numeric mode: rough upper bound hint
}

export interface ForecastResult {
  probabilityTrue?: number; // proposition mode, 0..1
  lo?: number; // numeric mode
  hi?: number;
  confidence?: number; // numeric mode, 0..1
  raw?: string; // raw model text, for debugging
  error?: string; // set if the call failed
}

export type ForecasterKind = "mock" | "openai" | "anthropic" | "google";

export interface Forecaster {
  id: string;
  label: string;
  kind: ForecasterKind;
  available: boolean; // false real providers with no API key
  forecast(input: ForecastInput): Promise<ForecastResult>;
}

/** Pull the first balanced JSON object out of arbitrary model text. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractJson(text: string): any | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

export function buildUserPrompt(input: ForecastInput): string {
  if (input.mode === "proposition") {
    return [
      "You are forecasting a probability puzzle. Reason internally, then answer.",
      "",
      `Problem: ${input.prompt}`,
      `Claim: ${input.proposition}`,
      "",
      'Respond with ONLY a JSON object: {"probability": X} where X is your probability (a number from 0 to 1) that the Claim is TRUE.',
    ].join("\n");
  }
  return [
    "You are forecasting a numeric quantity. Reason internally, then answer.",
    "",
    `Problem: ${input.prompt}`,
    `Quantity unit: ${input.unit ?? "value"}.`,
    "",
    'Respond with ONLY a JSON object: {"lo": A, "hi": B, "confidence": C} giving a prediction interval [A, B] you are C (0..1) confident contains the true value.',
  ].join("\n");
}

/** Convert a model's parsed result into a scoreable submission. */
export function resultToSubmission(input: ForecastInput, r: ForecastResult) {
  if (input.mode === "proposition") {
    return { forecastProb: r.probabilityTrue ?? 0.5 };
  }
  return {
    intervalLo: Math.min(r.lo ?? 0, r.hi ?? 0),
    intervalHi: Math.max(r.lo ?? 0, r.hi ?? 0),
    confidence: r.confidence ?? 0.9,
  };
}
