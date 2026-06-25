import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  currentDateKey,
  dailyWindowExpiresAt,
  verifyDailyPassword,
} from "../src/lib/dailyPassword";

const secret = process.env.DAILY_PASSWORD_SECRET ?? "";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!secret) {
    return res.status(503).json({ error: "Daily password not configured. Set DAILY_PASSWORD_SECRET." });
  }

  const { password } = req.body as { password?: string };
  if (!password || typeof password !== "string") {
    return res.status(400).json({ error: "Missing password" });
  }

  const ok = verifyDailyPassword(password, secret);
  if (!ok) {
    return res.status(401).json({ error: "Incorrect password" });
  }

  const dateKey = currentDateKey();
  return res.status(200).json({
    ok: true,
    dateKey,
    expiresAt: dailyWindowExpiresAt(),
  });
}
