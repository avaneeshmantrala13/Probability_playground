/**
 * Client helpers for the AI Live Mock Interview. Mirrors the tutor client in
 * `src/lib/ai/client.ts`: Firebase ID token Bearer auth, POST JSON, friendly
 * error extraction.
 */
import { auth } from "../firebase";
import { tzOffsetMinutes } from "../ai/tz";
import type {
  FirmInterviewContext,
  InterviewMessage,
  InterviewPhase,
  MockInterviewFeedback,
} from "./types";

async function authHeaders(): Promise<HeadersInit> {
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in to use AI features.");
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/** Ask the interviewer for their next conversational turn. */
export async function sendMockInterviewTurn(body: {
  firmId: string;
  firm: FirmInterviewContext;
  phase: InterviewPhase;
  messages: InterviewMessage[];
}): Promise<string> {
  const res = await fetch("/api/mock-interview", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ ...body, mode: "interview", tzOffsetMinutes: tzOffsetMinutes() }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Mock interview unavailable.");
  }
  const data = (await res.json()) as { reply: string };
  return data.reply;
}

/** Request structured end-of-interview feedback. */
export async function requestMockInterviewFeedback(body: {
  firmId: string;
  firm: FirmInterviewContext;
  messages: InterviewMessage[];
}): Promise<MockInterviewFeedback> {
  const res = await fetch("/api/mock-interview", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ ...body, mode: "feedback" }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Could not generate feedback.");
  }
  const data = (await res.json()) as { feedback: MockInterviewFeedback };
  return data.feedback;
}
