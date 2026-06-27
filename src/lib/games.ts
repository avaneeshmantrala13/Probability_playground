import { getLesson } from "../content";
import type { CourseProgress } from "./progress";

/**
 * Playground games unlock after mastering the quant lesson they reinforce.
 * Monty Hall → lesson_3 (Bayes / law of large numbers).
 * Poker Scenario → lesson_5 (conditional probability).
 */
export interface GameDef {
  id: string;
  route: string;
  title: string;
  /** The lesson that must be mastered (passed) to unlock this game. */
  requiredLessonId: string;
}

export const GAMES: GameDef[] = [
  {
    id: "monty-hall",
    route: "/games/monty-hall",
    title: "Monty Hall: Switch or Stay",
    requiredLessonId: "lesson_3",
  },
  {
    id: "poker",
    route: "/games/poker",
    title: "Poker Scenario",
    requiredLessonId: "lesson_5",
  },
];

export interface GameLockInfo {
  unlocked: boolean;
  requiredLessonId: string;
  requiredLessonTitle: string;
  /** Route to the lesson that unlocks this game. */
  requiredLessonHref: string;
}

function lessonMastered(lessonId: string, progress: CourseProgress): boolean {
  return Boolean(progress.lessonMastery[lessonId]?.passed);
}

/** Lock/unlock state for a game, plus how to reach the lesson that unlocks it. */
export function getGameLockInfo(
  gameId: string,
  progress: CourseProgress,
): GameLockInfo {
  const game = GAMES.find((g) => g.id === gameId);
  const requiredLessonId = game?.requiredLessonId ?? "";
  const lesson = requiredLessonId ? getLesson(requiredLessonId) : undefined;
  return {
    unlocked: requiredLessonId
      ? lessonMastered(requiredLessonId, progress)
      : true,
    requiredLessonId,
    requiredLessonTitle: lesson?.title ?? "",
    requiredLessonHref: requiredLessonId ? `/lessons/${requiredLessonId}` : "/lessons",
  };
}
