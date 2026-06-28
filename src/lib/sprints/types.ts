/**
 * Type model for the guided "Sprint Program" layered on top of the one-time
 * Interview Sprint products (see src/lib/billing/plans.ts). Everything here is
 * plain data: the curriculum is a deterministic, pure function of the sprint
 * length (and optional target firm), so it can be rendered identically on the
 * client without any randomness or server round-trips.
 */

import type { Competency } from "../firms/profiles";
import type { SprintId } from "../billing/plans";

/** Supported program lengths, in days. Mirrors the SPRINTS durations. */
export type SprintLength = 7 | 14 | 28;

/** The four phases a program ramps through, in order. */
export type SprintPhase = "fundamentals" | "practice" | "mocks" | "review";

/** What kind of action a single task points the user at. */
export type SprintTaskKind =
  | "lesson"
  | "pokerTheory"
  | "marketMaking"
  | "practice"
  | "mentalMath"
  | "mockInterview"
  | "review"
  | "readiness";

/** A single concrete to-do within a day, always linking to a real route. */
export interface SprintTask {
  /** Stable id, unique within its day (used as a React key). */
  id: string;
  kind: SprintTaskKind;
  /** Short imperative label, e.g. "Lesson: Random Variables & Expectation". */
  label: string;
  /** Optional one-line "why this matters" hint. */
  detail?: string;
  /** In-app route this task opens. */
  route: string;
  /** Competency this task primarily trains (used for progress + weighting). */
  competency?: Competency;
  /** Rough time budget so a day never feels overwhelming. */
  estMinutes: number;
  /**
   * For lesson-style tasks, the underlying lesson id. Lets the dashboard mark a
   * task complete from the user's real lessonMastery, with no extra storage.
   */
  lessonId?: string;
  /** For mock-interview tasks, the firm the mock targets. */
  firmId?: string;
}

/** One day of the program. */
export interface SprintDay {
  /** 1-based day number within the program. */
  day: number;
  phase: SprintPhase;
  /** Short headline for the day, e.g. "Foundations: Probability". */
  focus: string;
  tasks: SprintTask[];
}

/** A fully-built day-by-day program. */
export interface SprintCurriculum {
  length: SprintLength;
  /** Present only for the firm-focused sprint. */
  firmId?: string;
  firmName?: string;
  days: SprintDay[];
  /** Inclusive day ranges per phase, for headers/progress segmentation. */
  phaseRanges: Record<SprintPhase, { startDay: number; endDay: number }>;
}

/**
 * The read-only fields the Sprint experience consumes from courseProgress. The
 * `plan` / `planExpiresAt` pair is written solely by the Stripe webhook; the
 * `sprint*` fields are optional refinements the orchestrator MAY add later to
 * make day-derivation exact (see deriveSprintState for the fallback).
 */
export interface SprintProgressLike {
  plan?: string | null;
  planExpiresAt?: number | null;
  /** Which sprint product was purchased (disambiguates from a subscription). */
  sprintId?: SprintId | null;
  /** Epoch ms the sprint began (defaults to expiry − duration when absent). */
  sprintStartedAt?: number | null;
  /** Target firm id for the firm-focused sprint. */
  sprintTargetFirmId?: string | null;
}

/** Live state of a user's active (or just-finished) sprint. */
export interface SprintState {
  sprintId: SprintId;
  length: SprintLength;
  /** Epoch ms boundaries of the program. */
  startedAt: number;
  expiresAt: number;
  /** The "now" used to derive the state (injectable for tests). */
  now: number;
  /** 1-based day the user is on, clamped to [1, length]. */
  currentDay: number;
  totalDays: number;
  /** Whole days of access left (0 once finished). */
  daysRemaining: number;
  /** Milliseconds until access lapses (0 once finished). */
  msRemaining: number;
  /** True once now ≥ expiresAt — time to read the final report. */
  isComplete: boolean;
  /** Target firm for the firm-focused sprint, if any. */
  firmId?: string;
  /**
   * True when the sprint length/start had to be inferred from planExpiresAt
   * alone (no explicit sprintId/sprintStartedAt stored yet).
   */
  inferred: boolean;
}
