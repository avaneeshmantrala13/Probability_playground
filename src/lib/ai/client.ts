import { auth } from "../firebase";

async function authHeaders(): Promise<HeadersInit> {
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in to use AI features.");
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export interface GeneratedQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  concept: string;
  kind: "standard" | "challenge";
  explanations: { A: string; B: string; C: string; D: string };
}

/**
 * Read the most useful error message off a failed response. The server returns
 * JSON `{ error }` for handled cases; on a crash/404 the body is HTML, so we
 * surface the status text instead of swallowing it behind a generic message —
 * that's the difference between "useless" and "the owner can see OPENAI_API_KEY
 * isn't set" / "you hit today's limit".
 */
async function readError(res: Response, fallback: string): Promise<string> {
  const text = await res.text().catch(() => "");
  try {
    const parsed = JSON.parse(text) as { error?: string };
    if (parsed.error) return parsed.error;
  } catch {
    // Non-JSON body (HTML error page, empty, etc.) — fall through.
  }
  if (res.status === 404) {
    return "AI service not found (the /api routes aren't deployed here).";
  }
  if (res.status >= 500) {
    return `${fallback} (server error ${res.status}). The AI service may be misconfigured.`;
  }
  return text.trim().slice(0, 200) || `${fallback} (HTTP ${res.status}).`;
}

/**
 * Ask the LLM to rephrase a question's wording for variety. Returns the reworded
 * stem, or null if the server declined (no key, quota, or any error). The CALLER
 * must verify the numbers are unchanged before using it — correctness is never
 * delegated to this call.
 */
export async function rewordQuestionStem(stem: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch("/api/reword-question", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ stem }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { question: string | null };
    return data.question ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function sendTutorMessage(body: {
  lessonTitle: string;
  questionText: string;
  options: string[];
  selectedIndex?: number | null;
  /** True once the student has submitted/checked their answer for this question. */
  answered: boolean;
  messages: { role: "user" | "assistant"; content: string }[];
}): Promise<string> {
  const res = await fetch("/api/tutor-chat", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await readError(res, "Tutor unavailable."));
  }
  const data = (await res.json()) as { reply: string };
  return data.reply;
}
