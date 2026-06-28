import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyBearerToken } from "./_lib/firebase-auth";
import { checkRateLimit } from "./_lib/rate-limit";
import { consumeDailyQuota } from "./_lib/usage";

/**
 * AI LIVE MOCK INTERVIEW — conversational quant interviewer.
 *
 * Mirrors the existing tutor-chat serverless pattern:
 *  - Auth via Firebase ID token Bearer (verifyBearerToken)
 *  - OPENAI_API_KEY env var (+ optional OPENAI_MODEL)
 *  - In-memory per-uid rate limit
 *  - Friendly 503 when the key is missing
 *
 * Two modes (selected by `mode` in the request body):
 *  - "interview": returns the interviewer's next conversational turn as plain
 *    text ({ reply }).
 *  - "feedback":  returns structured end-of-interview feedback as JSON
 *    ({ feedback: { score, strengths, weaknesses, whatToStudy, summary } }).
 *
 * Firm biasing: the client passes a lightweight `firm` context (name, emphasis,
 * and the firm's top competencies derived from FIRM_PROFILES weights) so this
 * function stays decoupled from the frontend `src/` tree.
 */

type Role = "user" | "assistant";

interface IncomingMessage {
  role?: string;
  content?: string;
}

interface FirmCompetency {
  label?: string;
  weight?: number;
}

interface FirmContext {
  name: string;
  emphasis: string;
  topCompetencies: { label: string; weight: number }[];
  minBarHint?: string;
}

const PHASES = ["intro", "warmup", "core", "deep", "wrapup"] as const;
type Phase = (typeof PHASES)[number];

function coercePhase(value: unknown): Phase {
  return typeof value === "string" && (PHASES as readonly string[]).includes(value)
    ? (value as Phase)
    : "intro";
}

function parseFirm(raw: unknown): FirmContext {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const name = typeof obj.name === "string" && obj.name.trim() ? obj.name.trim() : "the firm";
  const emphasis = typeof obj.emphasis === "string" ? obj.emphasis.trim() : "";
  const minBarHint = typeof obj.minBarHint === "string" ? obj.minBarHint.trim() : undefined;
  const comps = Array.isArray(obj.topCompetencies) ? (obj.topCompetencies as FirmCompetency[]) : [];
  const topCompetencies = comps
    .filter((c) => c && typeof c.label === "string")
    .slice(0, 6)
    .map((c) => ({
      label: String(c.label),
      weight: typeof c.weight === "number" && isFinite(c.weight) ? c.weight : 0,
    }));
  return { name, emphasis, topCompetencies, minBarHint };
}

const PHASE_GUIDANCE: Record<Phase, string> = {
  intro:
    "This is the very start. Greet the candidate warmly but professionally as their interviewer, set expectations briefly (a few questions, think out loud), and ask ONE opening question to warm them up. Keep it short.",
  warmup:
    "Early phase. Ask a relatively approachable question that lets the candidate build momentum. React to their last answer first.",
  core:
    "Main phase. Pose a meatier interview-style problem squarely in the firm's emphasis areas. Probe their reasoning.",
  deep:
    "Hardest phase. Push with a challenging question or an adversarial follow-up on a previous answer ('are you sure? what if the die were biased?'). Test depth and composure.",
  wrapup:
    "Final question. Ask one last question, then signal the interview is wrapping up. Do NOT give the full feedback yet — that comes separately.",
};

function buildSystemPrompt(firm: FirmContext, phase: Phase): string {
  const compLine =
    firm.topCompetencies.length > 0
      ? firm.topCompetencies
          .map((c) => `${c.label} (${Math.round(c.weight * 100)}%)`)
          .join(", ")
      : "general quant reasoning";

  return `You are a senior quantitative trader conducting a LIVE MOCK INTERVIEW at ${firm.name}. You are realistic, sharp, and personable — exactly like a real interviewer on a trading desk.

ABOUT THIS FIRM (${firm.name}):
- Emphasis: ${firm.emphasis || "rigorous quantitative reasoning under uncertainty"}.
- Weight your questions toward this firm's priorities, in rough proportion: ${compLine}.
${firm.minBarHint ? `- Bar/expectation: ${firm.minBarHint}` : ""}

HOW TO CONDUCT THE INTERVIEW:
- Ask exactly ONE question at a time. Never dump multiple questions in a single turn.
- Always react to the candidate's previous answer BEFORE moving on: acknowledge what was good, point out gaps, and probe ("Are you sure? What if the die were biased? Walk me through the EV again.").
- Give hints sparingly and only after the candidate is genuinely stuck — nudge, don't solve.
- Stay conversational and human. Short paragraphs. No headers, no bullet-point lists, no markdown tables. Talk like a person on a desk.
- Do NOT reveal a numeric grade or final feedback mid-interview; that is delivered separately at the end.

CURRENT PHASE — ${phase}: ${PHASE_GUIDANCE[phase]}

VARIETY (critical — questions must change EVERY session):
- Do NOT reuse the canonical textbook phrasing of classic problems. Reinvent them.
- Vary the surface story, the numbers, the parameters, and the framing every single time (dice ≠ always fair, coins ≠ always 0.5, change N, change payoffs, change the setting to markets/cards/sports/etc.).
- Prefer fresh scenarios over famous named puzzles. If you must touch a classic idea, disguise it with new parameters and context.

CORRECTNESS:
- If you pose a quant problem, reason about it carefully and internally before you assert anything. Only state an answer or correction you are genuinely confident is correct.
- If you are not certain of an exact value, focus your reaction on the candidate's REASONING and COMMUNICATION rather than declaring a definitive numeric verdict. Never bluff a wrong "correct answer."
- This is a conversation, not a graded answer key.

Respond with ONLY your next spoken interviewer turn as plain text.`;
}

function buildFeedbackSystemPrompt(firm: FirmContext): string {
  return `You are a senior quantitative interviewer at ${firm.name} who just finished a mock interview. Produce honest, constructive, hire-style feedback.

Base your assessment primarily on the candidate's REASONING, problem-solving approach, communication, and composure under follow-ups — not on whether every final number was exactly right. Be specific and reference what actually happened in the conversation. Be encouraging but candid; do not inflate the score.

Output ONLY valid JSON matching this exact schema (no markdown, no extra keys):
{
  "score": 7,
  "strengths": ["short specific point", "..."],
  "weaknesses": ["short specific point", "..."],
  "whatToStudy": ["actionable study item tied to ${firm.name}'s emphasis", "..."],
  "summary": "2-4 sentence overall verdict written directly to the candidate."
}

Rules:
- "score" is an integer from 1 to 10 (overall interview performance).
- 2-5 items each for strengths, weaknesses, and whatToStudy.
- Tie at least one study item to this firm's priorities (${
    firm.topCompetencies.map((c) => c.label).join(", ") || "core quant skills"
  }).
- No markdown inside any string.`;
}

/**
 * Heuristic: does this interviewer turn make a DEFINITIVE mathematical claim
 * (a specific value or a correctness verdict) worth double-checking? Kept
 * conservative so we only spend the extra call when there's real risk of the
 * model bluffing a wrong number.
 */
function looksAssertive(text: string): boolean {
  return /(the\s+(correct\s+)?answer\s+is|that'?s\s+(correct|right|wrong)|probability\s+is|expected\s+value\s+is|\bEV\b\s+(is|=)|equals|=\s*-?\d|\b\d+\s*\/\s*\d+\b|\b\d+(\.\d+)?\s*%)/i.test(
    text,
  );
}

/**
 * Second-pass self-check. Re-reads the interviewer's drafted turn with a
 * meticulous checker and fixes any incorrect definitive math while preserving
 * tone. Fails OPEN (returns the original) on any error so the interview never
 * breaks because of the checker.
 */
async function selfCheckTurn(
  apiKey: string,
  model: string,
  draft: string,
): Promise<string> {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        max_tokens: 800,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a meticulous quant fact-checker. You are given one interviewer message from a mock interview. If it makes a DEFINITIVE mathematical claim (a specific numeric answer, probability, EV, or a 'that's correct/wrong' verdict) that is actually INCORRECT, rewrite the message to fix ONLY the math, preserving the interviewer's tone, brevity, and the fact that it should not over-explain. If the math is correct, or the message makes no definitive claim, return it unchanged. Never introduce new questions. Output ONLY JSON: {\"revised\": \"<the message>\"}.",
          },
          { role: "user", content: draft },
        ],
      }),
    });
    if (!res.ok) return draft;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) return draft;
    const parsed = JSON.parse(raw) as { revised?: unknown };
    return typeof parsed.revised === "string" && parsed.revised.trim()
      ? parsed.revised.trim()
      : draft;
  } catch {
    return draft;
  }
}

function cleanHistory(messages: IncomingMessage[]): { role: Role; content: string }[] {
  return messages
    .filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") && typeof m.content === "string",
    )
    .slice(-24)
    .map((m) => ({
      role: m.role as Role,
      content: String(m.content).slice(0, 4000),
    }));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await verifyBearerToken(req.headers.authorization);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const limited = checkRateLimit(session.uid, "mock-interview", 30);
  if (!limited.ok) {
    return res.status(429).json({ error: "Too many requests. Try again shortly." });
  }

  const body = req.body ?? {};
  const firmId = typeof body.firmId === "string" ? body.firmId : "";
  const mode = body.mode === "feedback" ? "feedback" : "interview";
  const phase = coercePhase(body.phase);
  const firm = parseFirm(body.firm);
  const messages = cleanHistory(Array.isArray(body.messages) ? body.messages : []);

  if (!firmId) return res.status(400).json({ error: "Missing firmId" });

  // Defense-in-depth daily cap (mocks are also plan-gated in the UI). Count one
  // unit per interview by metering only the opening turn; feedback + follow-up
  // turns of an in-progress interview are not re-charged.
  if (mode === "interview" && messages.length === 0) {
    const quota = await consumeDailyQuota(session.uid, "mock", { freeLimit: 1 });
    if (!quota.ok) {
      return res.status(429).json({
        error: `Live mock interviews aren't included on the free plan. Upgrade at /pricing to run unlimited mocks.`,
      });
    }
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      return res
        .status(503)
        .json({ error: "AI mock interview is not configured (OPENAI_API_KEY)." });
    }

    const model = process.env.OPENAI_MODEL?.trim() ?? "gpt-4o-mini";

    if (mode === "feedback") {
      const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          max_tokens: 1200,
          temperature: 0.5,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: buildFeedbackSystemPrompt(firm) },
            {
              role: "system",
              content:
                "The full interview transcript follows as the conversation history. The candidate is the 'user'; you (the interviewer) are the 'assistant'. Now write the feedback JSON.",
            },
            ...messages,
            {
              role: "user",
              content: "The interview is over. Please return my structured feedback now.",
            },
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
      const raw = data.choices?.[0]?.message?.content?.trim();
      if (!raw) return res.status(502).json({ error: "Empty feedback response" });

      let parsed: {
        score?: number;
        strengths?: unknown;
        weaknesses?: unknown;
        whatToStudy?: unknown;
        summary?: unknown;
      };
      try {
        parsed = JSON.parse(raw);
      } catch {
        return res.status(502).json({ error: "Invalid feedback format from AI" });
      }

      const toStringArray = (v: unknown): string[] =>
        Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean).slice(0, 6) : [];
      const rawScore = typeof parsed.score === "number" ? parsed.score : 5;
      const score = Math.max(1, Math.min(10, Math.round(rawScore)));

      const feedback = {
        score,
        strengths: toStringArray(parsed.strengths),
        weaknesses: toStringArray(parsed.weaknesses),
        whatToStudy: toStringArray(parsed.whatToStudy),
        summary:
          typeof parsed.summary === "string" && parsed.summary.trim()
            ? parsed.summary.trim()
            : "Solid effort — keep practicing the firm's core areas.",
      };

      return res.status(200).json({ feedback });
    }

    // mode === "interview"
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 700,
        // High temperature + presence/frequency penalties push question variety.
        temperature: 0.95,
        presence_penalty: 0.6,
        frequency_penalty: 0.3,
        messages: [
          { role: "system", content: buildSystemPrompt(firm, phase) },
          ...messages,
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
    if (!reply) return res.status(502).json({ error: "Empty interviewer response" });

    // Second-pass self-check: only when the turn asserts definitive math, and
    // only mid-interview (the intro turn has no answer to verify).
    const finalReply =
      messages.length > 0 && looksAssertive(reply)
        ? await selfCheckTurn(apiKey, model, reply)
        : reply;

    return res.status(200).json({ reply: finalReply, phase });
  } catch (err) {
    console.error("mock-interview error:", err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Mock interview error",
    });
  }
}
