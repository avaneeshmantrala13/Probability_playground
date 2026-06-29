import { auth } from "../firebase";
import { tzOffsetMinutes } from "./tz";

export async function fetchPokerBotLine(body: {
  personaName: string;
  action: string;
  street: string;
  pot: number;
  humanFoldRate?: number;
  fallback: string;
}): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const token = await user.getIdToken();
    const res = await fetch("/api/poker-bot-line", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...body, tzOffsetMinutes: tzOffsetMinutes() }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { line?: string | null };
    return data.line?.trim() || null;
  } catch {
    return null;
  }
}
