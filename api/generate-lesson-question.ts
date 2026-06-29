import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyBearerToken } from "./_lib/firebase-auth.js";
import { chatCompletion } from "./_lib/openai.js";
import { checkRateLimit } from "./_lib/rate-limit.js";
import { consumeQuotaSafe } from "./_lib/quota.js";
import {
  QUESTION_GEN_SYSTEM,
  questionGenUserPrompt,
  QUESTION_VERIFY_SYSTEM,
  questionVerifyUserPrompt,
} from "./_lib/prompts.js";

// Free-tier daily cap for AI-generated lesson questions (server-side margin guard).
const FREE_LESSON_GEN_PER_DAY = 10;

// How many times we (re)generate to obtain a question that passes verification.
const MAX_GEN_ATTEMPTS = 3;

/** Non-sensitive snapshot of which server env vars are present (booleans only). */
function envState(): string {
  const openai = Boolean(process.env.OPENAI_API_KEY?.trim());
  const admin = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim());
  return `env: OPENAI_API_KEY=${openai ? "set" : "MISSING"}, FIREBASE_SERVICE_ACCOUNT_JSON=${admin ? "set" : "MISSING"}`;
}

/**
 * Best-effort numeric value of an answer option, supporting integers, decimals,
 * simple fractions ("2/10"), and percentages ("20%"). Returns null for options
 * that aren't a single clean number (we can't compare those deterministically).
 */
function optionValue(raw: string): number | null {
  const s = raw.trim().replace(/\s+/g, "");
  if (!s) return null;
  // Percentage, e.g. "20%" or "12.5%".
  const pct = /^[-+]?\d*\.?\d+%$/.exec(s);
  if (pct) return parseFloat(s) / 100;
  // Simple fraction, e.g. "2/10" or "-3/4".
  const frac = /^([-+]?\d+)\/(\d+)$/.exec(s);
  if (frac) {
    const denom = Number(frac[2]);
    return denom === 0 ? null : Number(frac[1]) / denom;
  }
  // Plain integer or decimal.
  if (/^[-+]?\d*\.?\d+$/.test(s)) return Number(s);
  return null;
}

/** True if any two options represent the same numeric value (e.g. 1/5 and 2/10). */
function hasDuplicateValues(options: string[]): boolean {
  const vals = options.map(optionValue);
  for (let i = 0; i < vals.length; i++) {
    for (let j = i + 1; j < vals.length; j++) {
      const a = vals[i];
      const b = vals[j];
      if (a === null || b === null) continue;
      if (Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b))) return true;
    }
  }
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await verifyBearerToken(req.headers.authorization);
    if (!session) {
      return res
        .status(401)
        .json({ error: `Unauthorized — sign in again. (${envState()})` });
    }

    const limited = checkRateLimit(session.uid, "generate-question", 15);
    if (!limited.ok) {
      return res.status(429).json({ error: "Too many requests. Try again shortly." });
    }

    // Quota enforcement must never break generation: fail open on any error.
    const quota = await consumeQuotaSafe(session.uid, "lesson_gen", FREE_LESSON_GEN_PER_DAY);
    if (!quota.ok) {
      return res.status(429).json({
        error: `You've reached today's free limit of ${quota.limit} AI-generated questions. Upgrade at /pricing for unlimited practice.`,
      });
    }

    const body = req.body ?? {};
    const lessonId = typeof body.lessonId === "string" ? body.lessonId : "";
    const lessonTitle = typeof body.lessonTitle === "string" ? body.lessonTitle : "Lesson";
    const topics = Array.isArray(body.topics) ? body.topics.map(String) : [];
    const order = typeof body.order === "number" ? body.order : 1;
    const conceptHint = typeof body.conceptHint === "string" ? body.conceptHint : undefined;

    if (!lessonId) return res.status(400).json({ error: "Missing lessonId" });

    if (!process.env.OPENAI_API_KEY?.trim()) {
      return res
        .status(503)
        .json({ error: "AI generation is not configured: OPENAI_API_KEY is missing on the server." });
    }

    type GenResult = {
      question?: string;
      options?: string[];
      correctAnswer?: number;
      concept?: string;
      kind?: string;
      explanations?: Record<string, string>;
    };

    let lastReason = "no attempt";

    // Generate, then independently verify. Only a question whose answer key
    // survives an independent solve AND has no duplicate-valued options is
    // returned — otherwise we regenerate. This prevents shipping wrong keys.
    for (let attempt = 0; attempt < MAX_GEN_ATTEMPTS; attempt++) {
      const raw = await chatCompletion(
        [
          { role: "system", content: QUESTION_GEN_SYSTEM },
          {
            role: "user",
            content: questionGenUserPrompt({ lessonTitle, topics, difficulty: order, conceptHint }),
          },
        ],
        // Lower temperature than before: we want correct math over novelty.
        { maxTokens: 1400, temperature: 0.6 },
      );

      let parsed: GenResult;
      try {
        parsed = JSON.parse(raw) as GenResult;
      } catch {
        lastReason = "unparseable JSON";
        continue;
      }

      if (
        !parsed.question ||
        !Array.isArray(parsed.options) ||
        parsed.options.length !== 4 ||
        typeof parsed.correctAnswer !== "number" ||
        parsed.correctAnswer < 0 ||
        parsed.correctAnswer > 3
      ) {
        lastReason = "invalid format";
        continue;
      }

      // Deterministic guard: reject equivalent/duplicate options (e.g. 1/5 = 2/10).
      if (hasDuplicateValues(parsed.options)) {
        lastReason = "duplicate-valued options";
        continue;
      }

      // Independent solve to confirm the answer key.
      let verdict: {
        correctIndex?: number;
        isSolvable?: boolean;
        hasDuplicateValues?: boolean;
        isAmbiguous?: boolean;
        confidence?: string;
      } = {};
      try {
        const vraw = await chatCompletion(
          [
            { role: "system", content: QUESTION_VERIFY_SYSTEM },
            {
              role: "user",
              content: questionVerifyUserPrompt({
                question: parsed.question,
                options: parsed.options,
              }),
            },
          ],
          { maxTokens: 600, temperature: 0 },
        );
        verdict = JSON.parse(vraw);
      } catch {
        lastReason = "verifier unparseable";
        continue;
      }

      const agrees =
        verdict.isSolvable === true &&
        verdict.hasDuplicateValues !== true &&
        verdict.isAmbiguous !== true &&
        verdict.confidence !== "low" &&
        verdict.correctIndex === parsed.correctAnswer;

      if (!agrees) {
        lastReason = `verifier disagreed (correctIndex=${verdict.correctIndex}, gen=${parsed.correctAnswer}, solvable=${verdict.isSolvable}, dup=${verdict.hasDuplicateValues}, ambiguous=${verdict.isAmbiguous}, conf=${verdict.confidence})`;
        continue;
      }

      const explanations = parsed.explanations ?? {};
      const question = {
        id: `ai-${lessonId}-${Date.now()}`,
        question: parsed.question,
        options: parsed.options,
        correctAnswer: parsed.correctAnswer,
        concept: parsed.concept ?? "ai-generated",
        kind: parsed.kind === "challenge" ? "challenge" : "standard",
        verified: true,
        explanations: {
          A: explanations.A ?? "",
          B: explanations.B ?? "",
          C: explanations.C ?? "",
          D: explanations.D ?? "",
        },
      };

      return res.status(200).json({ question });
    }

    // Every attempt failed verification — better to show nothing than a wrong key.
    return res.status(502).json({
      error: `Couldn't produce a verified question after ${MAX_GEN_ATTEMPTS} tries — please try again. (last: ${lastReason})`,
    });
  } catch (err) {
    console.error("generate-lesson-question fatal:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: `Generation crashed: ${msg} [${envState()}]` });
  }
}
