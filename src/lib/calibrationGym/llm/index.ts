import { generateBatch } from "../math/problems";
import type { ProblemInstance } from "../math/problems/types";
import { scoreInstance } from "../scoreInstance";
import { meanBrier, meanLogLoss, expectedCalibrationError } from "../math/scoring";
import type { Forecaster, ForecastInput } from "./types";
import { resultToSubmission } from "./types";
import { createMockForecaster } from "./mock";
import { createOpenAIForecaster } from "./openai";
import { createAnthropicForecaster } from "./anthropic";
import { createGoogleForecaster } from "./google";

export function getForecasters(): Forecaster[] {
  return [
    createMockForecaster(),
    createOpenAIForecaster(),
    createAnthropicForecaster(),
    createGoogleForecaster(),
  ];
}

export interface ForecasterMetrics {
  id: string;
  label: string;
  kind: string;
  available: boolean;
  ran: boolean;
  errors: number;
  propositions: {
    count: number;
    brier: number | null;
    logLoss: number | null;
    ece: number | null;
  };
  numeric: {
    count: number;
    coverage: number | null; // fraction of intervals containing the truth
    meanWinkler: number | null;
  };
}

function toInput(inst: ProblemInstance): ForecastInput {
  return {
    mode: inst.mode,
    prompt: inst.prompt,
    proposition: inst.proposition,
    unit: inst.unit,
    suggestedMax: inst.suggestedMax,
  };
}

async function evaluate(
  fc: Forecaster,
  instances: ProblemInstance[],
): Promise<ForecasterMetrics> {
  const prop: { forecast: number; outcome: 0 | 1 }[] = [];
  let numericCount = 0;
  let covered = 0;
  let winklerSum = 0;
  let errors = 0;

  if (fc.available) {
    for (const inst of instances) {
      const r = await fc.forecast(toInput(inst));
      if (r.error) {
        errors++;
        continue;
      }
      const sub = resultToSubmission(toInput(inst), r);
      const scored = scoreInstance(inst, sub);
      if (scored.mode === "proposition" && scored.outcome !== null) {
        prop.push({ forecast: sub.forecastProb ?? 0.5, outcome: scored.outcome });
      } else if (scored.mode === "numeric") {
        numericCount++;
        if (scored.covered) covered++;
        winklerSum += scored.winkler ?? 0;
      }
    }
  }

  return {
    id: fc.id,
    label: fc.label,
    kind: fc.kind,
    available: fc.available,
    ran: fc.available,
    errors,
    propositions: {
      count: prop.length,
      brier: meanBrier(prop),
      logLoss: meanLogLoss(prop),
      ece: expectedCalibrationError(prop),
    },
    numeric: {
      count: numericCount,
      coverage: numericCount ? covered / numericCount : null,
      meanWinkler: numericCount ? winklerSum / numericCount : null,
    },
  };
}

export interface LeaderboardResult {
  n: number;
  seed: number;
  forecasters: ForecasterMetrics[];
}

/** Run every available forecaster (always incl. the mock) over one batch. */
export async function runLeaderboard(
  n = 24,
  seed = 20240718,
): Promise<LeaderboardResult> {
  const instances = generateBatch(n, seed);
  const forecasters = getForecasters();
  const metrics = await Promise.all(forecasters.map((fc) => evaluate(fc, instances)));
  return { n, seed, forecasters: metrics };
}
