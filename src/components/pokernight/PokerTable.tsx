import { type CSSProperties, useEffect, useRef, useState } from "react";
import type { DeckSkin, TableTheme } from "../../lib/cosmetics";
import type { GameState } from "../../lib/poker";
import { PlayingCard } from "./PlayingCard";
import { PlayerSeat } from "./PlayerSeat";

interface PokerTableProps {
  state: GameState;
  deck: DeckSkin;
  theme: TableTheme;
  reduced: boolean;
}

type Pos = { top: string; left: string };

/** Seat layouts (index 0 is the human, anchored at the bottom). */
const LAYOUTS: Record<number, Pos[]> = {
  2: [
    { top: "86%", left: "50%" },
    { top: "12%", left: "50%" },
  ],
  3: [
    { top: "86%", left: "50%" },
    { top: "20%", left: "20%" },
    { top: "20%", left: "80%" },
  ],
  4: [
    { top: "86%", left: "50%" },
    { top: "50%", left: "8%" },
    { top: "12%", left: "50%" },
    { top: "50%", left: "92%" },
  ],
  5: [
    { top: "88%", left: "50%" },
    { top: "58%", left: "7%" },
    { top: "16%", left: "26%" },
    { top: "16%", left: "74%" },
    { top: "58%", left: "93%" },
  ],
  6: [
    { top: "88%", left: "50%" },
    { top: "60%", left: "6%" },
    { top: "16%", left: "22%" },
    { top: "11%", left: "50%" },
    { top: "16%", left: "78%" },
    { top: "60%", left: "94%" },
  ],
};

function layoutFor(n: number): Pos[] {
  return LAYOUTS[n] ?? LAYOUTS[6];
}

export function PokerTable({ state, deck, theme, reduced }: PokerTableProps) {
  const n = state.seats.length;
  const positions = layoutFor(n);

  const result = state.result;
  const reveal = state.stage === "complete" && !!result && !result.uncontested;
  const winners = new Set<number>(
    result ? result.pots.flatMap((p) => p.winners) : [],
  );

  // Pot bump animation when the pot changes.
  const [potBump, setPotBump] = useState(false);
  const prevPot = useRef(state.pot);
  useEffect(() => {
    if (state.pot !== prevPot.current) {
      prevPot.current = state.pot;
      if (!reduced && state.pot > 0) {
        setPotBump(true);
        const t = setTimeout(() => setPotBump(false), 420);
        return () => clearTimeout(t);
      }
    }
  }, [state.pot, reduced]);

  const feltVars: CSSProperties = {
    ["--pn-felt" as string]: theme.felt,
    ["--pn-rail" as string]: theme.rail,
    ["--pn-glow" as string]: theme.glow,
  };

  const dealAnim = reduced ? "" : "pn-anim-deal";

  return (
    <div className="pn-table-wrap" style={feltVars}>
      <div className="pn-felt" />

      {/* center: community cards + pot */}
      <div className="absolute left-1/2 top-1/2 z-[5] -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="mb-2 flex items-center justify-center gap-1.5">
          {state.board.length === 0 ? (
            <span className="text-sm font-medium" style={{ color: theme.text, opacity: 0.7 }}>
              {state.stage === "complete" ? "Hand over" : "Pre-flop"}
            </span>
          ) : (
            state.board.map((c, i) => (
              <PlayingCard
                key={`${state.handNumber}-board-${i}-${c}`}
                card={c}
                deck={deck}
                size="md"
                animClass={dealAnim}
                style={reduced ? undefined : { animationDelay: `${i * 60}ms` }}
              />
            ))
          )}
        </div>
        <div
          className={`pn-pot inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${
            potBump ? "pn-anim-pot-bump" : ""
          }`}
          style={{
            background: "rgb(0 0 0 / 0.5)",
            color: theme.text,
            border: `1px solid ${theme.glow}`,
          }}
        >
          <span aria-hidden>💰</span>
          Pot {state.pot.toLocaleString()}
        </div>
      </div>

      {state.seats.map((seat, i) => (
        <PlayerSeat
          key={seat.index}
          seat={seat}
          deck={deck}
          theme={theme}
          position={positions[i] ?? positions[0]}
          isButton={seat.index === state.button && seat.status !== "out"}
          isToAct={state.toAct === seat.index}
          isWinner={winners.has(seat.index)}
          reveal={reveal}
          reduced={reduced}
          dealKey={state.handNumber}
        />
      ))}
    </div>
  );
}
