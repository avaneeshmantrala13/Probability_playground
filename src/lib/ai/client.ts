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

export async function fetchGeneratedQuestion(body: {
  lessonId: string;
  lessonTitle: string;
  topics: string[];
  order: number;
  conceptHint?: string;
}): Promise<GeneratedQuestion> {
  const res = await fetch("/api/generate-lesson-question", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Could not generate question.");
  }
  const data = (await res.json()) as { question: GeneratedQuestion };
  return data.question;
}

export async function sendTutorMessage(body: {
  lessonTitle: string;
  questionText: string;
  options: string[];
  selectedIndex?: number | null;
  messages: { role: "user" | "assistant"; content: string }[];
}): Promise<string> {
  const res = await fetch("/api/tutor-chat", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Tutor unavailable.");
  }
  const data = (await res.json()) as { reply: string };
  return data.reply;
}
