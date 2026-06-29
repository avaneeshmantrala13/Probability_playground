import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyBearerToken } from "./_lib/firebase-auth.js";
import { checkRateLimit } from "./_lib/rate-limit.js";
import { consumeQuotaSafe } from "./_lib/quota.js";

// Core gameplay flavor — keep the free cap generous so the table never goes
// quiet. On block we degrade to the client fallback line (no hard 429).
const FREE_POKER_LINES_PER_DAY = 200;

const POKER_BOT_SYSTEM = `You write ONE short in-character poker table line (max 18 words).

Rules:
- Stay in character for the given persona name and style.
- Reference the action (fold/check/call/bet/raise/all-in) naturally.
- May lightly reference pot size or street if provided — never invent hole cards.
- No slurs, no real-money gambling advice, no markdown.
- Output ONLY the spoken line, no quotes.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await verifyBearerToken(req.headers.authorization);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const limited = checkRateLimit(session.uid, "poker-bot-line", 40);
  if (!limited.ok) {
    return res.status(429).json({ error: "Too many requests. Try again shortly." });
  }

  const body = req.body ?? {};
  const personaName = typeof body.personaName === "string" ? body.personaName : "Bot";
  const action = typeof body.action === "string" ? body.action : "check";
  const street = typeof body.street === "string" ? body.street : "preflop";
  const pot = typeof body.pot === "number" ? body.pot : 0;
  const humanFoldRate =
    typeof body.humanFoldRate === "number" ? body.humanFoldRate : undefined;
  const fallback = typeof body.fallback === "string" ? body.fallback : "";

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return res.status(200).json({ line: fallback || null });
  }

  const quota = await consumeQuotaSafe(session.uid, "poker_line", FREE_POKER_LINES_PER_DAY);
  if (!quota.ok) {
    return res.status(200).json({ line: fallback || null });
  }

  const userPrompt = [
    `Persona: ${personaName}`,
    `Action: ${action}`,
    `Street: ${street}`,
    `Pot chips: ${pot}`,
    humanFoldRate != null
      ? `Human has folded ${Math.round(humanFoldRate * 100)}% of faced bets this session — bots may exploit tightness in tone only.`
      : "",
    fallback ? `Fallback tone reference: ${fallback}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const model = process.env.OPENAI_MODEL?.trim() ?? "gpt-4o-mini";
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 60,
        temperature: 0.85,
        messages: [
          { role: "system", content: POKER_BOT_SYSTEM },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!openaiRes.ok) {
      return res.status(200).json({ line: fallback || null });
    }

    const data = (await openaiRes.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const line = data.choices?.[0]?.message?.content?.trim().replace(/^["']|["']$/g, "");
    if (!line) return res.status(200).json({ line: fallback || null });

    return res.status(200).json({ line: line.slice(0, 120) });
  } catch (err) {
    console.error("poker-bot-line error:", err);
    return res.status(200).json({ line: fallback || null });
  }
}
