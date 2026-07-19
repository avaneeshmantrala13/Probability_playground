import type { Forecaster, ForecastInput, ForecastResult } from "./types";
import { buildUserPrompt } from "./types";
import { parseForecast } from "./parse";

export function createAnthropicForecaster(): Forecaster {
  const key = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";
  return {
    id: "anthropic",
    label: `Anthropic (${model})`,
    kind: "anthropic",
    available: Boolean(key),
    async forecast(input: ForecastInput): Promise<ForecastResult> {
      if (!key) return { error: "ANTHROPIC_API_KEY not set" };
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model,
            max_tokens: 1024,
            temperature: 0,
            system:
              "You are a careful probabilistic forecaster. Output only the requested JSON.",
            messages: [{ role: "user", content: buildUserPrompt(input) }],
          }),
        });
        if (!res.ok) return { error: `Anthropic HTTP ${res.status}: ${await res.text()}` };
        const data = await res.json();
        const text: string = data?.content?.[0]?.text ?? "";
        return parseForecast(input, text);
      } catch (e) {
        return { error: `Anthropic request failed: ${(e as Error).message}` };
      }
    },
  };
}
