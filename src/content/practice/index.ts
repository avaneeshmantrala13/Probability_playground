import type { PracticeBank, PracticeQuestion, PracticeTrack } from "./types";

/**
 * Eagerly imports every practice-bank JSON in ./banks. Each file is one lesson's
 * ungated practice pool. Adding a new file automatically registers it.
 */
const modules = import.meta.glob<{ default: PracticeBank }>("./banks/*.json", {
  eager: true,
});

export const PRACTICE_BANKS: PracticeBank[] = Object.values(modules).map(
  (m) => m.default,
);

const BANK_BY_LESSON = new Map(PRACTICE_BANKS.map((b) => [b.lessonId, b]));

export function getPracticeBank(lessonId: string): PracticeBank | undefined {
  return BANK_BY_LESSON.get(lessonId);
}

export function getPracticeBanksByTrack(track: PracticeTrack): PracticeBank[] {
  return PRACTICE_BANKS.filter((b) => b.track === track);
}

/** Total number of authored practice questions across all banks. */
export const TOTAL_PRACTICE_QUESTIONS: number = PRACTICE_BANKS.reduce(
  (sum, b) => sum + b.questions.length,
  0,
);

/** Fisher–Yates shuffle (returns a new array). */
function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Draw up to `count` random practice questions for a lesson (shuffled). When the
 * bank is smaller than `count`, returns the whole bank shuffled.
 */
export function drawPracticeQuestions(
  lessonId: string,
  count: number,
): PracticeQuestion[] {
  const bank = BANK_BY_LESSON.get(lessonId);
  if (!bank) return [];
  return shuffle(bank.questions).slice(0, count);
}

export type { PracticeBank, PracticeQuestion, PracticeTrack };
