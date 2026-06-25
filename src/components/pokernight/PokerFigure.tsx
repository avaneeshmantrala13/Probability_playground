import { memo, useId } from "react";
import type { Build, CharacterLook, Expression, Posture } from "./characters";
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
  /** Game-driven facial expression. */
  expression?: Expression;
  /** Stable per-seat number so idle motion is staggered, not synchronized. */
  seatIndex?: number;
  title?: string;
}

const CX = 70;

const SHOULDER: Record<Build, number> = { slim: 42, average: 50, broad: 60 };
/** Posture nudges how high the shoulders sit. */
const SHOULDER_Y: Record<Posture, number> = { lean: 72, upright: 70, relaxed: 74 };

const LINE = "rgb(20 12 6 / 0.28)";

/**
 * A seated, individually-styled poker player drawn entirely in SVG: the shared
 * `<Head>` cleanly seated on a properly-connected neck, a shaded torso sized by
 * build, collar/accessory, and two arms resting forward on the table edge as if
 * holding their cards. The real `PlayingCard`s are layered over the hands by
 * `PlayerSeat`, so deck skins and showdown reveals keep working. Soft gradient
 * shading + key light give it a polished animated look. Memoized — a figure
 * never changes mid-hand.
 */
function PokerFigureImpl({
  look,
  active = false,
  dimmed = false,
  reduced = false,
  talking = false,
  expression = "idle",
  seatIndex = 0,
  title,
}: PokerFigureProps) {
  const raw = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const outfitG = `pn-outfit-${raw}`;
  const sleeveHi = `pn-sleevehi-${raw}`;

  const sw = SHOULDER[look.build];
  const base = sw + 10;
  const shoulderY = SHOULDER_Y[look.posture];

  const armW = look.build === "broad" ? 18 : look.build === "slim" ? 13 : 15;
  const handHalf = 17;
  const lsx = CX - sw + 9;
  const rsx = CX + sw - 9;
  const hlx = CX - handHalf;
  const hrx = CX + handHalf;

  const blinkDelay = 1.4 + (seatIndex % 5) * 1.27;

  return (
    <svg
      className={`pn-figure ${active ? "pn-figure-active" : ""} ${
        !reduced ? "pn-figure-idle" : ""
      } pn-posture-${look.posture}`}
      viewBox="0 0 140 170"
      role="img"
      aria-label={title ?? "Seated poker player"}
      style={{
        ["--pn-fig-accent" as string]: look.accent,
        opacity: dimmed ? 0.62 : 1,
      }}
    >
      <defs>
        <linearGradient id={outfitG} x1="0.15" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor={look.outfit} />
          <stop offset="1" stopColor={look.outfit} />
        </linearGradient>
        <radialGradient id={sleeveHi} cx="0.5" cy="0.2" r="0.9">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* chair back behind the player */}
      <path
        d={`M ${CX - base - 13} 170 L ${CX - base - 13} 94 Q ${CX} 76 ${
          CX + base + 13
        } 94 L ${CX + base + 13} 170 Z`}
        fill="#241a12"
        opacity="0.5"
      />
      <path
        d={`M ${CX - base - 13} 108 Q ${CX} 90 ${CX + base + 13} 108`}
        fill="none"
        stroke="#3a2a1c"
        strokeWidth="4"
        opacity="0.6"
      />

      {/* neck — connects the head cleanly to the shoulders */}
      <path
        d={`M ${CX - 8} 60 L ${CX + 8} 60 L ${CX + 10} ${shoulderY + 2} L ${CX - 10} ${shoulderY + 2} Z`}
        fill={look.skin}
      />
      <path d={`M ${CX - 8} 61 L ${CX + 8} 61 L ${CX + 8} 65 C ${CX + 3} 68 ${CX - 3} 68 ${CX - 8} 65 Z`} fill={look.skinShade} opacity="0.4" />

      {/* arms / sleeves resting forward on the felt */}
      <g className="pn-fig-arms" stroke={`url(#${outfitG})`} strokeWidth={armW} fill="none" strokeLinecap="round">
        <path d={`M ${lsx} ${shoulderY + 10} Q ${lsx - 11} 134 ${hlx} 153`} />
        <path d={`M ${rsx} ${shoulderY + 10} Q ${rsx + 11} 134 ${hrx} 153`} />
      </g>

      {/* torso */}
      <path
        d={`M ${CX - sw} ${shoulderY} C ${CX - sw - 4} ${shoulderY + 12}, ${
          CX - base
        } 126, ${CX - base} 170 L ${CX + base} 170 C ${CX + base} 126, ${
          CX + sw + 4
        } ${shoulderY + 12}, ${CX + sw} ${shoulderY} Z`}
        fill={`url(#${outfitG})`}
        stroke={LINE}
        strokeWidth="0.8"
      />
      {/* shoulder key light + side/center form shadow */}
      <path
        d={`M ${CX - sw} ${shoulderY} C ${CX - sw - 4} ${shoulderY + 12}, ${CX - base} 126, ${CX - base} 170 L ${CX + base} 170 C ${CX + base} 126, ${CX + sw + 4} ${shoulderY + 12}, ${CX + sw} ${shoulderY} Z`}
        fill={`url(#${sleeveHi})`}
      />
      <path d={`M ${CX} ${shoulderY + 6} L ${CX} 170`} stroke="#000" strokeWidth={sw * 0.9} opacity="0.07" />
      <path d={`M ${CX + sw - 6} ${shoulderY + 4} C ${CX + base - 6} 130 ${CX + base - 6} 150 ${CX + base - 4} 170 L ${CX + base} 170 C ${CX + base} 126 ${CX + sw + 4} ${shoulderY + 12} ${CX + sw} ${shoulderY} Z`} fill="#000" opacity="0.1" />

      {/* shirt V + collar */}
      <path d={`M ${CX - 13} ${shoulderY} L ${CX} ${shoulderY + 30} L ${CX + 13} ${shoulderY} Z`} fill={look.outfitTrim} />
      <path d={`M ${CX - 13} ${shoulderY - 1} L ${CX - 4} ${shoulderY + 13} L ${CX} ${shoulderY + 6} Z`} fill={look.outfit} stroke={LINE} strokeWidth="0.6" />
      <path d={`M ${CX + 13} ${shoulderY - 1} L ${CX + 4} ${shoulderY + 13} L ${CX} ${shoulderY + 6} Z`} fill={look.outfit} stroke={LINE} strokeWidth="0.6" />

      {/* placket + buttons for a tailored look */}
      <path d={`M ${CX} ${shoulderY + 18} L ${CX} 168`} stroke={look.outfitTrim} strokeWidth="1.4" opacity="0.45" />
      <g fill={look.outfitTrim} opacity="0.85">
        <circle cx={CX} cy={shoulderY + 40} r="1.7" />
        <circle cx={CX} cy={shoulderY + 60} r="1.7" />
      </g>
      {/* shoulder seams */}
      <path d={`M ${CX - sw + 6} ${shoulderY + 3} Q ${CX - sw - 2} ${shoulderY + 18} ${CX - base + 6} ${shoulderY + 48}`} fill="none" stroke="#000" strokeWidth="1" opacity="0.12" />
      <path d={`M ${CX + sw - 6} ${shoulderY + 3} Q ${CX + sw + 2} ${shoulderY + 18} ${CX + base - 6} ${shoulderY + 48}`} fill="none" stroke="#000" strokeWidth="1" opacity="0.12" />

      <Accessory look={look} shoulderY={shoulderY} />

      {/* hands holding cards */}
      <g className="pn-fig-hands">
        <ellipse cx={hlx} cy={153} rx="8.5" ry="6.8" fill={look.skin} stroke={LINE} strokeWidth="0.6" />
        <ellipse cx={hrx} cy={153} rx="8.5" ry="6.8" fill={look.skin} stroke={LINE} strokeWidth="0.6" />
        {/* knuckle lines */}
        <path d={`M ${hlx - 4} 151 l 0 4 M ${hlx} 150.5 l 0 5 M ${hlx + 4} 151 l 0 4`} stroke={LINE} strokeWidth="0.5" />
        <path d={`M ${hrx - 4} 151 l 0 4 M ${hrx} 150.5 l 0 5 M ${hrx + 4} 151 l 0 4`} stroke={LINE} strokeWidth="0.5" />
        {/* cuffs */}
        <rect x={hlx - 10} y={147} width="11" height="5" rx="2.5" fill={look.outfitTrim} opacity="0.9" />
        <rect x={hrx - 1} y={147} width="11" height="5" rx="2.5" fill={look.outfitTrim} opacity="0.9" />
      </g>

      {/* head — centered on the neck (head art center x=50; 70 - 0.96*50 = 22) */}
      <g className="pn-fig-head" transform="translate(22 -3) scale(0.96)">
        <Head
          look={look}
          blink={!reduced}
          talking={talking && !reduced}
          expression={expression}
          blinkDelay={blinkDelay}
        />
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
          <path d={`M ${CX} ${shoulderY + 9} L ${CX} ${shoulderY + 40}`} stroke="#fff" strokeWidth="0.8" opacity="0.25" />
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
        <path d={`M ${CX - 14} ${shoulderY + 4} Q ${CX} ${shoulderY + 26} ${CX + 14} ${shoulderY + 4}`} fill="none" stroke="#fbbf24" strokeWidth="2.6" strokeLinecap="round" />
      );
    case "earring":
    case "none":
    default:
      return null;
  }
}

export const PokerFigure = memo(PokerFigureImpl);
