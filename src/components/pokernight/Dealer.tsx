import { memo, useEffect, useRef, useState } from "react";
import type { TableTheme } from "../../lib/cosmetics";
import type { GameState } from "../../lib/poker";
import { DEALER_LOOK, type Expression } from "./characters";
import { Head } from "./face";

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
 * The standing, sharply-dressed house dealer behind the table. It reacts to
 * engine transitions surfaced through `usePokerGame`:
 *   - a new hand (handNumber changes)   -> a clearly visible RIFFLE/BRIDGE
 *     SHUFFLE, then a DEAL (arm sweeps out)
 *   - the board grows (flop/turn/river) -> REVEAL gesture, synced to the
 *     community cards physically flipping face-up (PlayingCard `flip`)
 * The dealer's mouth animates while it announces each phase. All motion is
 * GPU-friendly (transform/opacity) and fully suppressed under reduced motion.
 */
function DealerImpl({ state, theme, reduced }: DealerProps) {
  const [phase, setPhase] = useState<DealerPhase>("idle");
  const [say, setSay] = useState<string>("");
  const prevHand = useRef(state.handNumber);
  const prevBoard = useRef(state.board.length);

  useEffect(() => {
    if (state.handNumber === prevHand.current) return;
    prevHand.current = state.handNumber;
    prevBoard.current = state.board.length;
    if (reduced) {
      setPhase("idle");
      setSay("");
      return;
    }
    // Clear, visible shuffle before every hand, then deal.
    setPhase("shuffle");
    setSay("Shuffling up…");
    const t1 = window.setTimeout(() => {
      setPhase("deal");
      setSay("Dealing.");
    }, 1400);
    const t2 = window.setTimeout(() => {
      setPhase("idle");
      setSay("");
    }, 2700);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [state.handNumber, state.board.length, reduced]);

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
    }, 1200);
    return () => window.clearTimeout(t);
  }, [state.board.length, state.stage, reduced]);

  const active = phase !== "idle";
  const reaching = phase === "deal" || phase === "reveal";
  const shuffling = phase === "shuffle";
  // Mouth moves exactly while the dealer's speech bubble (`say`) is visible, and
  // stops the instant it clears — keeping lip-sync in sync with the bubble.
  const talking = !!say && !reduced;
  // The dealer emotes too: focused while shuffling, pleased on a reveal, and a
  // clever resting smirk (DEALER_LOOK baseline) otherwise.
  const dealerExpr: Expression =
    phase === "shuffle" ? "think" : phase === "reveal" ? "happy" : "idle";

  return (
    <div className="pn-dealer" aria-hidden={false}>
      <svg
        className={`pn-dealer-fig ${active ? "pn-dealer-busy" : ""}`}
        viewBox="0 0 140 150"
        role="img"
        aria-label="The dealer"
      >
        <defs>
          <linearGradient id="pn-dealer-rim" x1="1" y1="0" x2="0.5" y2="0.4">
            <stop offset="0" stopColor="#ffd9a0" stopOpacity="0.5" />
            <stop offset="1" stopColor="#ffd9a0" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="pn-dealer-jacket" x1="0.2" y1="0" x2="0.85" y2="1">
            <stop offset="0" stopColor="#141a30" />
            <stop offset="0.6" stopColor="#0b1020" />
            <stop offset="1" stopColor="#070a16" />
          </linearGradient>
          {/* horizontal barrel shade across the jacket for rounded chest volume */}
          <linearGradient id="pn-dealer-cyl" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#000" stopOpacity="0.5" />
            <stop offset="0.14" stopColor="#000" stopOpacity="0.16" />
            <stop offset="0.36" stopColor="#000" stopOpacity="0" />
            <stop offset="0.58" stopColor="#000" stopOpacity="0.06" />
            <stop offset="0.82" stopColor="#000" stopOpacity="0.28" />
            <stop offset="1" stopColor="#000" stopOpacity="0.54" />
          </linearGradient>
          <radialGradient id="pn-dealer-shldr" cx="0.4" cy="0.3" r="0.7">
            <stop offset="0" stopColor="#5566aa" stopOpacity="0.4" />
            <stop offset="0.6" stopColor="#5566aa" stopOpacity="0.08" />
            <stop offset="1" stopColor="#5566aa" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* suit jacket (gradient-shaded broadcloth) */}
        <path d="M40 70 C35 86 31 110 31 150 L109 150 C109 110 105 86 100 70 C90 64 81 62 70 62 C59 62 50 64 40 70 Z" fill="url(#pn-dealer-jacket)" />
        {/* barrel shading -> rounded torso form (not a flat panel) */}
        <path d="M40 70 C35 86 31 110 31 150 L109 150 C109 110 105 86 100 70 C90 64 81 62 70 62 C59 62 50 64 40 70 Z" fill="url(#pn-dealer-cyl)" />
        {/* rounded shoulder caps */}
        <ellipse cx="48" cy="74" rx="15" ry="11" fill="url(#pn-dealer-shldr)" />
        <ellipse cx="92" cy="74" rx="15" ry="11" fill="url(#pn-dealer-shldr)" />
        {/* jacket shoulder sheen (upper-left key light) + deep side/center shadow */}
        <path d="M40 70 C37 80 34 96 33 112 C40 96 48 80 58 72 C50 70 44 70 40 70 Z" fill="#22304f" opacity="0.7" />
        <path d="M100 70 C105 86 109 110 109 150 L101 150 C101 112 99 90 92 74 Z" fill="#000" opacity="0.22" />
        <path d="M70 102 L70 150" stroke="#000" strokeWidth="10" opacity="0.2" />
        {/* fabric folds falling from the shoulders */}
        <g fill="none" stroke="#000" opacity="0.16" strokeLinecap="round">
          <path d="M49 78 C45 102 45 128 48 150" strokeWidth="2" />
          <path d="M91 78 C95 102 95 128 92 150" strokeWidth="2" />
          <path d="M60 98 C58 118 58 136 60 150" strokeWidth="1.3" />
          <path d="M80 98 C82 118 82 136 80 150" strokeWidth="1.3" />
        </g>
        {/* warm casino rim down the right edge of the jacket */}
        <path d="M99 72 C104 88 108 112 108 150" fill="none" stroke="url(#pn-dealer-rim)" strokeWidth="2.6" strokeLinecap="round" />
        {/* white dress shirt + soft fold */}
        <path d="M58 66 L70 102 L82 66 C78 63 74 62 70 62 C66 62 62 63 58 66 Z" fill="#f1f5f9" />
        <path d="M58 66 L70 102 L70 64 C66 62 62 63 58 66 Z" fill="#dbe2ea" opacity="0.8" />
        <path d="M70 70 L70 100" stroke="#c7d2dd" strokeWidth="0.8" opacity="0.6" />
        {/* collar ambient occlusion under the bowtie */}
        <path d="M62 64 Q70 70 78 64 L78 67 Q70 72 62 67 Z" fill="#000" opacity="0.22" />
        {/* satin lapels with a lit edge for depth */}
        <path d="M58 66 L65 88 L70 76 Z" fill="#161d33" />
        <path d="M82 66 L75 88 L70 76 Z" fill="#161d33" />
        <path d="M58 66 L65 88" stroke="#36446a" strokeWidth="1" opacity="0.85" strokeLinecap="round" />
        <path d="M82 66 L75 88" stroke="#36446a" strokeWidth="1" opacity="0.85" strokeLinecap="round" />
        {/* bowtie */}
        <g fill={theme.glow}>
          <path d="M70 70 L58 65 L58 77 Z" />
          <path d="M70 70 L82 65 L82 77 Z" />
          <rect x="67" y="67" width="6" height="7" rx="2" />
        </g>
        {/* pocket square */}
        <rect x="92" y="84" width="7" height="5" rx="1" fill={theme.glow} opacity="0.85" />

        {/* left arm resting */}
        <path d="M42 72 Q26 96 32 124 L46 124 Q42 98 54 80 Z" fill="#0b1020" />
        <ellipse cx="36" cy="124" rx="8.5" ry="6.5" fill={DEALER_LOOK.skin} />

        {/* right (dealing) arm — sweeps toward the board on deal/reveal */}
        <g className={`pn-dealer-arm ${reaching ? "pn-dealer-arm-go" : ""}`}>
          <path d="M98 72 Q114 96 108 124 L94 124 Q98 98 86 80 Z" fill="#0b1020" />
          <ellipse cx="104" cy="124" rx="9" ry="7" fill={DEALER_LOOK.skin} />
          <rect x="108" y="117" width="11" height="15" rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" transform="rotate(20 113 124)" />
        </g>

        {/* Head positioning on an OUTER static <g> so the busy `pn-breathe`
            animation on .pn-fig-head can't override the SVG transform and shove
            the head off the neck. Head art center x=50; with scale 0.96 that maps
            to 22 + 0.96*50 = 70 = the dealer's neck/collar center (paths run
            58..82). The inner .pn-fig-head only carries the breathe bob. */}
        <g transform="translate(22 -6) scale(0.96)">
          <g className="pn-fig-head">
            <Head
              look={DEALER_LOOK}
              blink={!reduced}
              talking={talking}
              expression={dealerExpr}
              blinkDelay={0.4}
            />
          </g>
        </g>

        {/* riffle / bridge shuffle in the dealer's hands (centered) */}
        <g className={`pn-shuffle ${shuffling ? "pn-shuffle-go" : ""}`}>
          {/* left packet */}
          <g className="pn-shuf-left">
            <rect x="52" y="120" width="15" height="21" rx="2" fill="#fbfcfe" stroke="#94a3b8" strokeWidth="0.8" />
            <rect x="50.5" y="121.5" width="15" height="21" rx="2" fill="#eef2f7" stroke="#94a3b8" strokeWidth="0.8" />
          </g>
          {/* right packet */}
          <g className="pn-shuf-right">
            <rect x="73" y="120" width="15" height="21" rx="2" fill="#fbfcfe" stroke="#94a3b8" strokeWidth="0.8" />
            <rect x="74.5" y="121.5" width="15" height="21" rx="2" fill="#eef2f7" stroke="#94a3b8" strokeWidth="0.8" />
          </g>
          {/* bridge arch of springing cards */}
          <g className="pn-shuf-bridge" fill="#fbfcfe" stroke="#94a3b8" strokeWidth="0.6">
            <rect x="60" y="116" width="6" height="9" rx="1.5" transform="rotate(-20 63 120)" />
            <rect x="66" y="113" width="6" height="9" rx="1.5" transform="rotate(-7 69 117)" />
            <rect x="72" y="113" width="6" height="9" rx="1.5" transform="rotate(7 75 117)" />
            <rect x="78" y="116" width="6" height="9" rx="1.5" transform="rotate(20 81 120)" />
          </g>
        </g>
      </svg>

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
