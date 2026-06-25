import { type CSSProperties, useEffect, useRef, useState } from "react";
import type { DeckSkin, TableTheme } from "../../lib/cosmetics";
import type { GameState } from "../../lib/poker";
import { PlayingCard } from "./PlayingCard";
import { PlayerSeat } from "./PlayerSeat";
import { Dealer } from "./Dealer";
import type { Speech } from "./usePokerGame";
import "./pokernight.css";

interface PokerTableProps {
  state: GameState;
  deck: DeckSkin;
  theme: TableTheme;
  reduced: boolean;
  speeches: Record<number, Speech>;
}

type Pos = { top: string; left: string; scale?: number };

/**
 * First-person, seated POV layouts. Index 0 is the human, docked front-and-center
 * at the very bottom (the camera == the player's eyes). Opponents fan around the
 * far/side arcs facing the player; seats farther "across" the table use a
 * smaller `scale` so the perspective reads with real depth.
 */
const LAYOUTS: Record<number, Pos[]> = {
  2: [
    { top: "97%", left: "50%", scale: 1 },
    { top: "31%", left: "30%", scale: 0.78 },
  ],
  3: [
    { top: "97%", left: "50%", scale: 1 },
    { top: "30%", left: "22%", scale: 0.8 },
    { top: "30%", left: "78%", scale: 0.8 },
  ],
  4: [
    { top: "97%", left: "50%", scale: 1 },
    { top: "50%", left: "11%", scale: 0.9 },
    { top: "29%", left: "31%", scale: 0.76 },
    { top: "29%", left: "69%", scale: 0.76 },
  ],
  5: [
    { top: "98%", left: "50%", scale: 1 },
    { top: "51%", left: "8%", scale: 0.92 },
    { top: "28%", left: "30%", scale: 0.75 },
    { top: "28%", left: "70%", scale: 0.75 },
    { top: "51%", left: "92%", scale: 0.92 },
  ],
  6: [
    { top: "98%", left: "50%", scale: 1 },
    { top: "52%", left: "7%", scale: 0.93 },
    { top: "30%", left: "25%", scale: 0.76 },
    { top: "26%", left: "50%", scale: 0.72 },
    { top: "30%", left: "75%", scale: 0.76 },
    { top: "52%", left: "93%", scale: 0.93 },
  ],
};

function layoutFor(n: number): Pos[] {
  return LAYOUTS[n] ?? LAYOUTS[6];
}

export function PokerTable({ state, deck, theme, reduced, speeches }: PokerTableProps) {
  const n = state.seats.length;
  const positions = layoutFor(n);

  const result = state.result;
  const reveal = state.stage === "complete" && !!result && !result.uncontested;
  const winners = new Set<number>(
    result ? result.pots.flatMap((p) => p.winners) : [],
  );

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

  // ---- First-person "head turn" camera ----
  // The viewport subtly pans/tilts to mimic the player looking around: UP toward
  // the dealer as a new hand is shuffled, DOWN at their own hole cards as they're
  // dealt, then back UP toward the center when the board is revealed. Pure CSS
  // transforms on a wrapper; fully neutralized under reduced motion.
  const [view, setView] = useState<"center" | "up" | "down">("center");
  const prevHand = useRef(state.handNumber);
  const prevBoard = useRef(state.board.length);

  useEffect(() => {
    if (reduced) {
      setView("center");
      return;
    }
    if (state.handNumber === prevHand.current) return;
    prevHand.current = state.handNumber;
    prevBoard.current = 0;
    setView("up"); // watch the dealer shuffle / deal toward us
    const t1 = setTimeout(() => setView("down"), 1050); // glance down at our cards
    const t2 = setTimeout(() => setView("center"), 2300); // settle on the table
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [state.handNumber, reduced]);

  useEffect(() => {
    if (reduced) return;
    if (state.board.length === prevBoard.current) return;
    const grew = state.board.length > prevBoard.current;
    prevBoard.current = state.board.length;
    if (!grew) return;
    setView("up"); // look up toward the community-card reveal
    const t = setTimeout(() => setView("center"), 1150);
    return () => clearTimeout(t);
  }, [state.board.length, reduced]);

  const sceneVars: CSSProperties = {
    ["--pn-felt" as string]: theme.felt,
    ["--pn-rail" as string]: theme.rail,
    ["--pn-glow" as string]: theme.glow,
  };

  return (
    <div className="pn-scene" style={sceneVars}>
      {/* ---- casino room (depth: walls, ambient lights, carpet) ---- */}
      <div className="pn-room" aria-hidden>
        <div className="pn-wall" />
        <div className="pn-ambient" />
        <div className="pn-bg-tables">
          <span className="pn-bg-table pn-bg-table-1" />
          <span className="pn-bg-table pn-bg-table-2" />
          <span className="pn-bg-lamp pn-bg-lamp-1" />
          <span className="pn-bg-lamp pn-bg-lamp-2" />
          <span className="pn-bg-lamp pn-bg-lamp-3" />
        </div>
        <div className="pn-chandelier" />
        <div className="pn-carpet" />
        <div className="pn-vignette" />
      </div>

      {/* ---- first-person camera (head-turn pan/tilt) wraps the 3D stage ---- */}
      <div className={`pn-camera pn-cam-${reduced ? "center" : view}`}>
      {/* ---- 3D stage: tilted felt + players around it ---- */}
      <div className="pn-stage">
        <div className="pn-felt-3d" aria-hidden>
          <div className="pn-felt-surface" />
          <div className="pn-felt-inlay" />
          <div className="pn-felt-spec" />
        </div>

        <Dealer state={state} theme={theme} reduced={reduced} />

        {/* center: community cards + pot */}
        <div className="pn-center">
          <div className="pn-board">
            {state.board.length === 0 ? (
              <span className="pn-board-empty" style={{ color: theme.text }}>
                {state.stage === "complete" ? "Hand over" : "Pre-flop"}
              </span>
            ) : (
              state.board.map((c, i) => (
                // Keyed per hand+slot so the one-shot flip fires only when the
                // dealer first reveals that card (flop cards stagger; turn/river
                // each flip as they arrive).
                <PlayingCard
                  key={`${state.handNumber}-board-${i}-${c}`}
                  card={c}
                  deck={deck}
                  size="md"
                  flip={!reduced}
                  style={
                    !reduced && state.board.length === 3
                      ? { animationDelay: `${i * 150}ms` }
                      : undefined
                  }
                />
              ))
            )}
          </div>
          <div
            className={`pn-pot ${potBump ? "pn-anim-pot-bump" : ""}`}
            style={{ color: theme.text, border: `1px solid ${theme.glow}` }}
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
            isHero={seat.isHuman}
            dealKey={state.handNumber}
            speech={speeches[seat.index]}
          />
        ))}
      </div>
      </div>
    </div>
  );
}

export default PokerTable;
