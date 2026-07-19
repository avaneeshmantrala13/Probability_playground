import { mulberry32 } from "../rng";
import { generateProblemOfType, toPublic } from "../math/problems";
import type { PublicProblem } from "../math/problems/types";
import { DIAGNOSTIC_TOPICS } from "./topics";

export interface DiagnosticPublicItem extends PublicProblem {
  topic: string;
  topicLabel: string;
}

/**
 * Deterministically build the diagnostic's fixed item set from a numeric run
 * seed: `itemsPerTopic` items for each of the six topics, round-robining across
 * the generator template types that back a multi-type topic. Ground truth is
 * withheld via toPublic() (the server rebuilds each item from its `seed` on
 * submission to score it — same pattern as the /solve drill).
 */
export function buildDiagnosticItems(
  runSeed: number,
  itemsPerTopic: number,
): DiagnosticPublicItem[] {
  const rng = mulberry32(runSeed >>> 0);
  const out: DiagnosticPublicItem[] = [];
  for (const topic of DIAGNOSTIC_TOPICS) {
    for (let i = 0; i < itemsPerTopic; i++) {
      const type = topic.problemTypes[i % topic.problemTypes.length];
      const inst = generateProblemOfType(type, rng);
      out.push({ ...toPublic(inst), topic: topic.id, topicLabel: topic.label });
    }
  }
  return out;
}
