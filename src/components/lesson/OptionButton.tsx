import type { ReactNode } from "react";
import { OPTION_LETTERS } from "../../content/types";

export type OptionState = "idle" | "selected" | "correct" | "incorrect" | "muted";

interface OptionButtonProps {
  index: number;
  label: string;
  state: OptionState;
  disabled?: boolean;
  onSelect: (index: number) => void;
  trailing?: ReactNode;
}

function classesFor(state: OptionState): string {
  switch (state) {
    case "selected":
      return "border-accent bg-surface-muted";
    case "correct":
      return "border-success bg-success-soft";
    case "incorrect":
      return "border-danger bg-danger-soft";
    case "muted":
      return "border-subtle opacity-60";
    default:
      return "border-subtle hover:border-accent/60 hover:bg-surface-muted";
  }
}

function badgeClassesFor(state: OptionState): string {
  switch (state) {
    case "selected":
      return "border-accent text-accent";
    case "correct":
      return "border-success text-success";
    case "incorrect":
      return "border-danger text-danger";
    default:
      return "border-subtle text-secondary";
  }
}

export function OptionButton({
  index,
  label,
  state,
  disabled,
  onSelect,
  trailing,
}: OptionButtonProps) {
  const letter = OPTION_LETTERS[index];
  return (
    <button
      type="button"
      role="radio"
      aria-checked={state === "selected" || state === "correct"}
      disabled={disabled}
      onClick={() => onSelect(index)}
      className={[
        "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors disabled:cursor-default",
        classesFor(state),
      ].join(" ")}
    >
      <span
        className={[
          "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border text-sm font-semibold",
          badgeClassesFor(state),
        ].join(" ")}
        aria-hidden="true"
      >
        {letter}
      </span>
      <span className="flex-1 text-primary">{label}</span>
      {trailing}
    </button>
  );
}
