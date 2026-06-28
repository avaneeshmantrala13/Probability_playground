/**
 * Public surface for the Sprint Program: the day-by-day curriculum, the live
 * state derived from a user's billing entitlement, and progress helpers. All
 * pure and deterministic.
 */

export * from "./types";
export { buildSprintCurriculum, countCurriculumTasks } from "./curriculum";
export { deriveSprintState, hasSprint } from "./state";
export {
  isTaskTrackable,
  isTaskComplete,
  computeSprintProgress,
  collectMockTasks,
  type SprintProgressSummary,
} from "./progress";

import { buildSprintCurriculum } from "./curriculum";
import type { SprintCurriculum, SprintState } from "./types";

/** Build the curriculum that matches a derived sprint state (length + firm). */
export function curriculumForState(state: SprintState): SprintCurriculum {
  return buildSprintCurriculum(state.length, { firmId: state.firmId });
}
