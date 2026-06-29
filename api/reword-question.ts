import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyBearerToken } from "./_lib/firebase-auth.js";
import { chatCompletion } from "./_lib/openai.js";
import { checkRateLimit } from "./_lib/rate-limit.js";
import { consumeQuotaSafe } from "./_lib/quota.js";
import { REWORD_QUESTION_SYSTEM } from "./_lib/prompts.js";

// Generous daily cap — rewording is cheap and purely cosmetic.
const FREE_REWORD_PER_DAY = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await verifyBearerToken(req.headers.authorization);
    if (!session) return res.status(401).json({ error: "Unauthorized — sign in again." });

    const limited = checkRateLimit(session.uid, "reword-question", 30);
    if (!limited.ok) {
      return res.status(429).json({ error: "Too many requests. Try again shortly." });
    }

    const quota = await consumeQuotaSafe(session.uid, "reword", FREE_REWORD_PER_DAY);
    if (!quota.ok) {
      // Rewording is optional flavor — never block practice; just signal no-op.
      return res.status(200).json({ question: null });
    }

    const body = req.body ?? {};
    const stem = typeof body.stem === "string" ? body.stem.trim() : "";
    if (!stem) return res.status(400).json({ error: "Missing stem" });
    if (stem.length > 800) return res.status(400).json({ error: "Stem too long" });

    if (!process.env.OPENAI_API_KEY?.trim()) {
      // No key configured — return null so the client keeps the code wording.
      return res.status(200).json({ question: null });
    }

    const raw = await chatCompletion(
      [
        { role: "system", content: REWORD_QUESTION_SYSTEM },
        { role: "user", content: stem },
      ],
      { maxTokens: 400, temperature: 0.7 },
    );

    let reworded: string | null = null;
    try {
      const parsed = JSON.parse(raw) as { question?: string };
      reworded = typeof parsed.question === "string" ? parsed.question.trim() : null;
    } catch {
      reworded = null;
    }

    return res.status(200).json({ question: reworded || null });
  } catch (err) {
    // Rewording must never break practice — fail soft to the original wording.
    console.error("reword-question error:", err);
    return res.status(200).json({ question: null });
  }
}
