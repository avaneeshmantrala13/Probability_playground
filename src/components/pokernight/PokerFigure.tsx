import { memo } from "react";
import type { Build, CharacterLook, Posture } from "./characters";
import { Head } from "./face";

interface PokerFigureProps {
  look: CharacterLook;
  /** Highlight (this player is to act). */
  active?: boolean;
  /** Dim + relax (folded / out of the hand). */
  dimmed?: boolean;
  /** Disable idle blink / breathing. */
  reduced?: boolean;
  /** Animate the mouth while this player has an active line/bubble. */
  talking?: boolean;
  /** Stable per-seat number so idle motion is staggered, not synchronized. */
  seatIndex?: number;
  title?: string;
}

const CX = 70;

const SHOULDER: Record<Build, number> = { slim: 40, average: 48, broad: 58 };
/** Posture nudges how high the shoulders sit + a slight forward lean class. */
const SHOULDER_Y: Record<Posture, number> = { lean: 74, upright: 72, relaxed: 76 };

/**
 * A seated, individual-looking poker player drawn entirely in SVG: head (shared
 * `<Head>` primitives), torso sized by build, collar/accessory, and two arms
 * resting forward on the table edge as if holding their cards. The real
 * `PlayingCard`s are layered over the hands by `PlayerSeat`, so deck skins and
 * showdown reveals keep working. Memoized — a figure never changes mid-hand.
 */
function PokerFigureImpl({
  look,
  active = false,
  dimmed = false,
  reduced = false,
  talking = false,
  seatIndex = 0,
  title,
}: PokerFigureProps) {
  const sw = SHOULDER[look.build];
  const base = sw + 9;
  const shoulderY = SHOULDER_Y[look.posture];

  // Arms: thick round strokes from inside the shoulders to the hands at the
  // table edge (bottom-center), where the hole cards are layered on top.
  const armW = look.build === "broad" ? 17 : look.build === "slim" ? 12 : 14;
  const handHalf = 17;
  const lsx = CX - sw + 8;
  const rsx = CX + sw - 8;
  const hlx = CX - handHalf;
  const hrx = CX + handHalf;

  // A darker shade of the outfit for arm/torso depth.
  const sleeve = look.outfit;

  const blinkDelay = 1.4 + (seatIndex % 5) * 1.27;

  return (
    <svg
      className={`pn-figure ${active ? "pn-figure-active" : ""} ${
        !reduced ? "pn-figure-idle" : ""
      } pn-posture-${look.posture}`}
      viewBox="0 0 140 168"
      role="img"
      aria-label={title ?? "Seated poker player"}
      style={{
        ["--pn-fig-accent" as string]: look.accent,
        opacity: dimmed ? 0.6 : 1,
      }}
    >
      {/* chair back behind the player */}
      <path
        d={`M ${CX - base - 12} 168 L ${CX - base - 12} 96 Q ${CX} 78 ${
          CX + base + 12
        } 96 L ${CX + base + 12} 168 Z`}
        fill="#241a12"
        opacity="0.55"
      />
      <path
        d={`M ${CX - base - 12} 110 Q ${CX} 92 ${CX + base + 12} 110`}
        fill="none"
        stroke="#3a2a1c"
        strokeWidth="4"
        opacity="0.7"
      />

      {/* arms / sleeves resting forward on the felt */}
      <g className="pn-fig-arms" stroke={sleeve} strokeWidth={armW} fill="none" strokeLinecap="round">
        <path d={`M ${lsx} ${shoulderY + 12} Q ${lsx - 10} 132 ${hlx} 152`} />
        <path d={`M ${rsx} ${shoulderY + 12} Q ${rsx + 10} 132 ${hrx} 152`} />
      </g>

      {/* torso */}
      <path
        d={`M ${CX - sw} ${shoulderY} C ${CX - sw - 4} ${shoulderY + 12}, ${
          CX - base
        } 124, ${CX - base} 168 L ${CX + base} 168 C ${CX + base} 124, ${
          CX + sw + 4
        } ${shoulderY + 12}, ${CX + sw} ${shoulderY} Z`}
        fill={look.outfit}
      />
      {/* torso center shading for form */}
      <path
        d={`M ${CX} ${shoulderY + 4} L ${CX} 168`}
        stroke="#000"
        strokeWidth={sw}
        opacity="0.06"
      />

      {/* shirt V + collar */}
      <path d={`M ${CX - 13} ${shoulderY} L ${CX} ${shoulderY + 30} L ${CX + 13} ${shoulderY} Z`} fill={look.outfitTrim} />
      <path d={`M ${CX - 13} ${shoulderY} L ${CX - 4} ${shoulderY + 12} L ${CX} ${shoulderY + 6} Z`} fill={look.outfit} />
      <path d={`M ${CX + 13} ${shoulderY} L ${CX + 4} ${shoulderY + 12} L ${CX} ${shoulderY + 6} Z`} fill={look.outfit} />

      <Accessory look={look} shoulderY={shoulderY} />

      {/* hands holding cards */}
      <g className="pn-fig-hands">
        <ellipse cx={hlx} cy={152} rx="8" ry="6.5" fill={look.skin} />
        <ellipse cx={hrx} cy={152} rx="8" ry="6.5" fill={look.skin} />
        {/* cuffs */}
        <rect x={hlx - 9} y={146} width="10" height="5" rx="2.5" fill={look.outfitTrim} opacity="0.9" />
        <rect x={hrx - 1} y={146} width="10" height="5" rx="2.5" fill={look.outfitTrim} opacity="0.9" />
      </g>

      {/* head (with subtle idle breathing handled in CSS on .pn-fig-head) */}
      <g className="pn-fig-head" transform="translate(22 -5) scale(0.96)">
        <Head look={look} blink={!reduced} talking={talking && !reduced} blinkDelay={blinkDelay} />
      </g>
    </svg>
  );
}

function Accessory({ look, shoulderY }: { look: CharacterLook; shoulderY: number }) {
  switch (look.accessory) {
    case "tie":
      return (
        <g>
          <path d={`M ${CX - 4} ${shoulderY + 2} L ${CX + 4} ${shoulderY + 2} L ${CX + 3} ${shoulderY + 8} L ${CX - 3} ${shoulderY + 8} Z`} fill={look.accent} />
          <path d={`M ${CX - 4} ${shoulderY + 8} L ${CX + 4} ${shoulderY + 8} L ${CX + 6} ${shoulderY + 34} L ${CX} ${shoulderY + 42} L ${CX - 6} ${shoulderY + 34} Z`} fill={look.accent} />
        </g>
      );
    case "bowtie":
      return (
        <g fill={look.accent}>
          <path d={`M ${CX} ${shoulderY + 4} L ${CX - 12} ${shoulderY - 2} L ${CX - 12} ${shoulderY + 10} Z`} />
          <path d={`M ${CX} ${shoulderY + 4} L ${CX + 12} ${shoulderY - 2} L ${CX + 12} ${shoulderY + 10} Z`} />
          <rect x={CX - 3} y={shoulderY} width="6" height="8" rx="2" />
        </g>
      );
    case "scarf":
      return (
        <path d={`M ${CX - 16} ${shoulderY - 2} Q ${CX} ${shoulderY + 14} ${CX + 16} ${shoulderY - 2} L ${CX + 13} ${shoulderY + 6} Q ${CX} ${shoulderY + 20} ${CX - 13} ${shoulderY + 6} Z`} fill={look.accent} opacity="0.92" />
      );
    case "chain":
      return (
        <path d={`M ${CX - 14} ${shoulderY + 4} Q ${CX} ${shoulderY + 26} ${CX + 14} ${shoulderY + 4}`} fill="none" stroke="#fbbf24" strokeWidth="2.4" strokeLinecap="round" />
      );
    case "earring":
    case "none":
    default:
      return null;
  }
}

export const PokerFigure = memo(PokerFigureImpl);
