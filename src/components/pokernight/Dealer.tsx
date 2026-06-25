import { memo, useEffect, useRef, useState } from "react";
import type { TableTheme } from "../../lib/cosmetics";
import type { GameState } from "../../lib/poker";
import { DEALER_LOOK } from "./characters";
import { PokerAvatar } from "./PokerAvatar";

interface DealerProps {
  state: GameState;
  theme: TableTheme;
  reduced: boolean;
}

type DealerPhase = "idle" | "shuffle" | "deal" | "reveal";

const STREET_LABEL: Record<string, string> = {
  flop: "Flop",
  turn: "Turn",
  river: "River",
};

/**
 * The non-playing croupier at the top of the table. It reacts to engine state
 * transitions surfaced through `usePokerGame`:
 *   - a new hand (handNumber changes)  -> SHUFFLE, then DEAL
 *   - the board grows (flop/turn/river) -> REVEAL gesture
 * All motion is GPU-friendly and fully suppressed under reduced motion.
 */
function DealerImpl({ state, theme, reduced }: DealerProps) {
  const [phase, setPhase] = useState<DealerPhase>("idle");
  const [say, setSay] = useState<string>("");
  const prevHand = useRef(state.handNumber);
  const prevBoard = useRef(state.board.length);

  // New hand -> shuffle then deal.
  useEffect(() => {
    if (state.handNumber === prevHand.current) return;
    prevHand.current = state.handNumber;
    prevBoard.current = state.board.length;
    if (reduced) {
      setPhase("idle");
      setSay("");
      return;
    }
    setPhase("shuffle");
    setSay("Shuffling up…");
    const t1 = window.setTimeout(() => {
      setPhase("deal");
      setSay("Dealing.");
    }, 640);
    const t2 = window.setTimeout(() => {
      setPhase("idle");
      setSay("");
    }, 1340);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [state.handNumber, state.board.length, reduced]);

  // Board grew -> reveal the new street.
  useEffect(() => {
    if (state.board.length === prevBoard.current) return;
    const grew = state.board.length > prevBoard.current;
    prevBoard.current = state.board.length;
    if (!grew || reduced) return;
    setPhase("reveal");
    setSay(STREET_LABEL[state.stage] ?? "Reveal");
    const t = window.setTimeout(() => {
      setPhase("idle");
      setSay("");
    }, 720);
    return () => window.clearTimeout(t);
  }, [state.board.length, state.stage, reduced]);

  const active = phase !== "idle";

  return (
    <div className="pn-dealer" aria-hidden={false}>
      <div className={`pn-dealer-stage ${active ? "pn-dealer-busy" : ""}`}>
        <PokerAvatar
          look={DEALER_LOOK}
          size={64}
          active={active}
          title="The dealer"
        />
        {/* riffling deck the dealer works between hands */}
        <div className={`pn-deck-stack ${phase === "shuffle" ? "pn-deck-shuffle" : ""}`}>
          <span className="pn-deck-slab pn-deck-slab-a" />
          <span className="pn-deck-slab pn-deck-slab-b" />
          <span className="pn-deck-slab pn-deck-slab-c" />
        </div>
      </div>

      <div className="pn-dealer-name" style={{ color: theme.text }}>
        Dealer
      </div>

      {say && (
        <div
          className={`pn-dealer-say ${reduced ? "" : "pn-anim-bubble"}`}
          style={{ borderColor: theme.glow }}
        >
          {say}
        </div>
      )}
    </div>
  );
}

export const Dealer = memo(DealerImpl);
