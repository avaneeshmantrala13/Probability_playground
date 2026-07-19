import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyBearerToken } from "./_lib/firebase-auth";
import { getDb } from "./_lib/admin";
import {
  generateProblem,
  toPublic,
  buildFromSeed,
} from "../src/lib/calibrationGym/math/problems";
import type { Family } from "../src/lib/calibrationGym/math/problems/types";
import {
  scoreInstance,
  type ForecastSubmission,
} from "../src/lib/calibrationGym/scoreInstance";

/**
 * Consolidated Calibration Gym endpoint (single serverless function to stay
 * under the Vercel Hobby 12-function limit). Routes by HTTP method:
 *
 *   GET  /api/gym?family=coin-flip|bayes  → generate a fresh problem with the
 *        ground truth withheld (see toPublic). No auth required.
 *   POST /api/gym  → rebuild the exact instance from its seed (truth lives only
 *        on the server), score the forecast, persist the attempt to Firestore
 *        under `calibrationAttempts/{uid}/attempts/{id}`, and return the scored
 *        result together with the now-revealed truth. Requires a Firebase token.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") return handleProblem(req, res);
  if (req.method === "POST") return handleAttempt(req, res);

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}

/**
 * Returns a freshly generated Calibration Gym problem with the ground truth
 * withheld. The deterministic `seed` travels with the payload so the POST
 * branch can rebuild the exact instance server-side and score the forecast —
 * the answer is never sent to the browser here.
 */
async function handleProblem(req: VercelRequest, res: VercelResponse) {
  try {
    const familyParam = Array.isArray(req.query.family)
      ? req.query.family[0]
      : req.query.family;
    const family: Family | undefined =
      familyParam === "coin-flip" || familyParam === "bayes"
        ? (familyParam as Family)
        : undefined;

    const inst = generateProblem({ family });
    // Never cache: each request must yield a fresh problem.
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(toPublic(inst));
  } catch (err) {
    console.error("gym/problem API error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return res.status(500).json({ error: message });
  }
}

/**
 * Body: { seed, forecastProb?, intervalLo?, intervalHi?, confidence? }
 *
 * Rebuilds the exact problem instance from its seed (ground truth lives only on
 * the server), scores the submitted forecast with the ported proper-scoring
 * engine, persists the attempt to Firestore under
 * `calibrationAttempts/{uid}/attempts/{id}` via the Admin SDK, and returns the
 * scored result together with the now-revealed truth.
 */
async function handleAttempt(req: VercelRequest, res: VercelResponse) {
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
