/**
 * Deterministic day-by-day curriculum builder for the Sprint Program.
 *
 * Given a program length (7 / 14 / 28 days) and an optional target firm, this
 * produces a fixed schedule of concrete, route-linked tasks. It is a PURE
 * function of its inputs — no Date, no Math.random — so the same sprint always
 * yields the same plan, and a firm-focused sprint reorders/weights the work
 * using that firm's published competency emphasis (FIRM_PROFILES weights).
 *
 * The 4-week plan ramps fundamentals → practice → mocks → final review; shorter
 * sprints keep only the highest-yield slice of the same backbone.
 */

import { getLesson } from "../../content";
import { getPokerTheoryLesson } from "../../content/pokerTheory";
import { getMarketMakingLesson } from "../../content/marketMakingLessons";
import {
  COMPETENCY_LABELS,
  getFirmProfile,
  type Competency,
} from "../firms/profiles";
import type {
  SprintCurriculum,
  SprintDay,
  SprintLength,
  SprintPhase,
  SprintTask,
} from "./types";

/** Lesson ids that ship a practice bank, so practice tasks always resolve. */
const PRACTICE_BANK_IDS = new Set<string>([
  "lesson_1",
  "lesson_2",
  "lesson_3",
  "lesson_4",
  "lesson_5",
  "lesson_6",
  "lesson_7",
  "lesson_8",
  "lesson_9",
  "lesson_10",
  "lesson_11",
  "lesson_12",
  "lesson_13",
  "lesson_14",
  "lesson_15",
  "lesson_16",
  "lesson_17",
  "lesson_18",
  "mm_bid_ask",
  "mm_spread",
  "mm_fair_value",
  "mm_inventory",
  "mm_partial_info",
  "mm_interview",
  "pt_fundamentals",
  "pt_hand_rankings",
  "pt_pot_odds",
  "pt_position",
  "pt_ranges",
  "pt_bluffing",
  "pt_postflop",
]);

interface LearningUnit {
  kind: "lesson" | "pokerTheory" | "marketMaking";
  lessonId: string;
  competency: Competency;
  /** Natural phase placement: foundations first, then deeper practice. */
  phase: "fundamentals" | "practice";
}

/**
 * The pedagogical backbone, in natural learning order. Firm-focused sprints
 * re-sort this by the firm's competency weights (within each phase) so the
 * desk's headline skills are front-loaded.
 */
const LEARNING_BACKBONE: LearningUnit[] = [
  { kind: "lesson", lessonId: "lesson_1", competency: "probability", phase: "fundamentals" },
  { kind: "lesson", lessonId: "lesson_2", competency: "combinatorics", phase: "fundamentals" },
  { kind: "lesson", lessonId: "lesson_3", competency: "probability", phase: "fundamentals" },
  { kind: "lesson", lessonId: "lesson_4", competency: "expectedValue", phase: "fundamentals" },
  { kind: "lesson", lessonId: "lesson_5", competency: "probability", phase: "fundamentals" },
  { kind: "marketMaking", lessonId: "mm_bid_ask", competency: "marketMaking", phase: "fundamentals" },
  { kind: "pokerTheory", lessonId: "pt_fundamentals", competency: "pokerTheory", phase: "fundamentals" },
  { kind: "lesson", lessonId: "lesson_6", competency: "statistics", phase: "fundamentals" },

  { kind: "lesson", lessonId: "lesson_7", competency: "statistics", phase: "practice" },
  { kind: "lesson", lessonId: "lesson_8", competency: "estimation", phase: "practice" },
  { kind: "marketMaking", lessonId: "mm_spread", competency: "marketMaking", phase: "practice" },
  { kind: "marketMaking", lessonId: "mm_fair_value", competency: "expectedValue", phase: "practice" },
  { kind: "pokerTheory", lessonId: "pt_pot_odds", competency: "expectedValue", phase: "practice" },
  { kind: "lesson", lessonId: "lesson_9", competency: "pokerTheory", phase: "practice" },
  { kind: "lesson", lessonId: "lesson_10", competency: "brainteasers", phase: "practice" },
  { kind: "marketMaking", lessonId: "mm_inventory", competency: "marketMaking", phase: "practice" },
  { kind: "pokerTheory", lessonId: "pt_ranges", competency: "pokerTheory", phase: "practice" },
  { kind: "marketMaking", lessonId: "mm_partial_info", competency: "marketMaking", phase: "practice" },
  { kind: "lesson", lessonId: "lesson_11", competency: "brainteasers", phase: "practice" },
  { kind: "marketMaking", lessonId: "mm_interview", competency: "marketMaking", phase: "practice" },
  { kind: "pokerTheory", lessonId: "pt_position", competency: "pokerTheory", phase: "practice" },
  { kind: "pokerTheory", lessonId: "pt_bluffing", competency: "pokerTheory", phase: "practice" },

  // Advanced quant track (order 12-18): deeper, interview-grade material that
  // unlocks after the core lessons via the same sequential-mastery gate.
  { kind: "lesson", lessonId: "lesson_12", competency: "expectedValue", phase: "practice" },
  { kind: "lesson", lessonId: "lesson_13", competency: "expectedValue", phase: "practice" },
  { kind: "lesson", lessonId: "lesson_14", competency: "probability", phase: "practice" },
  { kind: "lesson", lessonId: "lesson_15", competency: "probability", phase: "practice" },
  { kind: "lesson", lessonId: "lesson_16", competency: "statistics", phase: "practice" },
  { kind: "lesson", lessonId: "lesson_17", competency: "expectedValue", phase: "practice" },
  { kind: "lesson", lessonId: "lesson_18", competency: "marketMaking", phase: "practice" },
];

/** Firms used to rotate general (non-firm-focused) mock interviews, by style. */
const GENERAL_MOCK_ROTATION = ["jane-street", "optiver", "citadel-securities", "sig"];

function unitRoute(unit: LearningUnit): string {
  switch (unit.kind) {
    case "lesson":
      return `/lessons/${unit.lessonId}`;
    case "pokerTheory":
      return `/poker-theory/${unit.lessonId}`;
    case "marketMaking":
      return `/market-making/lessons/${unit.lessonId}`;
  }
}

function unitTitle(unit: LearningUnit): string {
  const lesson =
    unit.kind === "lesson"
      ? getLesson(unit.lessonId)
      : unit.kind === "pokerTheory"
        ? getPokerTheoryLesson(unit.lessonId)
        : getMarketMakingLesson(unit.lessonId);
  return lesson?.title ?? unit.lessonId;
}

function unitTaskKind(unit: LearningUnit): SprintTask["kind"] {
  return unit.kind;
}

function lessonTask(unit: LearningUnit): SprintTask {
  return {
    id: `learn-${unit.lessonId}`,
    kind: unitTaskKind(unit),
    label: `Lesson: ${unitTitle(unit)}`,
    detail: `Build ${COMPETENCY_LABELS[unit.competency]} — aim to pass at 80%+.`,
    route: unitRoute(unit),
    competency: unit.competency,
    estMinutes: 20,
    lessonId: unit.lessonId,
  };
}

function practiceTask(unit: LearningUnit): SprintTask {
  return {
    id: `practice-${unit.lessonId}`,
    kind: "practice",
    label: `Drill: ${unitTitle(unit)}`,
    detail: "Reps to lock it in — ungated, doesn't affect mastery.",
    route: `/practice/${unit.lessonId}`,
    competency: unit.competency,
    estMinutes: 15,
    lessonId: unit.lessonId,
  };
}

function mentalMathTask(seq: number): SprintTask {
  return {
    id: `mental-math-${seq}`,
    kind: "mentalMath",
    label: "Mental-math speed drill",
    detail: "120 seconds — beat your personal best.",
    route: "/mental-math",
    competency: "mentalMath",
    estMinutes: 8,
  };
}

function mockTask(firmId: string, seq: number): SprintTask {
  const firm = getFirmProfile(firmId);
  return {
    id: `mock-${seq}`,
    kind: "mockInterview",
    label: `Mock interview: ${firm?.name ?? firmId}`,
    detail: "A full, conversational AI interview — fresh questions every time.",
    route: `/mock-interview/${firmId}`,
    estMinutes: 30,
    firmId,
  };
}

function reviewTask(id: string, label: string, route: string, detail: string): SprintTask {
  return { id, kind: "review", label, detail, route, estMinutes: 12 };
}

function readinessTask(firmId?: string): SprintTask {
  return {
    id: "readiness",
    kind: "readiness",
    label: firmId ? "Check your firm readiness" : "Check your readiness dashboard",
    detail: "See where you stand and what to close before interview day.",
    route: "/readiness",
    estMinutes: 10,
  };
}

/** Round, but keep a sensible floor so every phase gets at least `min` days. */
function phaseDays(length: number, fraction: number, min: number): number {
  return Math.max(min, Math.round(length * fraction));
}

/** Computes inclusive day ranges for the four phases, summing to `length`. */
function computePhaseRanges(
  length: SprintLength,
): SprintCurriculum["phaseRanges"] {
  const review = phaseDays(length, 0.12, 1);
  const mocks = phaseDays(length, 0.22, 1);
  const practice = phaseDays(length, 0.3, 1);
  const fundamentals = Math.max(1, length - review - mocks - practice);

  // Re-derive review as the remainder so the four always sum to `length` even
  // after the fundamentals floor kicks in on very short sprints.
  const usedBeforeReview = fundamentals + practice + mocks;
  const reviewFinal = Math.max(1, length - usedBeforeReview);

  let cursor = 1;
  const make = (count: number) => {
    const startDay = cursor;
    const endDay = cursor + count - 1;
    cursor = endDay + 1;
    return { startDay, endDay };
  };

  return {
    fundamentals: make(fundamentals),
    practice: make(practice),
    mocks: make(mocks),
    review: make(reviewFinal),
  };
}

/** Orders learning units; firm sprints front-load the firm's heaviest skills. */
function orderedUnits(firmId?: string): LearningUnit[] {
  const firm = firmId ? getFirmProfile(firmId) : undefined;
  if (!firm) return LEARNING_BACKBONE;
  const phaseRank: Record<LearningUnit["phase"], number> = {
    fundamentals: 0,
    practice: 1,
  };
  return LEARNING_BACKBONE.map((unit, index) => ({ unit, index })).sort((a, b) => {
    if (phaseRank[a.unit.phase] !== phaseRank[b.unit.phase]) {
      return phaseRank[a.unit.phase] - phaseRank[b.unit.phase];
    }
    const wA = firm.weights[a.unit.competency];
    const wB = firm.weights[b.unit.competency];
    if (wB !== wA) return wB - wA;
    return a.index - b.index;
  }).map((x) => x.unit);
}

function focusForLearningDay(units: LearningUnit[], phase: SprintPhase): string {
  if (units.length === 0) {
    return phase === "fundamentals" ? "Foundations" : "Sharpen the core";
  }
  const label = COMPETENCY_LABELS[units[0].competency];
  return phase === "fundamentals" ? `Foundations: ${label}` : `Sharpen: ${label}`;
}

/**
 * Builds the full day-by-day program. `length` selects the schedule; passing a
 * `firmId` produces the firm-focused variant (reweighted learning + that firm's
 * mock interviews + a firm readiness check).
 */
export function buildSprintCurriculum(
  length: SprintLength,
  opts: { firmId?: string } = {},
): SprintCurriculum {
  const firm = opts.firmId ? getFirmProfile(opts.firmId) : undefined;
  const firmId = firm?.id;
  const ranges = computePhaseRanges(length);

  const fundamentalsDays =
    ranges.fundamentals.endDay - ranges.fundamentals.startDay + 1;
  const practiceDays = ranges.practice.endDay - ranges.practice.startDay + 1;
  const learningDays = fundamentalsDays + practiceDays;

  // One backbone, foundations-first. Each learning day gets one "lead" lesson;
  // any leftover units become reinforcement drills spread across the days, so a
  // long sprint stays dense and a short one keeps only the highest-yield units.
  const pool = orderedUnits(firmId).slice(0, learningDays * 2);
  const leadCount = Math.min(learningDays, pool.length);
  const leadUnits = pool.slice(0, leadCount);
  const extraUnits = pool.slice(leadCount);

  const days: SprintDay[] = [];
  let mentalMathSeq = 0;
  let mockSeq = 0;

  // Round-robin the leftover units onto days as extra practice drills.
  const extrasByDay = new Array<LearningUnit[]>(learningDays);
  for (let i = 0; i < learningDays; i += 1) extrasByDay[i] = [];
  extraUnits.forEach((unit, i) => {
    extrasByDay[i % learningDays].push(unit);
  });

  for (let i = 0; i < learningDays; i += 1) {
    const dayNumber = i + 1;
    const phase: SprintPhase = i < fundamentalsDays ? "fundamentals" : "practice";
    const lead = leadUnits[i];
    const tasks: SprintTask[] = [];
    if (lead) tasks.push(lessonTask(lead));
    for (const extra of extrasByDay[i]) {
      tasks.push(
        PRACTICE_BANK_IDS.has(extra.lessonId) ? practiceTask(extra) : lessonTask(extra),
      );
    }
    // Practice-phase days with only a lead lesson get a reinforcing drill.
    if (
      phase === "practice" &&
      lead &&
      extrasByDay[i].length === 0 &&
      PRACTICE_BANK_IDS.has(lead.lessonId)
    ) {
      tasks.push(practiceTask(lead));
    }
    mentalMathSeq += 1;
    tasks.push(mentalMathTask(mentalMathSeq));
    days.push({
      day: dayNumber,
      phase,
      focus: focusForLearningDay(lead ? [lead] : [], phase),
      tasks,
    });
  }

  // ----- Mocks phase: rehearse the real thing -----
  const mockDays = ranges.mocks.endDay - ranges.mocks.startDay + 1;
  for (let i = 0; i < mockDays; i += 1) {
    const dayNumber = days.length + 1;
    const targetFirm = firmId ?? GENERAL_MOCK_ROTATION[i % GENERAL_MOCK_ROTATION.length];
    mockSeq += 1;
    mentalMathSeq += 1;
    const tasks: SprintTask[] = [
      mockTask(targetFirm, mockSeq),
      reviewTask(
        `mock-review-${i}`,
        "Review your interview feedback",
        "/mock-interview",
        "Note the follow-ups that tripped you up and re-drill them.",
      ),
      mentalMathTask(mentalMathSeq),
    ];
    days.push({
      day: dayNumber,
      phase: "mocks",
      focus: firm ? `Mock day — ${firm.name}` : "Mock interview day",
      tasks,
    });
  }

  // ----- Review phase: close gaps, then a final readiness check -----
  const reviewDays = ranges.review.endDay - ranges.review.startDay + 1;
  for (let i = 0; i < reviewDays; i += 1) {
    const dayNumber = days.length + 1;
    const isFinalDay = i === reviewDays - 1;
    if (isFinalDay) {
      days.push({
        day: dayNumber,
        phase: "review",
        focus: "Final readiness report",
        tasks: [
          readinessTask(firmId),
          firmId
            ? mockTask(firmId, mockSeq + 1)
            : reviewTask(
                "final-mock",
                "One last mock interview",
                "/mock-interview",
                "A confidence rep — keep it light and trust your prep.",
              ),
          reviewTask(
            "final-rest",
            "Rest & logistics",
            "/readiness",
            "Skim your weakest competency, then stop. Show up sharp.",
          ),
        ],
      });
    } else {
      mentalMathSeq += 1;
      days.push({
        day: dayNumber,
        phase: "review",
        focus: "Close the gaps",
        tasks: [
          readinessTask(firmId),
          reviewTask(
            `review-weak-${i}`,
            "Re-drill your weakest area",
            "/practice",
            "Use the readiness dashboard to pick the lowest-scoring track.",
          ),
          mentalMathTask(mentalMathSeq),
        ],
      });
    }
  }

  return {
    length,
    firmId,
    firmName: firm?.name,
    days,
    phaseRanges: ranges,
  };
}

/** Total tasks across the whole program (used for overall progress math). */
export function countCurriculumTasks(curriculum: SprintCurriculum): number {
  return curriculum.days.reduce((sum, d) => sum + d.tasks.length, 0);
}
