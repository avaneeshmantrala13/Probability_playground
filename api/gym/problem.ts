import type { VercelRequest, VercelResponse } from "@vercel/node";
import { generateProblem, toPublic } from "../../src/lib/calibrationGym/math/problems";
import type { Family } from "../../src/lib/calibrationGym/math/problems/types";

/**
 * GET /api/gym/problem?family=coin-flip|bayes
 *
 * Returns a freshly generated Calibration Gym problem with the ground truth
 * withheld (see toPublic). The deterministic `seed` travels with the payload so
 * the /api/gym/attempt endpoint can rebuild the exact instance server-side and
 * score the forecast — the answer is never sent to the browser here.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

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
