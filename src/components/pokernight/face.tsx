import { memo, useId } from "react";
import type { BrowStyle, CharacterLook, Expression } from "./characters";

/**
 * Shared, parametric FACE primitives for Poker Night characters.
 *
 * Everything from the neck up is drawn here in a normalized 100x100 box (head
 * centered on cx=50, cy≈43). Both the round seat avatar and the full seated
 * `PokerFigure` embed `<Head>` so a persona looks identical whether shown as a
 * bust or a body.
 *
 * Art direction: a polished, hand-drawn animated look — soft gradient skin with
 * an upper-left key light + lower-right form shadow, clean dark linework, layered
 * hair, and EXPRESSIVE, game-driven features. The `expression` prop reshapes the
 * brows, eyes and mouth in real time (think / concerned / smug / happy / sad),
 * while `idle` falls back to the persona's resting brow + mouth. `talking`
 * overlays a lip-sync mouth. 100% original SVG (no images, no copyrighted
 * assets, no network); all motion is cheap transform/opacity CSS, suppressed
 * under reduced motion.
 */

interface HeadProps {
  look: CharacterLook;
  /** Enable the occasional idle blink + eye motion (off under reduced motion). */
  blink?: boolean;
  /** Animate the mouth as if talking (while a line/bubble is active). */
  talking?: boolean;
  /** Game-driven emotion. */
  expression?: Expression;
  /** Stagger so figures don't blink / glance in unison (seconds). */
  blinkDelay?: number;
  /** Where the eyes are looking, head-local units (gaze system). */
  gaze?: { dx: number; dy: number };
}

const LINE = "rgb(35 22 14 / 0.34)";

type BrowMode = "rest" | "think" | "worried" | "cocky" | "up" | "sad";
type EyeMode = "rest" | "up" | "wide" | "narrow" | "happy" | "down";
type MouthMode = "neutral" | "rest" | "press" | "oh" | "smirk" | "beam" | "frown";

/**
 * Maps a game emotion to a distinct brow / eye / mouth shape. Each expression is
 * pushed to read clearly at on-screen figure size:
 *   idle      relaxed neutral mouth + calm resting brows (NOT a grin)
 *   think     brows furrowed together + eyes glancing up & aside + pursed mouth
 *   concerned raised inner brows + widened eyes + slightly open frown
 *   smug      one cocked brow + narrowed eyes + asymmetric smirk
 *   happy     lifted brows + closed "^ ^" eyes + open beaming smile
 *   sad       inner-up brows + downcast eyes + frown
 */
function modesFor(expr: Expression): {
  brow: BrowMode;
  eye: EyeMode;
  mouth: MouthMode;
} {
  switch (expr) {
    case "think":
      return { brow: "think", eye: "up", mouth: "press" };
    case "concerned":
      return { brow: "worried", eye: "wide", mouth: "oh" };
    case "smug":
      return { brow: "cocky", eye: "narrow", mouth: "smirk" };
    case "happy":
      return { brow: "up", eye: "happy", mouth: "beam" };
    case "sad":
      return { brow: "sad", eye: "down", mouth: "frown" };
    case "idle":
    default:
      return { brow: "rest", eye: "rest", mouth: "neutral" };
  }
}

function HeadImpl({
  look,
  blink = false,
  talking = false,
  expression = "idle",
  blinkDelay = 0,
  gaze = { dx: 0, dy: 0 },
}: HeadProps) {
  const raw = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const skinG = `pn-skin-${raw}`;
  const hiG = `pn-hi-${raw}`;
  const shG = `pn-sh-${raw}`;
  const rimG = `pn-rim-${raw}`;
  const aoG = `pn-ao-${raw}`;
  const cylG = `pn-cyl-${raw}`;
  const irisG = `pn-iris-${raw}`;
  const hairG = `pn-hair-${raw}`;
  const hairSh = `pn-hairsh-${raw}`;

  const m = modesFor(expression);

  return (
    <g>
      <defs>
        <linearGradient id={skinG} x1="0.18" y1="0.04" x2="0.74" y2="1">
          <stop offset="0" stopColor={look.skinLight ?? look.skin} />
          <stop offset="0.45" stopColor={look.skin} />
          <stop offset="0.85" stopColor={look.skinShade} />
          <stop offset="1" stopColor={look.skinShade} />
        </linearGradient>
        {/* upper-left key light */}
        <radialGradient id={hiG} cx="0.36" cy="0.24" r="0.62">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        {/* lower-right form shadow */}
        <radialGradient id={shG} cx="0.74" cy="0.82" r="0.66">
          <stop offset="0" stopColor="#2a160a" stopOpacity="0.42" />
          <stop offset="0.7" stopColor="#2a160a" stopOpacity="0.08" />
          <stop offset="1" stopColor="#2a160a" stopOpacity="0" />
        </radialGradient>
        {/* warm casino rim light along the right contour */}
        <linearGradient id={rimG} x1="1" y1="0.18" x2="0.5" y2="0.72">
          <stop offset="0" stopColor="#ffdca6" stopOpacity="0.62" />
          <stop offset="0.42" stopColor="#ffbe7e" stopOpacity="0.12" />
          <stop offset="1" stopColor="#ffbe7e" stopOpacity="0" />
        </linearGradient>
        {/* soft ambient occlusion (under the chin, into the neck) */}
        <radialGradient id={aoG} cx="0.5" cy="0.18" r="0.85">
          <stop offset="0" stopColor="#23130a" stopOpacity="0.4" />
          <stop offset="1" stopColor="#23130a" stopOpacity="0" />
        </radialGradient>
        {/* horizontal barrel shade: darkens both temples so the skull reads as a
            rounded volume (3/4 form), with a touch more weight on the shadow side */}
        <linearGradient id={cylG} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#23130a" stopOpacity="0.34" />
          <stop offset="0.17" stopColor="#23130a" stopOpacity="0.1" />
          <stop offset="0.41" stopColor="#23130a" stopOpacity="0" />
          <stop offset="0.63" stopColor="#23130a" stopOpacity="0.05" />
          <stop offset="0.85" stopColor="#23130a" stopOpacity="0.18" />
          <stop offset="1" stopColor="#23130a" stopOpacity="0.36" />
        </linearGradient>
        {/* layered iris with depth */}
        <radialGradient id={irisG} cx="0.5" cy="0.34" r="0.66">
          <stop offset="0" stopColor={look.eyeColor ?? "#6b4a2f"} />
          <stop offset="0.58" stopColor={look.eyeColor ?? "#6b4a2f"} />
          <stop offset="1" stopColor="#1b110a" />
        </radialGradient>
        <linearGradient id={hairG} x1="0.2" y1="0" x2="0.7" y2="1">
          <stop offset="0" stopColor={look.hairLight ?? look.hair} />
          <stop offset="0.55" stopColor={look.hair} />
          <stop offset="1" stopColor={look.hair} />
        </linearGradient>
        <linearGradient id={hairSh} x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.24" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* neck */}
      <path d="M43 58 L57 58 L57 72 C57 76 53 78 50 78 C47 78 43 76 43 72 Z" fill={`url(#${skinG})`} />
      <path d="M43 58 L57 58 L57 64 C53 67 47 67 43 64 Z" fill={look.skinShade} opacity="0.5" />

      {/* ears (+ optional earring) */}
      <ellipse cx="28.5" cy="46" rx="4.6" ry="5.4" fill={`url(#${skinG})`} stroke={LINE} strokeWidth="0.6" />
      <ellipse cx="71.5" cy="46" rx="4.6" ry="5.4" fill={`url(#${skinG})`} stroke={LINE} strokeWidth="0.6" />
      <path d="M27 44 Q30 46 29 49" fill="none" stroke={LINE} strokeWidth="0.7" />
      <path d="M73 44 Q70 46 71 49" fill="none" stroke={LINE} strokeWidth="0.7" />
      {look.accessory === "earring" && (
        <>
          <circle cx="28.5" cy="52" r="1.9" fill="none" stroke="#fcd34d" strokeWidth="1.5" />
          <circle cx="71.5" cy="52" r="1.9" fill="none" stroke="#fcd34d" strokeWidth="1.5" />
        </>
      )}

      {/* head base + sculpted form (key light, form shadow, warm rim) */}
      <path
        d="M29 41 C29 26 38 19 50 19 C62 19 71 26 71 41 C71 55 63 67 50 67 C37 67 29 55 29 41 Z"
        fill={`url(#${skinG})`}
        stroke={LINE}
        strokeWidth="0.8"
      />
      <path d="M29 41 C29 26 38 19 50 19 C62 19 71 26 71 41 C71 55 63 67 50 67 C37 67 29 55 29 41 Z" fill={`url(#${cylG})`} />
      <path d="M29 41 C29 26 38 19 50 19 C62 19 71 26 71 41 C71 55 63 67 50 67 C37 67 29 55 29 41 Z" fill={`url(#${shG})`} />
      <path d="M29 41 C29 26 38 19 50 19 C62 19 71 26 71 41 C71 55 63 67 50 67 C37 67 29 55 29 41 Z" fill={`url(#${rimG})`} />
      <path d="M29 41 C29 26 38 19 50 19 C62 19 71 26 71 41 C71 55 63 67 50 67 C37 67 29 55 29 41 Z" fill={`url(#${hiG})`} />
      {/* forehead + cheekbone highlights; jaw + temple shadow planes */}
      <ellipse cx="43" cy="29.5" rx="9.5" ry="5" fill="#fff" opacity="0.12" />
      <ellipse cx="38.5" cy="45.5" rx="5.2" ry="3.1" fill="#fff" opacity="0.08" />
      <path d="M33 46 Q36 60 50 65 Q44 58 41 47 Z" fill={look.skinShade} opacity="0.26" />
      <path d="M67 46 Q64 60 50 65 Q56 58 59 47 Z" fill={look.skinShade} opacity="0.32" />
      <path d="M30 36 Q33 30 37 28 Q33 35 33 44 Z" fill={look.skinShade} opacity="0.16" />
      <path d="M70 36 Q67 30 63 28 Q67 35 67 44 Z" fill={look.skinShade} opacity="0.22" />
      {/* cheek blush */}
      <ellipse cx="37.5" cy="52" rx="4" ry="2.5" fill="#e8736b" opacity="0.16" />
      <ellipse cx="62.5" cy="52" rx="4" ry="2.5" fill="#e8736b" opacity="0.16" />
      {/* nose: bridge highlight, form shadow, tip highlight, nostrils */}
      <path d="M50 40 L50 50" stroke="#fff" strokeWidth="1.3" opacity="0.2" strokeLinecap="round" />
      <path d="M50 43 C48 49 46.4 51.6 47.4 53.2 C48.6 54.4 51.4 54.4 52.6 53.2 C53.6 51.6 52 49 50 43 Z" fill={look.skinShade} opacity="0.5" />
      <ellipse cx="49.6" cy="51.3" rx="1.5" ry="1.1" fill="#fff" opacity="0.2" />
      <ellipse cx="47.8" cy="53.1" rx="0.95" ry="0.7" fill="#2a160a" opacity="0.34" />
      <ellipse cx="52.2" cy="53.1" rx="0.95" ry="0.7" fill="#2a160a" opacity="0.34" />
      <path d="M47.6 52.8 Q50 54.2 52.4 52.8" fill="none" stroke={LINE} strokeWidth="0.7" />
      {/* under-chin ambient occlusion onto the neck */}
      <ellipse cx="50" cy="68.4" rx="8.6" ry="2.8" fill={`url(#${aoG})`} />

      {look.freckles && <Freckles />}

      <Hair look={look} grad={`url(#${hairG})`} sheenGrad={`url(#${hairSh})`} />
      <FacialHairMark look={look} />
      <Eyes look={look} mode={m.eye} blink={blink} blinkDelay={blinkDelay} gaze={gaze} irisId={irisG} />
      <Brows look={look} mode={m.brow} />
      <Mouth look={look} mode={m.mouth} talking={talking} />
      <Hat look={look} />
    </g>
  );
}

function Freckles() {
  return (
    <g fill="#b9794e" opacity="0.5">
      <circle cx="39" cy="51" r="0.9" />
      <circle cx="43" cy="53" r="0.9" />
      <circle cx="35" cy="53" r="0.8" />
      <circle cx="61" cy="51" r="0.9" />
      <circle cx="57" cy="53" r="0.9" />
      <circle cx="65" cy="53" r="0.8" />
    </g>
  );
}

function Hair({ look, grad, sheenGrad }: { look: CharacterLook; grad: string; sheenGrad: string }) {
  // Thin dark inner-edge for a believable hairline + soft contact shadow on the
  // forehead where the hair sits.
  const hl = look.hair;
  const strand = "rgb(255 255 255 / 0.16)";
  switch (look.hairStyle) {
    case "bald":
      return (
        <g>
          <ellipse cx="46" cy="28" rx="10" ry="5.5" fill="#fff" opacity="0.16" />
          <path d="M33 33 Q50 24 67 33" fill="none" stroke="#fff" opacity="0.08" strokeWidth="2" />
        </g>
      );
    case "buzz":
      return (
        <g>
          <path d="M28 39 C30 23 41 17 50 17 C59 17 70 23 72 39 C65 29 57 26 50 26 C43 26 35 29 28 39 Z" fill={grad} />
          <path d="M28 39 C35 29 43 26 50 26 C57 26 65 29 72 39" fill="none" stroke={hl} strokeWidth="0.8" opacity="0.4" />
          <path d="M30 38 C33 26 41 21 50 21 C59 21 67 26 70 38" fill="none" stroke={sheenGrad} strokeWidth="3" strokeLinecap="round" />
          <g stroke={strand} strokeWidth="0.7" fill="none" opacity="0.7">
            <path d="M38 22 L36 30" /><path d="M50 19 L50 27" /><path d="M62 22 L64 30" />
          </g>
        </g>
      );
    case "slick":
      return (
        <g>
          <path d="M27 41 C27 21 39 14 50 14 C61 14 73 21 73 41 C73 32 65 22 50 22 C39 22 31 30 27 41 Z" fill={grad} />
          <path d="M31 34 C33 23 41 18 51 18 C61 18 69 24 71 34" fill="none" stroke={sheenGrad} strokeWidth="3.6" strokeLinecap="round" />
          {/* combed strand grouping */}
          <g stroke={strand} strokeWidth="0.9" fill="none" opacity="0.8" strokeLinecap="round">
            <path d="M33 33 C36 24 44 19 52 19" />
            <path d="M37 36 C40 27 47 22 55 21" />
            <path d="M44 38 C48 29 55 24 63 24" />
          </g>
          <path d="M27 41 C31 30 39 22 50 22 C61 22 69 30 73 41" fill="none" stroke={hl} strokeWidth="0.8" opacity="0.35" />
        </g>
      );
    case "long":
      return (
        <g>
          <path d="M25 64 C22 38 30 15 50 15 C70 15 78 38 75 64 L67 64 C71 42 65 24 50 24 C35 24 29 42 33 64 Z" fill={grad} />
          <path d="M28 40 C30 20 41 14 50 14 C59 14 70 20 72 40 C64 28 57 25 50 25 C43 25 36 28 28 40 Z" fill={grad} />
          {/* flowing strands down the sides */}
          <g stroke={strand} strokeWidth="0.9" fill="none" opacity="0.7" strokeLinecap="round">
            <path d="M29 30 C27 42 28 54 31 63" />
            <path d="M71 30 C73 42 72 54 69 63" />
            <path d="M33 22 C42 16 58 16 67 22" />
          </g>
          <path d="M26 60 C24 44 30 26 50 25 C70 26 76 44 74 60" fill="none" stroke={hl} strokeWidth="0.8" opacity="0.3" />
        </g>
      );
    case "afro":
      return (
        <g>
          <path d="M27 35 C18 33 21 16 34 14 C36 6 50 5 56 11 C71 9 82 21 73 34 C82 38 75 50 68 44 C66 30 58 26 50 26 C42 26 34 30 32 44 C24 50 18 38 27 35 Z" fill={grad} />
          <g fill={strand} opacity="0.6">
            <circle cx="38" cy="20" r="5" /><circle cx="55" cy="16" r="4" /><circle cx="28" cy="30" r="3.4" /><circle cx="70" cy="26" r="3.4" />
          </g>
        </g>
      );
    case "tuft":
      return (
        <g>
          <path d="M28 38 C29 23 40 16 50 16 C60 16 71 23 72 38 C66 30 60 32 57 25 C55 32 49 32 47 26 C44 33 38 32 35 26 C33 32 30 35 28 38 Z" fill={grad} />
          <g stroke={strand} strokeWidth="0.9" fill="none" opacity="0.75" strokeLinecap="round">
            <path d="M36 30 C36 24 40 20 44 19" />
            <path d="M50 30 C49 23 51 20 53 19" />
            <path d="M62 30 C63 24 60 21 57 20" />
          </g>
        </g>
      );
    case "short":
    default:
      return (
        <g>
          <path d="M28 40 C28 22 40 15 50 15 C60 15 72 22 72 40 C65 29 58 26 50 26 C42 26 35 29 28 40 Z" fill={grad} />
          <path d="M32 33 C35 24 42 19 51 19 C60 19 67 25 70 33" fill="none" stroke={sheenGrad} strokeWidth="3" strokeLinecap="round" />
          <g stroke={strand} strokeWidth="0.85" fill="none" opacity="0.78" strokeLinecap="round">
            <path d="M33 34 C36 26 43 21 51 21" />
            <path d="M40 37 C44 29 51 24 60 25" />
            <path d="M48 38 C52 31 59 27 67 29" />
          </g>
          <path d="M28 40 C32 30 40 26 50 26 C60 26 68 30 72 40" fill="none" stroke={hl} strokeWidth="0.8" opacity="0.35" />
        </g>
      );
  }
}

function FacialHairMark({ look }: { look: CharacterLook }) {
  const c = look.hair;
  switch (look.facialHair) {
    case "stubble":
      return (
        <path d="M33 50 C35 63 42 69 50 69 C58 69 65 63 67 50 C64 60 57 64 50 64 C43 64 36 60 33 50 Z" fill={c} opacity="0.2" />
      );
    case "mustache":
      return (
        <path d="M41 54 C45 52 48 53 50 54 C52 53 55 52 59 54 C56 57.5 53 56.5 50 55.4 C47 56.5 44 57.5 41 54 Z" fill={c} />
      );
    case "goatee":
      return (
        <>
          <path d="M42 54 C45 53 48 54 50 54.5 C52 54 55 53 58 54 C55 56 52 55.5 50 55 C48 55.5 45 56 42 54 Z" fill={c} />
          <path d="M44 60 C46 66 54 66 56 60 C55 64 52 66 50 66 C48 66 45 64 44 60 Z" fill={c} />
        </>
      );
    case "beard":
      return (
        <path d="M31 46 C33 63 42 70 50 70 C58 70 67 63 69 46 C68 57 63 62 63 59 C61 63 56 64 50 64 C44 64 39 63 37 59 C37 62 32 57 31 46 Z" fill={c} />
      );
    case "fullbeard":
      return (
        <path d="M30 43 C30 66 40 74 50 74 C60 74 70 66 70 43 C70 55 64 61 62 65 C58 68 54 69 50 69 C46 69 42 68 38 65 C36 61 30 55 30 43 Z" fill={c} />
      );
    case "none":
    default:
      return null;
  }
}

function Eyes({
  look,
  mode,
  blink,
  blinkDelay,
  gaze,
  irisId,
}: {
  look: CharacterLook;
  mode: EyeMode;
  blink: boolean;
  blinkDelay: number;
  gaze: { dx: number; dy: number };
  irisId: string;
}) {
  // Cool shades persona: eyes hidden behind lenses — emotion reads via brows/mouth.
  if (look.eyes === "shades") {
    return (
      <g>
        <path d="M32 41 L47 41 Q49 41 49 43.5 L49 47 Q49 50 46 50 L36 50 Q33 50 32.5 47 Z" fill="#0b0f16" />
        <path d="M53 41 L68 41 L67.5 47 Q67 50 64 50 L54 50 Q51 50 51 47 L51 43.5 Q51 41 53 41 Z" fill="#0b0f16" />
        <rect x="46" y="43" width="8" height="2.6" rx="1.3" fill="#0b0f16" />
        <path d="M35 42.5 L40 42.5 L38.5 47 L34 47 Z" fill="#3a4456" opacity="0.7" />
        <path d="M55 42.5 L60 42.5 L59 47 L54.5 47 Z" fill="#3a4456" opacity="0.55" />
      </g>
    );
  }

  // Happy: closed upward "^ ^" arcs — overrides round eyeballs.
  if (mode === "happy") {
    return (
      <g fill="none" stroke="#2a1c12" strokeWidth="2.4" strokeLinecap="round">
        <path d="M36 47 Q40.5 42.5 45 47" />
        <path d="M55 47 Q59.5 42.5 64 47" />
      </g>
    );
  }

  const focused = look.eyes === "focused";
  // openness + pupil offset per emotion
  let whiteRx = focused ? 4.1 : 4.6;
  let whiteRy = focused ? 2.7 : 3.4;
  let dx = 0;
  let dy = 0;
  let topLid = 0; // skin cover height from the top (droop / squint)
  if (mode === "up") {
    // thinking: glance up AND off to the side
    dy = -1.4;
    dx = 1.5;
  } else if (mode === "wide") {
    whiteRx += 0.7;
    whiteRy += 1.1;
  } else if (mode === "narrow") {
    whiteRy = 1.9;
    dx = 0.7;
    topLid = 2.2;
  } else if (mode === "down") {
    whiteRy = 3;
    dy = 1.3;
    topLid = 1.4;
  }
  const irisR = focused ? 2.4 : 2.8;

  // expression offset + live gaze, clamped so the iris always stays on the sclera
  const tx = Math.max(-2.2, Math.min(2.2, dx + gaze.dx));
  const ty = Math.max(-2.4, Math.min(2.4, dy + gaze.dy));

  const lashTop = 46 - whiteRy + 0.3;
  return (
    <g>
      {/* soft eye-socket shadow under the brow for depth */}
      <ellipse cx="40.5" cy="44.7" rx={whiteRx + 1} ry={whiteRy + 1.2} fill={look.skinShade} opacity="0.2" />
      <ellipse cx="59.5" cy="44.7" rx={whiteRx + 1} ry={whiteRy + 1.2} fill={look.skinShade} opacity="0.2" />

      {/* whites + inner-corner shading */}
      <ellipse cx="40.5" cy="46" rx={whiteRx} ry={whiteRy} fill="#fbfdff" />
      <ellipse cx="59.5" cy="46" rx={whiteRx} ry={whiteRy} fill="#fbfdff" />
      <path d="M36.4 46.7 Q39 48.3 44.4 47.5" fill="none" stroke="#cab6a6" strokeWidth="0.5" opacity="0.5" />
      <path d="M55.6 47.5 Q61 48.3 63.6 46.7" fill="none" stroke="#cab6a6" strokeWidth="0.5" opacity="0.5" />

      {/* layered iris + pupil + dual catchlights; glides toward the gaze target */}
      <g className="pn-eye-iris" style={{ transform: `translate(${tx}px, ${ty}px)` }}>
        <g>
          <circle cx="41" cy="46.2" r={irisR} fill={`url(#${irisId})`} />
          <circle cx="59" cy="46.2" r={irisR} fill={`url(#${irisId})`} />
          <circle cx="41" cy="46.2" r={irisR} fill="none" stroke="#1b110a" strokeWidth="0.5" opacity="0.55" />
          <circle cx="59" cy="46.2" r={irisR} fill="none" stroke="#1b110a" strokeWidth="0.5" opacity="0.55" />
          <circle cx="41" cy="46.4" r={irisR * 0.46} fill="#120c08" />
          <circle cx="59" cy="46.4" r={irisR * 0.46} fill="#120c08" />
          <circle cx="42.1" cy="44.9" r="1" fill="#fff" opacity="0.95" />
          <circle cx="60.1" cy="44.9" r="1" fill="#fff" opacity="0.95" />
          <circle cx="40.1" cy="46.9" r="0.5" fill="#fff" opacity="0.55" />
          <circle cx="58.1" cy="46.9" r="0.5" fill="#fff" opacity="0.55" />
        </g>
      </g>

      {/* upper lid / lash line (weight) + soft lower lid */}
      <path d={`M${40.5 - whiteRx - 0.4} ${lashTop} Q40.5 ${lashTop - whiteRy * 0.5} ${40.5 + whiteRx + 0.4} ${lashTop}`} fill="none" stroke="#241810" strokeWidth="1.2" strokeLinecap="round" />
      <path d={`M${59.5 - whiteRx - 0.4} ${lashTop} Q59.5 ${lashTop - whiteRy * 0.5} ${59.5 + whiteRx + 0.4} ${lashTop}`} fill="none" stroke="#241810" strokeWidth="1.2" strokeLinecap="round" />
      <path d={`M${40.5 - whiteRx + 0.7} ${46 + whiteRy - 0.1} Q40.5 ${46 + whiteRy + 0.7} ${40.5 + whiteRx - 0.7} ${46 + whiteRy - 0.1}`} fill="none" stroke={look.skinShade} strokeWidth="0.7" opacity="0.7" />
      <path d={`M${59.5 - whiteRx + 0.7} ${46 + whiteRy - 0.1} Q59.5 ${46 + whiteRy + 0.7} ${59.5 + whiteRx - 0.7} ${46 + whiteRy - 0.1}`} fill="none" stroke={look.skinShade} strokeWidth="0.7" opacity="0.7" />

      {/* squint / droop lids */}
      {topLid > 0 && (
        <g fill={look.skin}>
          <rect x={40.5 - whiteRx} y={46 - whiteRy - 0.3} width={whiteRx * 2} height={topLid + 0.3} />
          <rect x={59.5 - whiteRx} y={46 - whiteRy - 0.3} width={whiteRx * 2} height={topLid + 0.3} />
        </g>
      )}

      {/* glasses frames overlay for the studious persona */}
      {look.eyes === "glasses" && (
        <g fill="none" stroke="#1f2937" strokeWidth="2">
          <rect x="34" y="40" width="14" height="12" rx="4.5" />
          <rect x="52" y="40" width="14" height="12" rx="4.5" />
          <line x1="48" y1="45" x2="52" y2="45" />
          <line x1="34" y1="44" x2="29" y2="43" />
          <line x1="66" y1="44" x2="71" y2="43" />
        </g>
      )}

      {/* occasional blink (lids drawn skin-colored, scaleY-animated in CSS) */}
      {blink && (
        <g className="pn-blink" fill={look.skin} style={{ animationDelay: `${blinkDelay}s` }}>
          <rect x="35" y="40.5" width="11.5" height="7" rx="3.5" />
          <rect x="53.5" y="40.5" width="11.5" height="7" rx="3.5" />
        </g>
      )}
    </g>
  );
}

/**
 * Brows are rendered as two stacked strokes — a thick dark base plus a thin
 * lighter stroke on top — so they read with weight and a hair-like sheen rather
 * than a flat line. Shapes are data-driven per emotion (and per resting style).
 */
function Brows({ look, mode }: { look: CharacterLook; mode: BrowMode }) {
  const dark = look.hair;
  const lite = look.hairLight ?? look.hair;
  const ds = browShapes(mode, look.brow);
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {ds.map((d, i) => (
        <g key={i}>
          <path d={d} stroke={dark} strokeWidth="3.5" />
          <path d={d} stroke={lite} strokeWidth="1.4" opacity="0.85" />
        </g>
      ))}
      {mode === "think" && (
        <path d="M49.4 38.8 Q50 41.8 50.6 38.8" stroke={dark} strokeWidth="1.1" opacity="0.5" fill="none" />
      )}
    </g>
  );
}

function browShapes(mode: BrowMode, rest: BrowStyle): string[] {
  switch (mode) {
    case "think":
      return ["M35 38 Q41 40.2 47 40.6", "M65 38 Q59 40.2 53 40.6"];
    case "worried":
      return ["M35 41 L46 35.5", "M65 41 L54 35.5"];
    case "cocky":
      return ["M34 40.5 L46 40", "M53 39 Q59 32.8 67 36"];
    case "up":
      return ["M34 37.5 Q41 33.5 47 37", "M53 37 Q59 33.5 66 37.5"];
    case "sad":
      return ["M34 41.5 L46 36.5", "M66 41.5 L54 36.5"];
    case "rest":
    default:
      return restBrowShapes(rest);
  }
}

function restBrowShapes(brow: BrowStyle): string[] {
  switch (brow) {
    case "angry":
      return ["M34 37.5 L46 41.5", "M66 37.5 L54 41.5"];
    case "raised":
      return ["M34 38 Q41 34 47 37.5", "M53 37.5 Q59 34 66 38"];
    case "calm":
      return ["M35 38.5 L46 38.5", "M54 38.5 L65 38.5"];
    case "neutral":
    default:
      return ["M35 38.5 L46 37.5", "M54 37.5 L65 38.5"];
  }
}

function Mouth({ look, mode, talking }: { look: CharacterLook; mode: MouthMode; talking: boolean }) {
  const stroke = "#7c2d12";

  // Talking lip-sync overlays whatever the resting expression is.
  if (talking) {
    return (
      <g className="pn-mouth-talk">
        <path d="M42 55 Q50 57 58 55 L57 58.5 Q50 63.5 43 58.5 Z" fill="#5b2310" />
        <path d="M44 56 Q50 57.5 56 56 L55.5 57 Q50 58.4 44.5 57 Z" fill="#fff" opacity="0.92" />
        <ellipse cx="50" cy="61" rx="3.2" ry="1.6" fill="#c64b53" opacity="0.85" />
      </g>
    );
  }

  switch (mode) {
    case "beam":
      // big happy open smile with teeth
      return (
        <g>
          <path d="M39 54 Q50 67 61 54 Q50 60 39 54 Z" fill="#5b2310" />
          <path d="M41 55 Q50 58.5 59 55 Q50 57.5 41 55 Z" fill="#fff" />
          <ellipse cx="50" cy="62" rx="4" ry="2" fill="#d4626a" opacity="0.85" />
        </g>
      );
    case "frown":
      return (
        <path d="M41 60 Q50 53 59 60" fill="none" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" />
      );
    case "smirk":
      // asymmetric: left corner low, right corner pulled sharply up
      return (
        <path d="M41 57.6 Q50 60 58 53.8" fill="none" stroke={stroke} strokeWidth="2.7" strokeLinecap="round" />
      );
    case "oh":
      // concerned: a slight downturned frown that's a touch open
      return (
        <g>
          <path d="M42 56.4 Q50 61.6 58 56.4" fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" />
          <ellipse cx="50" cy="58.6" rx="2.5" ry="2.2" fill="#5b2310" opacity="0.9" />
        </g>
      );
    case "press":
      // thinking: short, tight, pursed line (no smile)
      return (
        <path d="M45 57 L55 56.6" fill="none" stroke={stroke} strokeWidth="2.9" strokeLinecap="round" />
      );
    case "neutral":
      // idle: relaxed, almost-straight resting mouth — deliberately NOT a grin
      return (
        <path d="M43.5 56.9 Q50 57.7 56.5 56.9" fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" />
      );
    case "rest":
    default:
      return <RestMouth look={look} stroke={stroke} />;
  }
}

function RestMouth({ look, stroke }: { look: CharacterLook; stroke: string }) {
  switch (look.mouth) {
    case "grin":
      return (
        <g>
          <path d="M40 55 Q50 65 60 55 Q50 59 40 55 Z" fill="#fff" stroke={stroke} strokeWidth="1.3" />
          <path d="M40 55 Q50 58 60 55" fill="none" stroke={stroke} strokeWidth="1" opacity="0.5" />
        </g>
      );
    case "smirk":
      return (
        <path d="M42 57 Q52 60.5 60 53.5" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
      );
    case "tough":
      return <line x1="42" y1="57" x2="58" y2="57" stroke={stroke} strokeWidth="3" strokeLinecap="round" />;
    case "flat":
      return <line x1="43" y1="56.5" x2="57" y2="56.5" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />;
    case "open":
      return (
        <g>
          <ellipse cx="50" cy="57" rx="5" ry="4" fill="#5b2310" />
          <ellipse cx="50" cy="55.5" rx="4" ry="1.4" fill="#fff" opacity="0.9" />
        </g>
      );
    case "smile":
    default:
      return (
        <path d="M41 55 Q50 62.5 59 55" fill="none" stroke={stroke} strokeWidth="2.7" strokeLinecap="round" />
      );
  }
}

function Hat({ look }: { look: CharacterLook }) {
  const shine = "rgb(255 255 255 / 0.16)";
  switch (look.hat) {
    case "top":
      return (
        <g>
          <rect x="25" y="21" width="50" height="6.5" rx="3" fill={look.hatColor} />
          <rect x="32" y="1" width="36" height="22" rx="3" fill={look.hatColor} />
          <rect x="32" y="15" width="36" height="5" fill={look.accent} opacity="0.85" />
          <rect x="35" y="3" width="3" height="18" rx="1.5" fill={shine} />
        </g>
      );
    case "fedora":
      return (
        <g>
          <path d="M23 26 C31 22 44 21 50 21 C56 21 69 22 77 26 C69 29 60 29 50 29 C40 29 31 29 23 26 Z" fill={look.hatColor} />
          <path d="M31 24 C31 11 42 7 50 7 C58 7 69 11 69 24 C60 20 56 19 50 19 C44 19 40 20 31 24 Z" fill={look.hatColor} />
          <path d="M31 23 C40 20 60 20 69 23 L68 26 C60 24 40 24 32 26 Z" fill="#000" opacity="0.28" />
        </g>
      );
    case "cap":
      return (
        <g>
          <path d="M26 30 C26 15 38 10 50 10 C62 10 74 15 74 30 C66 21 58 19 50 19 C42 19 33 21 26 30 Z" fill={look.hatColor} />
          <path d="M21 30 C28 27 40 26 50 27 L50 33 C40 32 30 33 23 36 Z" fill={look.hatColor} />
          <path d="M33 16 Q46 11 58 15" fill="none" stroke={shine} strokeWidth="2.4" strokeLinecap="round" />
        </g>
      );
    case "visor":
      return (
        <g>
          <path d="M30 30 C36 24 44 22 50 22 C56 22 64 24 70 30 L70 34 L30 34 Z" fill={look.hatColor} />
          <path d="M22 34 C30 31 40 31 50 31 C60 31 70 31 78 34 L76 39 C68 36 58 36 50 36 C42 36 32 36 24 39 Z" fill={look.hatColor} opacity="0.85" />
        </g>
      );
    case "headband":
      return (
        <g>
          <rect x="27" y="29" width="46" height="7.5" rx="3.5" fill={look.hatColor} />
          <path d="M71 32 l9 -3 l-2 6 Z" fill={look.hatColor} />
        </g>
      );
    case "none":
    default:
      return null;
  }
}

export const Head = memo(HeadImpl);
