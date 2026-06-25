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
  /** Live gaze offset (eyes ex/ey + subtle head lean hx/hy), head-local units. */
  gaze?: { ex: number; ey: number; hx: number; hy: number };
  /** Normalized body turn (-1 strong screen-left .. +1 strong screen-right) so
   *  the volume shading (core shadow / rim / side plane) follows the yaw. */
  turn?: number;
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
  gaze = { ex: 0, ey: 0, hx: 0, hy: 0 },
  turn = 0,
  seatIndex = 0,
  title,
}: PokerFigureProps) {
  const raw = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const outfitG = `pn-outfit-${raw}`;
  const sleeveHi = `pn-sleevehi-${raw}`;
  const rimW = `pn-rimw-${raw}`;
  const bodyCyl = `pn-bodycyl-${raw}`;
  const bodyHi = `pn-bodyhi-${raw}`;
  const shoulderHi = `pn-shldr-${raw}`;
  const sheen = look.sheen ?? 0.4;

  // Turn-driven volume cues: as the torso rotates tangent to the table, deepen the
  // far-side core shadow + side plane and brighten the near-side rim so the body
  // reads as a rounded volume, not a flat sheared panel. `farSign`: +1 right edge
  // recedes (left-of-centre seats), -1 left edge recedes (right seats).
  const t = Math.max(-1, Math.min(1, turn));
  const at = Math.abs(t);
  const farSign = t >= 0 ? 1 : -1;

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
        // desync the idle body sway between seats
        animationDelay: `${-((seatIndex % 5) * 1.7)}s`,
      }}
    >
      <defs>
        <linearGradient id={outfitG} x1="0.2" y1="0" x2="0.78" y2="1">
          <stop offset="0" stopColor={look.outfit} />
          <stop offset="1" stopColor={look.outfit} />
        </linearGradient>
        {/* material sheen — stronger for satin/silk personas, faint for matte */}
        <radialGradient id={sleeveHi} cx="0.42" cy="0.16" r="0.95">
          <stop offset="0" stopColor="#ffffff" stopOpacity={0.1 + sheen * 0.34} />
          <stop offset="0.6" stopColor="#ffffff" stopOpacity={sheen * 0.06} />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        {/* warm casino rim light down the right side */}
        <linearGradient id={rimW} x1="1" y1="0" x2="0.4" y2="0.5">
          <stop offset="0" stopColor="#ffd9a0" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ffd9a0" stopOpacity="0" />
        </linearGradient>
        {/* horizontal BARREL shading across the torso — dark at both edges, a lit
            meridian left-of-centre — so the chest reads as a rounded cylinder even
            when the figure is rotated to 3/4 (kills the flat-card look) */}
        <linearGradient id={bodyCyl} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.44" />
          <stop offset="0.13" stopColor="#000" stopOpacity="0.15" />
          <stop offset="0.34" stopColor="#000" stopOpacity="0" />
          <stop offset="0.57" stopColor="#000" stopOpacity="0.06" />
          <stop offset="0.81" stopColor="#000" stopOpacity="0.26" />
          <stop offset="1" stopColor="#000" stopOpacity="0.5" />
        </linearGradient>
        {/* soft key-light band running down the chest meridian */}
        <linearGradient id={bodyHi} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0.12" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.32" stopColor="#fff" stopOpacity={0.14 + sheen * 0.18} />
          <stop offset="0.48" stopColor="#fff" stopOpacity="0.03" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        {/* rounded shoulder cap highlight */}
        <radialGradient id={shoulderHi} cx="0.4" cy="0.3" r="0.7">
          <stop offset="0" stopColor="#fff" stopOpacity={0.22 + sheen * 0.2} />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
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

      {/* arms / sleeves resting forward on the felt — drawn as rounded tubes:
          base stroke, an upper sheen stroke, and an underside core shadow so the
          upper arms read cylindrical, not flat ribbons */}
      <g className="pn-fig-arms" fill="none" strokeLinecap="round">
        <path d={`M ${lsx} ${shoulderY + 10} Q ${lsx - 11} 134 ${hlx} 153`} stroke={`url(#${outfitG})`} strokeWidth={armW} />
        <path d={`M ${rsx} ${shoulderY + 10} Q ${rsx + 11} 134 ${hrx} 153`} stroke={`url(#${outfitG})`} strokeWidth={armW} />
        {/* underside core shadow */}
        <path d={`M ${lsx + 1} ${shoulderY + 13} Q ${lsx - 8} 135 ${hlx + 2} 155`} stroke="#000" strokeWidth={armW * 0.5} opacity="0.18" />
        <path d={`M ${rsx - 1} ${shoulderY + 13} Q ${rsx + 8} 135 ${hrx - 2} 155`} stroke="#000" strokeWidth={armW * 0.5} opacity="0.18" />
        {/* upper sheen ridge */}
        <path d={`M ${lsx - 2} ${shoulderY + 9} Q ${lsx - 13} 132 ${hlx - 2} 151`} stroke="#fff" strokeWidth={armW * 0.28} opacity={0.1 + sheen * 0.14} />
        <path d={`M ${rsx + 2} ${shoulderY + 9} Q ${rsx + 13} 132 ${hrx + 2} 151`} stroke="#fff" strokeWidth={armW * 0.28} opacity={0.1 + sheen * 0.14} />
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
      {/* barrel shading: rounded cylinder form across the chest (always on) */}
      <path
        d={`M ${CX - sw} ${shoulderY} C ${CX - sw - 4} ${shoulderY + 12}, ${CX - base} 126, ${CX - base} 170 L ${CX + base} 170 C ${CX + base} 126, ${CX + sw + 4} ${shoulderY + 12}, ${CX + sw} ${shoulderY} Z`}
        fill={`url(#${bodyCyl})`}
      />
      <path
        d={`M ${CX - sw} ${shoulderY} C ${CX - sw - 4} ${shoulderY + 12}, ${CX - base} 126, ${CX - base} 170 L ${CX + base} 170 C ${CX + base} 126, ${CX + sw + 4} ${shoulderY + 12}, ${CX + sw} ${shoulderY} Z`}
        fill={`url(#${bodyHi})`}
      />
      {/* shoulder key light + side/center form shadow */}
      <path
        d={`M ${CX - sw} ${shoulderY} C ${CX - sw - 4} ${shoulderY + 12}, ${CX - base} 126, ${CX - base} 170 L ${CX + base} 170 C ${CX + base} 126, ${CX + sw + 4} ${shoulderY + 12}, ${CX + sw} ${shoulderY} Z`}
        fill={`url(#${sleeveHi})`}
      />
      <path d={`M ${CX} ${shoulderY + 6} L ${CX} 170`} stroke="#000" strokeWidth={sw * 0.9} opacity="0.07" />
      {/* rounded shoulder caps for real shoulder volume */}
      <ellipse cx={CX - sw + 7} cy={shoulderY + 7} rx="13" ry="11" fill={`url(#${shoulderHi})`} />
      <ellipse cx={CX + sw - 7} cy={shoulderY + 7} rx="13" ry="11" fill={`url(#${shoulderHi})`} />

      {/* ---- turn-driven volume: far-side core shadow + side plane, near-side rim
              so the rotated torso reads as a dimensional body, not a sheared card ---- */}
      {at > 0.04 && (
        <g>
          {/* far-side core shadow hugging the receding edge */}
          <path
            d={`M ${CX + farSign * (sw - 3)} ${shoulderY + 2}
                C ${CX + farSign * (base - 1)} 122 ${CX + farSign * (base - 1)} 150 ${CX + farSign * (base + 1)} 170
                L ${CX + farSign * (base - 11)} 170
                C ${CX + farSign * (base - 13)} 144 ${CX + farSign * (sw - 12)} 116 ${CX + farSign * (sw - 13)} ${shoulderY + 6} Z`}
            fill="#000"
            opacity={0.12 + 0.34 * at}
          />
          {/* thin side plane (the body's visible "thickness") on the far edge */}
          <path
            d={`M ${CX + farSign * (base - 1)} 168
                C ${CX + farSign * (base - 1)} 130 ${CX + farSign * (sw - 2)} ${shoulderY + 14} ${CX + farSign * (sw - 1)} ${shoulderY + 3}
                L ${CX + farSign * (sw - 5)} ${shoulderY + 4}
                C ${CX + farSign * (sw - 6)} ${shoulderY + 16} ${CX + farSign * (base - 6)} 132 ${CX + farSign * (base - 6)} 168 Z`}
            fill="#000"
            opacity={0.32 + 0.3 * at}
          />
          {/* near-side warm rim catching the leading edge */}
          <path
            d={`M ${CX - farSign * (sw - 1)} ${shoulderY + 3} C ${CX - farSign * (base - 3)} 124 ${CX - farSign * (base - 2)} 150 ${CX - farSign * (base - 2)} 168`}
            fill="none"
            stroke="#ffdca6"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity={0.22 + 0.4 * at}
          />
        </g>
      )}

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

      {/* fabric folds draping from the collar and shoulders */}
      <g fill="none" stroke="#000" opacity="0.12" strokeLinecap="round">
        <path d={`M ${CX - 8} ${shoulderY + 22} Q ${CX - 12} ${shoulderY + 70} ${CX - 10} 168`} strokeWidth="1.5" />
        <path d={`M ${CX + 8} ${shoulderY + 22} Q ${CX + 12} ${shoulderY + 70} ${CX + 10} 168`} strokeWidth="1.5" />
        <path d={`M ${CX - sw + 12} ${shoulderY + 16} Q ${CX - base + 18} 128 ${CX - base + 22} 166`} strokeWidth="1.2" />
        <path d={`M ${CX + sw - 12} ${shoulderY + 16} Q ${CX + base - 18} 128 ${CX + base - 22} 166`} strokeWidth="1.2" />
      </g>
      {/* ambient occlusion where the arms tuck into the torso */}
      <path d={`M ${CX - sw + 1} ${shoulderY + 5} Q ${CX - sw - 7} ${shoulderY + 20} ${CX - sw + 3} ${shoulderY + 33} Q ${CX - sw + 7} ${shoulderY + 18} ${CX - sw + 1} ${shoulderY + 5} Z`} fill="#000" opacity="0.16" />
      <path d={`M ${CX + sw - 1} ${shoulderY + 5} Q ${CX + sw + 7} ${shoulderY + 20} ${CX + sw - 3} ${shoulderY + 33} Q ${CX + sw - 7} ${shoulderY + 18} ${CX + sw - 1} ${shoulderY + 5} Z`} fill="#000" opacity="0.16" />
      {/* warm casino rim light catching the right shoulder + arm */}
      <path d={`M ${CX + sw - 1} ${shoulderY + 2} C ${CX + sw + 3} ${shoulderY + 16} ${CX + base - 3} 130 ${CX + base - 4} 166`} fill="none" stroke={`url(#${rimW})`} strokeWidth="2.4" strokeLinecap="round" />
      {/* upper-chest material sheen (intensity set by the persona's fabric) */}
      <ellipse cx={CX - 9} cy={shoulderY + 30} rx="15" ry="22" fill={`url(#${sleeveHi})`} />

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

      {/* Head positioning lives on an OUTER, STATIC <g> (SVG transform attribute)
          — NOT on .pn-fig-head — because the CSS `pn-breathe` animation sets the
          `transform` property on .pn-fig-head, which would otherwise override the
          SVG transform attribute and snap the head back to its native box (center
          x=50) while the neck is at x=70, throwing it far to the left.
          The head art is symmetric about x=50 in its own 100-unit box; with
          scale 0.96 its center maps to 22 + 0.96*50 = 70 = CX (neck/torso center),
          so the head sits dead-center on the neck. The inner .pn-fig-head only
          carries the breathe bob, which now composes on top of this positioning. */}
      <g transform={`translate(${CX - 48} -3) scale(0.96)`}>
        <g className="pn-fig-head" style={{ animationDelay: `${-((seatIndex % 5) * 1.3)}s` }}>
          {/* head counter-turn: when the body is turned tangent to the table, the
              head yaws back partway (via --pn-head-yaw on the wrap) so the face
              stays ~3/4 visible. Self-contained `perspective()` so the 3D turn
              renders without relying on parent preserve-3d. */}
          <g className="pn-fig-headturn">
            {/* gaze head-lean: a subtle follow toward the look target. */}
            <g className="pn-fig-gaze" style={{ transform: `translate(${gaze.hx}px, ${gaze.hy}px)` }}>
              <Head
                look={look}
                blink={!reduced}
                talking={talking && !reduced}
                expression={expression}
                blinkDelay={blinkDelay}
                gaze={{ dx: gaze.ex, dy: gaze.ey }}
              />
            </g>
          </g>
        </g>
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
