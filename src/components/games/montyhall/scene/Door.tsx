import { memo } from "react";
import type { Prize } from "../logic";
import { Goat } from "./Goat";
import { Car } from "./Car";
import { CheckMark, GoatGlyph, PointerGlyph } from "./glyphs";

export interface DoorProps {
  number: number;
  prize: Prize;
  /** Whether the door panel is swung open. */
  open: boolean;
  /** Whether to render the prize behind the door yet. */
  showPrize: boolean;
  /** Player can click this door right now. */
  selectable: boolean;
  /** Player's currently highlighted pick. */
  selected: boolean;
  /** The door the host revealed a goat behind. */
  hostOpened: boolean;
  /** The door the player's final decision landed on. */
  finalChoice: boolean;
  /** This door hides the car and the round is fully revealed (winning door). */
  winningRevealed: boolean;
  reduced: boolean;
  onSelect: (door: number) => void;
}

function badge(label: string, tone: "accent" | "host" | "success") {
  const toneClasses =
    tone === "success"
      ? "bg-success-soft text-success"
      : tone === "host"
        ? "bg-surface-muted text-secondary"
        : "bg-accent text-accent-contrast";
  return (
    <span
      className={[
        "absolute -top-2.5 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[0.65rem] font-semibold shadow-card",
        toneClasses,
      ].join(" ")}
    >
      {label}
    </span>
  );
}

function DoorBase({
  number,
  prize,
  open,
  showPrize,
  selectable,
  selected,
  hostOpened,
  finalChoice,
  winningRevealed,
  reduced,
  onSelect,
}: DoorProps) {
  const ringClass = winningRevealed
    ? "ring-2 ring-success"
    : selected
      ? "ring-2 ring-accent"
      : "";

  return (
    <div className="relative flex flex-col items-center">
      {winningRevealed && finalChoice
        ? badge("You win!", "success")
        : finalChoice
          ? badge("Your door", "accent")
          : hostOpened
            ? badge("Host opened", "host")
            : null}

      <button
        type="button"
        disabled={!selectable}
        aria-label={`Door ${number}`}
        aria-pressed={selected}
        onClick={() => onSelect(number)}
        className={[
          "group relative aspect-[3/5] w-full overflow-hidden rounded-xl border border-subtle bg-surface-muted transition-shadow",
          ringClass,
          selectable
            ? "cursor-pointer hover:ring-2 hover:ring-accent/60"
            : "cursor-default",
        ].join(" ")}
        style={{ perspective: "800px" }}
      >
        {/* Interior: stage + prize, revealed when the door opens. */}
        <span className="absolute inset-0 flex flex-col items-center justify-end">
          <span className="absolute inset-0 bg-gradient-to-b from-surface to-surface-muted" />
          <span className="absolute inset-x-0 bottom-0 h-1/3 bg-surface-raised opacity-60" />
          {showPrize && (
            <span
              className={[
                "relative z-10 mb-[12%] block w-[78%]",
                reduced ? "" : "mh-pop",
              ].join(" ")}
            >
              {prize === "car" ? (
                <Car className="h-auto w-full drop-shadow" />
              ) : (
                <Goat className="h-auto w-full drop-shadow" />
              )}
            </span>
          )}
        </span>

        {/* The swinging door panel. */}
        <span
          className={[
            "mh-door-panel absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl border border-subtle bg-accent",
            open ? "mh-door-open" : "",
          ].join(" ")}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-contrast/90 text-base font-extrabold text-accent">
            {number}
          </span>
          {/* recessed panels */}
          <span className="mt-3 h-[34%] w-[58%] rounded-md border border-accent-contrast/25" />
          {/* knob */}
          <span className="absolute right-2.5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-accent-contrast/80" />
        </span>
      </button>

      {/* Non-color status cue beneath each door. */}
      <span className="mt-2 flex h-5 items-center gap-1 text-xs font-medium text-secondary">
        {selected && !open && (
          <>
            <PointerGlyph className="h-3.5 w-3.5" /> Picked
          </>
        )}
        {open && (
          <>
            {prize === "car" ? (
              <CheckMark className="h-3.5 w-3.5 text-success" />
            ) : (
              <GoatGlyph className="h-3.5 w-3.5" />
            )}
            {prize === "car" ? "Car" : "Goat"}
          </>
        )}
      </span>
    </div>
  );
}

export const Door = memo(DoorBase);
