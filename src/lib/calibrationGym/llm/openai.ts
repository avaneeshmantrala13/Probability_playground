import type { Forecaster, ForecastInput, ForecastResult } from "./types";
import { buildUserPrompt } from "./types";
import { parseForecast } from "./parse";

export function createOpenAIForecaster(): Forecaster {
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-5.1";
  return {
    id: "openai",
    label: `OpenAI (${model})`,
    kind: "openai",
    available: Boolean(key),
    async forecast(input: ForecastInput): Promise<ForecastResult> {
      if (!key) return { error: "OPENAI_API_KEY not set" };
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model,
            temperature: 0,
            messages: [
              {
                role: "system",
                content:
                  "You are a careful probabilistic forecaster. Output only the requested JSON.",
              },
              { role: "user", content: buildUserPrompt(input) },
            ],
          }),
        });
        if (!res.ok) return { error: `OpenAI HTTP ${res.status}: ${await res.text()}` };
        const data = await res.json();
        const text: string = data?.choices?.[0]?.message?.content ?? "";
        return parseForecast(input, text);
      } catch (e) {
        return { error: `OpenAI request failed: ${(e as Error).message}` };
      }
    },
  };
}
