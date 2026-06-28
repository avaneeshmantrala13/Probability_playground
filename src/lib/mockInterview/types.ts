/**
 * Types for the AI Live Mock Interview feature.
 *
 * Chat-based today, but the shapes here intentionally leave room for a future
 * video panel (see `InterviewMode`) without breaking the API contract.
 */

/** Ordered phases the interview moves through. */
export const INTERVIEW_PHASES = ["intro", "warmup", "core", "deep", "wrapup"] as const;
export type InterviewPhase = (typeof INTERVIEW_PHASES)[number];

/** Human-readable labels + blurbs for the progress indicator. */
export const PHASE_META: Record<InterviewPhase, { label: string; hint: string }> = {
  intro: { label: "Intro", hint: "Warming up" },
  warmup: { label: "Warm-up", hint: "Getting started" },
  core: { label: "Core", hint: "Main questions" },
  deep: { label: "Deep dive", hint: "Pressure & follow-ups" },
  wrapup: { label: "Wrap-up", hint: "Final question" },
};

/** A single chat turn in the interview. */
export interface InterviewMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Lightweight, serializable firm context sent to the API. Derived from
 * FIRM_PROFILES on the client so the serverless function stays decoupled from
 * the `src/` tree.
 */
export interface FirmInterviewContext {
  id: string;
  name: string;
  emphasis: string;
  minBarHint?: string;
  /** Firm's highest-weighted competencies, ranked, used to bias topics. */
  topCompetencies: { label: string; weight: number }[];
}

/** Structured end-of-interview feedback returned by the API. */
export interface MockInterviewFeedback {
  /** 1-10 overall performance. */
  score: number;
  strengths: string[];
  weaknesses: string[];
  whatToStudy: string[];
  summary: string;
}

/**
 * Interview delivery mode. Only "chat" is implemented today; "video" is
 * reserved so the UI/types can grow a video panel later without churn.
 */
export type InterviewMode = "chat" | "video";

/** Request body for an interviewer conversational turn. */
export interface InterviewTurnRequest {
  firmId: string;
  firm: FirmInterviewContext;
  phase: InterviewPhase;
  messages: InterviewMessage[];
}

/** Request body for the final feedback call. */
export interface InterviewFeedbackRequest {
  firmId: string;
  firm: FirmInterviewContext;
  messages: InterviewMessage[];
}
