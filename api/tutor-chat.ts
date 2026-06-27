import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyBearerToken } from "./_lib/firebase-auth";
import { chatCompletion } from "./_lib/openai";
import { checkRateLimit } from "./_lib/rate-limit";
import { QUANT_TUTOR_SYSTEM } from "./_lib/prompts";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await verifyBearerToken(req.headers.authorization);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const limited = checkRateLimit(session.uid, "tutor-chat", 20);
  if (!limited.ok) {
    return res.status(429).json({ error: "Too many requests. Try again shortly." });
  }

  const body = req.body ?? {};
  const lessonTitle = typeof body.lessonTitle === "string" ? body.lessonTitle : "Lesson";
  const questionText = typeof body.questionText === "string" ? body.questionText : "";
  const options = Array.isArray(body.options) ? body.options.map(String) : [];
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const selectedIndex =
    typeof body.selectedIndex === "number" ? body.selectedIndex : null;

  if (!questionText || options.length < 2) {
    return res.status(400).json({ error: "Missing question context" });
  }

  const contextBlock = [
    `Current lesson: ${lessonTitle}`,
    `Question: ${questionText}`,
    `Options:`,
    ...options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`),
    selectedIndex != null
      ? `Student selected: ${String.fromCharCode(65 + selectedIndex)}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      return res.status(503).json({ error: "AI tutor is not configured (OPENAI_API_KEY)." });
    }

    const model = process.env.OPENAI_MODEL?.trim() ?? "gpt-4o-mini";
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
        ],
      }),
    });

    if (!openaiRes.ok) {
      const text = await openaiRes.text();
      return res.status(502).json({ error: text.slice(0, 200) });
    }

    const data = (await openaiRes.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) return res.status(502).json({ error: "Empty tutor response" });

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("tutor-chat error:", err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Tutor error",
    });
  }
}
