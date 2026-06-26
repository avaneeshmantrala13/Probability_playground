import { shuffle, type ComebackQuestion, type ServedQuestion } from "../comeback";
import {
  DEFAULT_QUIZ_DIFFICULTY,
  getQuizQuestionPool,
  type QuizDifficulty,
} from "./quizQuestions";
import type { GameState } from "./types";

/** Which reveal moment a quiz gate guards. */
export type QuizGateId = "hole" | "flop" | "turn" | "river";

export const QUIZ_GATE_TIMEOUT_MS = 10_000;

export const QUIZ_GATE_LABELS: Record<QuizGateId, string> = {
  hole: "Hole cards",
  flop: "Flop",
  turn: "Turn",
  river: "River",
};

export interface QuizGateAnswer {
  passed: boolean;
  selectedIndex: number | null;
}

export type QuizGateStatus = QuizGateAnswer | "pending";
export type QuizGateResults = Partial<Record<QuizGateId, QuizGateStatus>>;

function shuffleOptions(q: ComebackQuestion): ServedQuestion {
  const correctValue = q.options[q.correctIndex];
  const options = shuffle(q.options);
  return {
    id: q.id,
    prompt: q.prompt,
    options,
    correctIndex: options.indexOf(correctValue),
    explanation: q.explanation,
  };
}

function pickFromPool(
  pool: ComebackQuestion[],
  handNumber: number,
  gate: QuizGateId,
): ServedQuestion {
  const gateOffset = { hole: 0, flop: 1, turn: 2, river: 3 }[gate];
  const q = pool[(handNumber * 4 + gateOffset) % pool.length];
  return shuffleOptions(q);
}

export function pickQuizQuestion(
  handNumber: number,
  gate: QuizGateId,
  usedIds: Set<string> = new Set(),
  difficulty: QuizDifficulty = DEFAULT_QUIZ_DIFFICULTY,
): ServedQuestion {
  const pool = getQuizQuestionPool(difficulty);
  if (pool.length === 0) {
    throw new Error(`No quiz questions available for difficulty "${difficulty}"`);
  }
  const preferred = pickFromPool(pool, handNumber, gate);
  if (!usedIds.has(preferred.id)) return preferred;
  const fresh = shuffle(pool.filter((q) => !usedIds.has(q.id)));
  return shuffleOptions(fresh[0] ?? pool[handNumber % pool.length]);
}

export function detectQuizGate(
  prev: GameState | null,
  next: GameState,
  viewerSeatIndex: number,
): QuizGateId | null {
  if (next.stage === "complete" && !next.result) return null;
  const viewer = next.seats[viewerSeatIndex];
  if (!viewer || viewer.status === "out") return null;

  const prevHand = prev?.handNumber ?? 0;
  if (prev == null || next.handNumber !== prevHand) {
    return viewer.holeCards.length >= 2 ? "hole" : null;
  }

  const prevBoardLen = prev.board.length;
  const boardLen = next.board.length;
  if (boardLen >= 3 && prevBoardLen < 3) return "flop";
  if (boardLen >= 4 && prevBoardLen < 4) return "turn";
  if (boardLen >= 5 && prevBoardLen < 5) return "river";
  return null;
}

export function gatePassed(status: QuizGateStatus | undefined): boolean {
  if (status === undefined || status === "pending") return false;
  return status.passed;
}

export function canSeeHoleCards(results: QuizGateResults): boolean {
  return gatePassed(results.hole);
}

export function canSeeBoardCard(cardIndex: number, results: QuizGateResults): boolean {
  if (cardIndex <= 2) return gatePassed(results.flop);
  if (cardIndex === 3) return gatePassed(results.turn);
  if (cardIndex === 4) return gatePassed(results.river);
  return true;
}
