/**
 * Per-question difficulty indicator. Difficulty is RELATIVE TO THE LESSON and is
 * derived purely from the question's position: the first three questions are
 * easy, the next three medium, and the last four challenging. Stars (out of 5)
 * give a finer within-lesson ranking.
 */

export type DifficultyLabel = "Easy" | "Medium" | "Challenging";

interface DifficultyLevel {
  stars: number;
  label: DifficultyLabel;
}

const MAX_STARS = 5;

// Index 0-9 -> escalating difficulty within the lesson.
const LEVELS: DifficultyLevel[] = [
  { stars: 1, label: "Easy" },
  { stars: 1, label: "Easy" },
  { stars: 2, label: "Easy" },
  { stars: 3, label: "Medium" },
  { stars: 3, label: "Medium" },
  { stars: 4, label: "Medium" },
  { stars: 4, label: "Challenging" },
  { stars: 5, label: "Challenging" },
  { stars: 5, label: "Challenging" },
  { stars: 5, label: "Challenging" },
];

function difficultyForIndex(index: number): DifficultyLevel {
  return LEVELS[Math.max(0, Math.min(index, LEVELS.length - 1))];
}

const LABEL_COLOR: Record<DifficultyLabel, string> = {
  Easy: "text-success",
  Medium: "text-accent",
  Challenging: "text-danger",
};

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      width={13}
      height={13}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.75}
      strokeLinejoin="round"
      aria-hidden
      className={filled ? "" : "text-subtle"}
    >
      <path d="M12 2.5l2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.9l-5.8 3.05 1.1-6.47-4.7-4.58 6.5-.95z" />
    </svg>
  );
}

export function DifficultyBadge({
  index,
  questionNumber,
}: {
  index: number;
  questionNumber: number;
}) {
  const { stars, label } = difficultyForIndex(index);
  const labelColor = LABEL_COLOR[label];

  return (
    <div
      className="flex flex-col items-end gap-1"
      aria-label={`Question ${questionNumber}: ${label}, ${stars} of ${MAX_STARS} stars`}
    >
      <span className="text-xs font-medium text-muted">
        Question {questionNumber}
      </span>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold ${labelColor}`}>{label}</span>
        <div className={`flex items-center gap-0.5 ${labelColor}`} aria-hidden>
          {Array.from({ length: MAX_STARS }, (_, i) => (
            <Star key={i} filled={i < stars} />
          ))}
        </div>
      </div>
    </div>
  );
}
