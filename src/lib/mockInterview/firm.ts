/**
 * Builds the serializable firm interview context from the authoritative
 * FIRM_PROFILES data. The interview emphasizes topics in proportion to each
 * firm's competency weights (e.g. Optiver → mental math + market making,
 * Jane Street → probability + brainteasers).
 */
import {
  COMPETENCY_LABELS,
  FIRM_PROFILES,
  getFirmProfile,
  type Competency,
  type FirmProfile,
} from "../firms/profiles";
import type { FirmInterviewContext } from "./types";

/** Number of top competencies to surface to the interviewer prompt. */
const TOP_N = 5;

/** Convert a full FirmProfile into the lightweight context sent to the API. */
export function toFirmInterviewContext(profile: FirmProfile): FirmInterviewContext {
  const topCompetencies = (Object.entries(profile.weights) as [Competency, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_N)
    .map(([key, weight]) => ({ label: COMPETENCY_LABELS[key], weight }));

  return {
    id: profile.id,
    name: profile.name,
    emphasis: profile.emphasis,
    minBarHint: profile.minBarHint,
    topCompetencies,
  };
}

/** Look up a firm by id and build its interview context, if it exists. */
export function getFirmInterviewContext(firmId: string): FirmInterviewContext | undefined {
  const profile = getFirmProfile(firmId);
  return profile ? toFirmInterviewContext(profile) : undefined;
}

/** All firms available for a mock interview (mirrors FIRM_PROFILES order). */
export const INTERVIEW_FIRMS: FirmProfile[] = FIRM_PROFILES;
