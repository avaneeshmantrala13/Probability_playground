import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyBearerToken } from "./_lib/firebase-auth.js";
import { checkRateLimit } from "./_lib/rate-limit.js";
import { consumeQuotaSafe } from "./_lib/quota.js";
import { QUANT_TUTOR_SYSTEM, tutorStateInstruction } from "./_lib/prompts.js";

// Mirrors src/lib/billing/plans.ts FREE_LIMITS.aiTutorPerDay (api bundles separately).
const FREE_TUTOR_PER_DAY = 5;

/** Non-sensitive snapshot of which server env vars are present (booleans only). */
function envState(): string {
  const openai = Boolean(process.env.OPENAI_API_KEY?.trim());
  const admin = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim());
  return `env: OPENAI_API_KEY=${openai ? "set" : "MISSING"}, FIREBASE_SERVICE_ACCOUNT_JSON=${admin ? "set" : "MISSING"}`;
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

    const limited = checkRateLimit(session.uid, "tutor-chat", 20);
    if (!limited.ok) {
      return res.status(429).json({ error: "Too many requests. Try again shortly." });
    }

    // Quota enforcement must never break tutoring: fail open on any error.
    const quota = await consumeQuotaSafe(session.uid, "tutor", FREE_TUTOR_PER_DAY);
    if (!quota.ok) {
      return res.status(429).json({
        error: `You've hit today's free AI tutor limit (${quota.limit}/day). Upgrade at /pricing for unlimited tutoring.`,
      });
    }

    const body = req.body ?? {};
    const lessonTitle = typeof body.lessonTitle === "string" ? body.lessonTitle : "Lesson";
    const questionText = typeof body.questionText === "string" ? body.questionText : "";
    const options = Array.isArray(body.options) ? body.options.map(String) : [];
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const selectedIndex =
      typeof body.selectedIndex === "number" ? body.selectedIndex : null;
    // Whether the student has submitted/checked their answer for this question.
    // Defaults to false (most restrictive) so a missing flag never leaks answers.
    const answered = body.answered === true;

    if (!questionText || options.length < 2) {
      return res.status(400).json({ error: "Missing question context" });
    }

    const contextBlock = [
      `Current lesson: ${lessonTitle}`,
      `Question: ${questionText}`,
      `Options:`,
      ...options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`),
      // Only surface the student's selection once they've committed to it.
      answered && selectedIndex != null
        ? `Student selected: ${String.fromCharCode(65 + selectedIndex)}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      return res
        .status(503)
        .json({ error: "AI tutor is not configured: OPENAI_API_KEY is missing on the server." });
    }

    const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 900,
        temperature: 0.65,
        messages: [
          { role: "system", content: QUANT_TUTOR_SYSTEM },
          {
            role: "system",
            content: `Problem context:\n${contextBlock}`,
          },
          ...messages
            .filter(
              (m: { role?: string; content?: string }) =>
                (m.role === "user" || m.role === "assistant") && typeof m.content === "string",
            )
            .slice(-12)
            .map((m: { role: string; content: string }) => ({
              role: m.role as "user" | "assistant",
              content: m.content.slice(0, 2000),
            })),
          // Placed LAST so the gate is the most recent instruction the model sees.
          { role: "system", content: tutorStateInstruction(answered) },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const text = await openaiRes.text();
      return res
        .status(502)
        .json({ error: `OpenAI rejected the request (${openaiRes.status}): ${text.slice(0, 200)}` });
    }

    const data = (await openaiRes.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) return res.status(502).json({ error: "Empty tutor response" });

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("tutor-chat fatal:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: `Tutor crashed: ${msg} [${envState()}]` });
  }
}
