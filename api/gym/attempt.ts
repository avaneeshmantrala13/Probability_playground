import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyBearerToken } from "../_lib/firebase-auth";
import { getDb } from "../_lib/admin";
import { buildFromSeed } from "../../src/lib/calibrationGym/math/problems";
import {
  scoreInstance,
  type ForecastSubmission,
} from "../../src/lib/calibrationGym/scoreInstance";

/**
 * POST /api/gym/attempt
 * Body: { seed, forecastProb?, intervalLo?, intervalHi?, confidence? }
 *
 * Rebuilds the exact problem instance from its seed (ground truth lives only on
 * the server), scores the submitted forecast with the ported proper-scoring
 * engine, persists the attempt to Firestore under
 * `calibrationAttempts/{uid}/attempts/{id}` via the Admin SDK, and returns the
 * scored result together with the now-revealed truth.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Firestore (Admin) must be configured for us to authenticate and persist.
  const db = getDb();
  if (!db) {
    return res.status(503).json({
      error: "Calibration Gym is unavailable — Firebase Admin is not configured.",
    });
  }

  // Require a valid Firebase ID token — attempts are owned by the signed-in user.
  const auth = await verifyBearerToken(req.headers.authorization);
  if (!auth) {
    return res.status(401).json({ error: "Missing or invalid auth token" });
  }
  const { uid } = auth;

  const body = (req.body ?? {}) as {
    seed?: unknown;
    forecastProb?: unknown;
    intervalLo?: unknown;
    intervalHi?: unknown;
    confidence?: unknown;
  };

  const seed = typeof body.seed === "string" ? body.seed : null;
  if (!seed) return res.status(400).json({ error: "missing seed" });

  let inst;
  try {
    inst = buildFromSeed(seed);
  } catch (e) {
    return res.status(400).json({ error: (e as Error).message });
  }

  const submission: ForecastSubmission = {
    forecastProb:
      typeof body.forecastProb === "number" ? body.forecastProb : undefined,
    intervalLo: typeof body.intervalLo === "number" ? body.intervalLo : undefined,
    intervalHi: typeof body.intervalHi === "number" ? body.intervalHi : undefined,
    confidence: typeof body.confidence === "number" ? body.confidence : undefined,
  };

  const scored = scoreInstance(inst, submission);

  try {
    await db
      .collection("calibrationAttempts")
      .doc(uid)
      .collection("attempts")
      .add({
        uid,
        family: inst.family,
        problemType: inst.problemType,
        mode: inst.mode,
        prompt: inst.prompt,
        seed: inst.seed,
        truthValue: inst.truthValue,
        truthDecimal: inst.truthDecimal,
        resolvesTrue: inst.resolvesTrue ?? null,
        threshold: inst.threshold ?? null,
        forecastProb: submission.forecastProb ?? null,
        intervalLo: submission.intervalLo ?? null,
        intervalHi: submission.intervalHi ?? null,
        confidence: submission.confidence ?? null,
        brier: scored.brier,
        logLoss: scored.logLoss,
        winkler: scored.winkler,
        covered: scored.covered,
        outcome: scored.outcome,
        createdAt: new Date(),
      });
  } catch (err) {
    console.error("gym/attempt persist error:", err);
    // Scoring still succeeded — surface the result but note the persistence gap.
    return res.status(500).json({ error: "Failed to save attempt" });
  }

  return res.status(200).json({
    scored,
    truth: {
      mode: inst.mode,
      truthValue: inst.truthValue,
      truthDecimal: inst.truthDecimal,
      resolvesTrue: inst.resolvesTrue ?? null,
      threshold: inst.threshold ?? null,
      proposition: inst.proposition ?? null,
      unit: inst.unit ?? null,
      explanation: inst.explanation,
    },
  });
}
