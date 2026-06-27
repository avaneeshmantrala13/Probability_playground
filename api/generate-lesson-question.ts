import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyBearerToken } from "./_lib/firebase-auth";
import { chatCompletion } from "./_lib/openai";
import { checkRateLimit } from "./_lib/rate-limit";
import { QUESTION_GEN_SYSTEM, questionGenUserPrompt } from "./_lib/prompts";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await verifyBearerToken(req.headers.authorization);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const limited = checkRateLimit(session.uid, "generate-question", 15);
  if (!limited.ok) {
    return res.status(429).json({ error: "Too many requests. Try again shortly." });
  }

  const body = req.body ?? {};
  const lessonId = typeof body.lessonId === "string" ? body.lessonId : "";
  const lessonTitle = typeof body.lessonTitle === "string" ? body.lessonTitle : "Lesson";
  const topics = Array.isArray(body.topics) ? body.topics.map(String) : [];
  const order = typeof body.order === "number" ? body.order : 1;
  const conceptHint = typeof body.conceptHint === "string" ? body.conceptHint : undefined;

  if (!lessonId) return res.status(400).json({ error: "Missing lessonId" });

  try {
    if (!process.env.OPENAI_API_KEY?.trim()) {
      return res.status(503).json({ error: "AI generation is not configured (OPENAI_API_KEY)." });
    }

    const raw = await chatCompletion(
      [
        { role: "system", content: QUESTION_GEN_SYSTEM },
        {
          role: "user",
          content: questionGenUserPrompt({ lessonTitle, topics, difficulty: order, conceptHint }),
        },
      ],
      { maxTokens: 1400, temperature: 0.85 },
    );

    const parsed = JSON.parse(raw) as {
      question?: string;
      options?: string[];
      correctAnswer?: number;
      concept?: string;
      kind?: string;
      explanations?: Record<string, string>;
    };

    if (
      !parsed.question ||
      !Array.isArray(parsed.options) ||
      parsed.options.length !== 4 ||
      typeof parsed.correctAnswer !== "number" ||
      parsed.correctAnswer < 0 ||
      parsed.correctAnswer > 3
    ) {
      return res.status(502).json({ error: "Invalid question format from AI" });
    }

    const explanations = parsed.explanations ?? {};
    const question = {
      id: `ai-${lessonId}-${Date.now()}`,
      question: parsed.question,
      options: parsed.options,
      correctAnswer: parsed.correctAnswer,
      concept: parsed.concept ?? "ai-generated",
      kind: parsed.kind === "challenge" ? "challenge" : "standard",
      explanations: {
        A: explanations.A ?? "",
        B: explanations.B ?? "",
        C: explanations.C ?? "",
        D: explanations.D ?? "",
      },
    };

    return res.status(200).json({ question });
  } catch (err) {
    console.error("generate-lesson-question error:", err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Generation failed",
    });
  }
}
