/** Quiz lives helper for quiz agents. */
export function quizLivesOf(progress: { quizLives?: number }): number {
  return progress.quizLives ?? 0;
}
