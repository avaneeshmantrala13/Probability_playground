import type { Forecaster, ForecastInput, ForecastResult } from "./types";
import { buildUserPrompt } from "./types";
import { parseForecast } from "./parse";

export function createGoogleForecaster(): Forecaster {
  const key = process.env.GOOGLE_API_KEY;
  const model = process.env.GOOGLE_MODEL || "gemini-2.5-pro";
  return {
    id: "google",
    label: `Google (${model})`,
    kind: "google",
    available: Boolean(key),
    async forecast(input: ForecastInput): Promise<ForecastResult> {
      if (!key) return { error: "GOOGLE_API_KEY not set" };
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: buildUserPrompt(input) }] },
            ],
            generationConfig: { temperature: 0 },
          }),
        });
        if (!res.ok) return { error: `Google HTTP ${res.status}: ${await res.text()}` };
        const data = await res.json();
        const text: string =
          data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        return parseForecast(input, text);
      } catch (e) {
        return { error: `Google request failed: ${(e as Error).message}` };
      }
    },
  };
}
