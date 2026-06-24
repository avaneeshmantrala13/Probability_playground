import { useCallback, useMemo, useState } from "react";
import {
  DOOR_INDEXES,
  hostOpens,
  placeCar,
  prizeAt,
  resolveRound,
  switchTarget,
  type Decision,
} from "./logic";
import { Door } from "./scene/Door";
import { Host } from "./scene/Host";
import { Confetti } from "./scene/Confetti";
import { CheckMark, CrossMark } from "./scene/glyphs";

type Phase = "pick" | "decide" | "reveal";

interface GameStageProps {
  reduced: boolean;
  onRecord: (decision: Decision, won: boolean) => void;
}

interface RoundState {
  carDoor: number;
  firstChoice: number | null;
  hostOpened: number | null;
  decision: Decision | null;
  finalChoice: number | null;
  won: boolean | null;
  phase: Phase;
  /** Increments each new round to re-key animations. */
  round: number;
}

function freshRound(round: number): RoundState {
  return {
    carDoor: placeCar(),
    firstChoice: null,
    hostOpened: null,
    decision: null,
    finalChoice: null,
    won: null,
    phase: "pick",
    round,
  };
}

export function GameStage({ reduced, onRecord }: GameStageProps) {
  const [state, setState] = useState<RoundState>(() => freshRound(1));

  const pick = useCallback((door: number) => {
    setState((prev) => {
      if (prev.phase !== "pick") return prev;
      const opened = hostOpens(prev.carDoor, door);
      return {
        ...prev,
        firstChoice: door,
        hostOpened: opened,
        phase: "decide",
      };
    });
  }, []);

  const decide = useCallback(
    (decision: Decision) => {
      setState((prev) => {
        if (
          prev.phase !== "decide" ||
          prev.firstChoice === null ||
          prev.hostOpened === null
        ) {
          return prev;
        }
        const result = resolveRound(
          prev.carDoor,
          prev.firstChoice,
          prev.hostOpened,
          decision,
        );
        onRecord(decision, result.won);
        return {
          ...prev,
          decision,
          finalChoice: result.finalChoice,
          won: result.won,
          phase: "reveal",
        };
      });
    },
    [onRecord],
  );

  const nextRound = useCallback(() => {
    setState((prev) => freshRound(prev.round + 1));
  }, []);

  const message = useMemo(() => {
    if (state.phase === "pick") {
      return "Showtime! Pick a door — a brand-new car hides behind one of them.";
    }
    if (state.phase === "decide") {
      return `Door ${(state.hostOpened ?? 0) + 1} had a goat! Do you want to switch or stay?`;
    }
    return state.won
      ? "Ding ding ding — you drove off with the car!"
      : "Ah, a goat! That happens. Give it another spin.";
  }, [state.phase, state.hostOpened, state.won]);

  const stayDoor = state.firstChoice;
  const switchDoor =
    state.firstChoice !== null && state.hostOpened !== null
      ? switchTarget(state.firstChoice, state.hostOpened)
      : null;

  return (
    <div className="pp-card relative overflow-hidden p-4 sm:p-6">
      {state.phase === "reveal" && state.won && !reduced && (
        <Confetti />
      )}

      <Host
        message={message}
        messageKey={`${state.round}-${state.phase}`}
        reduced={reduced}
      />

      <div className="mt-5 grid grid-cols-3 gap-2.5 sm:gap-5">
        {DOOR_INDEXES.map((i) => {
          const open =
            state.phase === "reveal" ||
            (state.phase === "decide" && i === state.hostOpened);
          return (
            <Door
              key={i}
              number={i + 1}
              prize={prizeAt(i, state.carDoor)}
              open={open}
              showPrize={open}
              selectable={state.phase === "pick"}
              selected={state.phase === "decide" && i === state.firstChoice}
              hostOpened={state.phase === "decide" && i === state.hostOpened}
              finalChoice={state.phase === "reveal" && i === state.finalChoice}
              winningRevealed={state.phase === "reveal" && i === state.carDoor}
              reduced={reduced}
              onSelect={pick}
            />
          );
        })}
      </div>

      <div className="mt-5 min-h-[3rem]">
        {state.phase === "pick" && (
          <p className="text-center text-sm text-secondary">
            Tap a door to lock in your first pick.
          </p>
        )}

        {state.phase === "decide" && (
          <div className="flex flex-col items-center gap-2.5 sm:flex-row sm:justify-center">
            <button
              type="button"
              className="pp-btn-primary w-full sm:w-auto"
              onClick={() => decide("switch")}
            >
              Switch to Door {(switchDoor ?? 0) + 1}
            </button>
            <button
              type="button"
              className="pp-btn-secondary w-full sm:w-auto"
              onClick={() => decide("stay")}
            >
              Stay with Door {(stayDoor ?? 0) + 1}
            </button>
          </div>
        )}

        {state.phase === "reveal" && (
          <div className="flex flex-col items-center gap-3">
            <div
              className={[
                "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold",
                state.won
                  ? "bg-success-soft text-success"
                  : "bg-danger-soft text-danger",
              ].join(" ")}
              role="status"
            >
              {state.won ? (
                <CheckMark className="h-4 w-4" />
              ) : (
                <CrossMark className="h-4 w-4" />
              )}
              {state.won ? "You won the car" : "You got a goat"}
              <span className="font-normal opacity-80">
                · you {state.decision === "switch" ? "switched" : "stayed"}
              </span>
            </div>
            <button type="button" className="pp-btn-primary" onClick={nextRound}>
              Play again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
