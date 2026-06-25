import { memo, useId } from "react";
import type { CharacterLook } from "./characters";

/**
 * Shared, parametric FACE primitives for Poker Night characters.
 *
 * Everything from the neck up is drawn here in a normalized 100x100 box (head
 * centered around cx=50, cy=43). Both the round seat avatar and the full seated
 * `PokerFigure` embed `<Head>` so a persona looks identical whether shown as a
 * bust or a body.
 *
 * Art direction: a polished, modern animated look — soft gradient skin shading,
 * an upper-left key light, a lower-right form shadow, clean dark linework, and
 * expressive features. 100% original SVG (no images, no copyrighted assets, no
 * network). All optional motion (blink, talking) is cheap transform/opacity CSS,
 * suppressed under reduced motion.
 */

interface HeadProps {
  look: CharacterLook;
  /** Enable the occasional idle blink (suppressed under reduced motion). */
  blink?: boolean;
  /** Animate the mouth as if talking (while a line/bubble is active). */
  talking?: boolean;
  /** Stagger so figures don't blink in unison (seconds). */
  blinkDelay?: number;
}

const LINE = "rgb(35 22 14 / 0.34)";

function HeadImpl({ look, blink = false, talking = false, blinkDelay = 0 }: HeadProps) {
  const raw = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const skinG = `pn-skin-${raw}`;
  const hiG = `pn-hi-${raw}`;
  const shG = `pn-sh-${raw}`;
  const hairG = `pn-hair-${raw}`;

  return (
    <g>
      <defs>
        <linearGradient id={skinG} x1="0" y1="0" x2="0.25" y2="1">
          <stop offset="0" stopColor={look.skin} />
          <stop offset="0.62" stopColor={look.skin} />
          <stop offset="1" stopColor={look.skinShade} />
        </linearGradient>
        <radialGradient id={hiG} cx="0.36" cy="0.28" r="0.62">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.34" />
          <stop offset="0.55" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={shG} cx="0.7" cy="0.78" r="0.6">
          <stop offset="0" stopColor="#2a160a" stopOpacity="0.32" />
          <stop offset="1" stopColor="#2a160a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={hairG} x1="0.2" y1="0" x2="0.7" y2="1">
          <stop offset="0" stopColor={look.hair} />
          <stop offset="1" stopColor={look.hair} />
        </linearGradient>
      </defs>

      {/* neck */}
      <path d="M43 58 L57 58 L57 72 C57 76 53 78 50 78 C47 78 43 76 43 72 Z" fill={`url(#${skinG})`} />
      <path d="M43 58 L57 58 L57 64 C53 67 47 67 43 64 Z" fill="#2a160a" opacity="0.18" />

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

      {/* head */}
      <path
        d="M29 41 C29 26 38 19 50 19 C62 19 71 26 71 41 C71 55 63 67 50 67 C37 67 29 55 29 41 Z"
        fill={`url(#${skinG})`}
        stroke={LINE}
        strokeWidth="0.8"
      />
      {/* form shadow (lower-right) + key light (upper-left) */}
      <path d="M29 41 C29 26 38 19 50 19 C62 19 71 26 71 41 C71 55 63 67 50 67 C37 67 29 55 29 41 Z" fill={`url(#${shG})`} />
      <path d="M29 41 C29 26 38 19 50 19 C62 19 71 26 71 41 C71 55 63 67 50 67 C37 67 29 55 29 41 Z" fill={`url(#${hiG})`} />
      {/* cheek blush */}
      <ellipse cx="37.5" cy="52" rx="4" ry="2.5" fill="#e8736b" opacity="0.16" />
      <ellipse cx="62.5" cy="52" rx="4" ry="2.5" fill="#e8736b" opacity="0.16" />
      {/* nose */}
      <path d="M50 43 C48 49 46.4 51.6 47.4 53.2 C48.6 54.4 51.4 54.4 52.6 53.2 C53.6 51.6 52 49 50 43 Z" fill={look.skinShade} opacity="0.5" />
      <path d="M47.6 52.6 Q50 54 52.4 52.6" fill="none" stroke={LINE} strokeWidth="0.7" />

      {look.freckles && <Freckles />}

      <Hair look={look} grad={`url(#${hairG})`} />
      <FacialHairMark look={look} />
      <Eyes look={look} blink={blink} blinkDelay={blinkDelay} />
      <Brows look={look} />
      <Mouth look={look} talking={talking} />
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

function Hair({ look, grad }: { look: CharacterLook; grad: string }) {
  const sheen = "rgb(255 255 255 / 0.14)";
  switch (look.hairStyle) {
    case "bald":
      return <path d="M33 33 Q50 25 67 33 Q50 30 33 33 Z" fill={sheen} />;
    case "buzz":
      return (
        <g>
          <path d="M28 39 C30 23 41 17 50 17 C59 17 70 23 72 39 C65 29 57 26 50 26 C43 26 35 29 28 39 Z" fill={grad} />
          <path d="M33 30 Q44 23 55 26" fill="none" stroke={sheen} strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case "slick":
      return (
        <g>
          <path d="M27 41 C27 21 39 14 50 14 C61 14 73 21 73 41 C73 32 65 22 50 22 C39 22 31 30 27 41 Z" fill={grad} />
          <path d="M34 24 Q46 17 58 21" fill="none" stroke={sheen} strokeWidth="2.4" strokeLinecap="round" />
        </g>
      );
    case "long":
      return (
        <g>
          <path d="M25 64 C22 38 30 15 50 15 C70 15 78 38 75 64 L67 64 C71 42 65 24 50 24 C35 24 29 42 33 64 Z" fill={grad} />
          <path d="M28 40 C30 20 41 14 50 14 C59 14 70 20 72 40 C64 28 57 25 50 25 C43 25 36 28 28 40 Z" fill={grad} />
          <path d="M33 22 Q47 15 59 20" fill="none" stroke={sheen} strokeWidth="2.2" strokeLinecap="round" />
        </g>
      );
    case "afro":
      return (
        <g>
          <path d="M27 35 C18 33 21 16 34 14 C36 6 50 5 56 11 C71 9 82 21 73 34 C82 38 75 50 68 44 C66 30 58 26 50 26 C42 26 34 30 32 44 C24 50 18 38 27 35 Z" fill={grad} />
        </g>
      );
    case "tuft":
      return (
        <g>
          <path d="M28 38 C29 23 40 16 50 16 C60 16 71 23 72 38 C66 30 60 32 57 25 C55 32 49 32 47 26 C44 33 38 32 35 26 C33 32 30 35 28 38 Z" fill={grad} />
        </g>
      );
    case "short":
    default:
      return (
        <g>
          <path d="M28 40 C28 22 40 15 50 15 C60 15 72 22 72 40 C65 29 58 26 50 26 C42 26 35 29 28 40 Z" fill={grad} />
          <path d="M34 25 Q46 18 58 22" fill="none" stroke={sheen} strokeWidth="2.2" strokeLinecap="round" />
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
  blink,
  blinkDelay,
}: {
  look: CharacterLook;
  blink: boolean;
  blinkDelay: number;
}) {
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

  const focused = look.eyes === "focused";
  const irisR = focused ? 2.4 : 2.9;
  const whiteRx = focused ? 4.1 : 4.7;
  const lids = blink ? (
    <g className="pn-blink" fill={look.skin} style={{ animationDelay: `${blinkDelay}s` }}>
      <rect x="35" y="40.5" width="11.5" height="7" rx="3.5" />
      <rect x="53.5" y="40.5" width="11.5" height="7" rx="3.5" />
    </g>
  ) : null;

  const eyeballs = (
    <g>
      {/* whites with soft socket shadow */}
      <ellipse cx="40.5" cy="46" rx={whiteRx} ry="3.5" fill="#fbfdff" />
      <ellipse cx="59.5" cy="46" rx={whiteRx} ry="3.5" fill="#fbfdff" />
      <path d="M36 44 Q40.5 42 45 44" fill="none" stroke={LINE} strokeWidth="0.8" />
      <path d="M55 44 Q59.5 42 64 44" fill="none" stroke={LINE} strokeWidth="0.8" />
      {/* iris + pupil + catchlight */}
      <circle cx="41" cy="46.2" r={irisR} fill="#5b3a26" />
      <circle cx="59" cy="46.2" r={irisR} fill="#5b3a26" />
      <circle cx="41" cy="46.2" r={irisR * 0.5} fill="#14161d" />
      <circle cx="59" cy="46.2" r={irisR * 0.5} fill="#14161d" />
      <circle cx="42" cy="45" r="0.95" fill="#fff" opacity="0.95" />
      <circle cx="60" cy="45" r="0.95" fill="#fff" opacity="0.95" />
    </g>
  );

  if (look.eyes === "glasses") {
    return (
      <g>
        {eyeballs}
        {lids}
        <g fill="none" stroke="#1f2937" strokeWidth="2">
          <rect x="34" y="40" width="14" height="12" rx="4.5" />
          <rect x="52" y="40" width="14" height="12" rx="4.5" />
          <line x1="48" y1="45" x2="52" y2="45" />
          <line x1="34" y1="44" x2="29" y2="43" />
          <line x1="66" y1="44" x2="71" y2="43" />
        </g>
      </g>
    );
  }

  return (
    <g>
      {eyeballs}
      {lids}
    </g>
  );
}

function Brows({ look }: { look: CharacterLook }) {
  const stroke = look.hair;
  switch (look.brow) {
    case "angry":
      return (
        <g stroke={stroke} strokeWidth="3" strokeLinecap="round">
          <line x1="34" y1="37.5" x2="46" y2="41.5" />
          <line x1="66" y1="37.5" x2="54" y2="41.5" />
        </g>
      );
    case "raised":
      return (
        <g stroke={stroke} strokeWidth="2.7" strokeLinecap="round" fill="none">
          <path d="M34 38 Q41 34 47 37.5" />
          <path d="M53 37.5 Q59 34 66 38" />
        </g>
      );
    case "calm":
      return (
        <g stroke={stroke} strokeWidth="2.5" strokeLinecap="round">
          <line x1="35" y1="38.5" x2="46" y2="38.5" />
          <line x1="54" y1="38.5" x2="65" y2="38.5" />
        </g>
      );
    case "neutral":
    default:
      return (
        <g stroke={stroke} strokeWidth="2.7" strokeLinecap="round">
          <line x1="35" y1="38.5" x2="46" y2="37.5" />
          <line x1="54" y1="37.5" x2="65" y2="38.5" />
        </g>
      );
  }
}

function Mouth({ look, talking }: { look: CharacterLook; talking: boolean }) {
  const stroke = "#7c2d12";

  // While talking, an animated open mouth cycles over the resting expression so
  // the character clearly reads as speaking. Pure CSS scaleY — very cheap.
  if (talking) {
    return (
      <g className="pn-mouth-talk">
        <path d="M42 55 Q50 57 58 55 L57 58.5 Q50 63.5 43 58.5 Z" fill="#5b2310" />
        <path d="M44 56 Q50 57.5 56 56 L55.5 57 Q50 58.4 44.5 57 Z" fill="#fff" opacity="0.92" />
        <ellipse cx="50" cy="61" rx="3.2" ry="1.6" fill="#c64b53" opacity="0.85" />
      </g>
    );
  }

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
      return (
        <line x1="42" y1="57" x2="58" y2="57" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
      );
    case "flat":
      return (
        <line x1="43" y1="56.5" x2="57" y2="56.5" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
      );
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
