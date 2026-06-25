import { memo } from "react";
import type { CharacterLook } from "./characters";

/**
 * Shared, parametric FACE primitives for Poker Night characters.
 *
 * Everything from the neck up is drawn here in a normalized 100x100 box (head
 * centered around cx=50, cy=44). Both the round seat avatar and the full seated
 * `PokerFigure` embed `<Head>` so a persona looks identical whether shown as a
 * bust or a body. No images, no network — expressive cartoon faces from pure SVG
 * paths driven by `look`. All optional motion (blink, talking) is cheap
 * transform/opacity CSS, suppressed under reduced motion.
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

function HeadImpl({ look, blink = false, talking = false, blinkDelay = 0 }: HeadProps) {
  return (
    <g>
      {/* neck */}
      <rect x="43" y="60" width="14" height="16" rx="6" fill={look.skinShade} />
      <rect x="43" y="60" width="14" height="6" rx="3" fill="#000" opacity="0.12" />

      {/* ears (+ optional earring) */}
      <circle cx="28.5" cy="46" r="4.6" fill={look.skin} />
      <circle cx="71.5" cy="46" r="4.6" fill={look.skin} />
      <circle cx="28.5" cy="46" r="2" fill={look.skinShade} opacity="0.6" />
      <circle cx="71.5" cy="46" r="2" fill={look.skinShade} opacity="0.6" />
      {look.accessory === "earring" && (
        <circle cx="28.5" cy="51.5" r="1.8" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
      )}

      {/* head */}
      <ellipse cx="50" cy="44" rx="21.5" ry="23.5" fill={look.skin} />
      {/* soft cheek shading for form */}
      <path
        d="M30 47 C32 62 42 69 50 69 C58 69 68 62 70 47 C67 58 58 63 50 63 C42 63 33 58 30 47 Z"
        fill={look.skinShade}
        opacity="0.4"
      />
      {/* warm cheek blush for a friendly cartoon look */}
      <ellipse cx="37" cy="53" rx="4.2" ry="2.6" fill="#e8736b" opacity="0.18" />
      <ellipse cx="63" cy="53" rx="4.2" ry="2.6" fill="#e8736b" opacity="0.18" />
      {/* nose */}
      <path
        d="M50 45 C48 50 46.4 52.4 47.2 54 C48.4 55.2 51.6 55.2 52.8 54 C53.6 52.4 52 50 50 45 Z"
        fill={look.skinShade}
        opacity="0.55"
      />

      {look.freckles && <Freckles />}

      <Hair look={look} />
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
    <g fill="#b9794e" opacity="0.55">
      <circle cx="38" cy="51" r="0.9" />
      <circle cx="42" cy="53" r="0.9" />
      <circle cx="34" cy="53" r="0.8" />
      <circle cx="62" cy="51" r="0.9" />
      <circle cx="58" cy="53" r="0.9" />
      <circle cx="66" cy="53" r="0.8" />
    </g>
  );
}

function Hair({ look }: { look: CharacterLook }) {
  switch (look.hairStyle) {
    case "bald":
      return null;
    case "buzz":
      return (
        <path
          d="M29 38 C31 23 42 18 50 18 C58 18 69 23 71 38 C64 29 56 27 50 27 C44 27 36 29 29 38 Z"
          fill={look.hair}
        />
      );
    case "slick":
      return (
        <path
          d="M28 40 C28 21 40 15 50 15 C60 15 72 21 72 40 C72 32 64 23 50 23 C40 23 32 30 28 40 Z"
          fill={look.hair}
        />
      );
    case "long":
      return (
        <>
          <path d="M26 62 C23 39 30 17 50 17 C70 17 77 39 74 62 L66 62 C70 41 64 25 50 25 C36 25 30 41 34 62 Z" fill={look.hair} />
          <path d="M29 40 C31 21 42 15 50 15 C58 15 69 21 71 40 C63 29 56 26 50 26 C44 26 37 29 29 40 Z" fill={look.hair} />
        </>
      );
    case "afro":
      return (
        <path
          d="M27 36 C19 34 21 17 34 15 C36 7 50 6 56 12 C71 10 81 22 73 34 C81 38 75 49 68 44 C66 31 58 27 50 27 C42 27 34 31 32 44 C25 49 19 38 27 36 Z"
          fill={look.hair}
        />
      );
    case "tuft":
      return (
        <path
          d="M29 38 C30 24 41 17 50 17 C60 17 70 24 71 38 C66 31 60 33 57 26 C55 33 49 33 47 27 C44 34 38 33 35 27 C33 33 30 35 29 38 Z"
          fill={look.hair}
        />
      );
    case "short":
    default:
      return (
        <path
          d="M29 40 C29 22 41 16 50 16 C59 16 71 22 71 40 C65 30 58 27 50 27 C42 27 35 30 29 40 Z"
          fill={look.hair}
        />
      );
  }
}

function FacialHairMark({ look }: { look: CharacterLook }) {
  const c = look.hair;
  switch (look.facialHair) {
    case "stubble":
      return (
        <path
          d="M33 50 C35 63 42 69 50 69 C58 69 65 63 67 50 C64 60 57 64 50 64 C43 64 36 60 33 50 Z"
          fill={c}
          opacity="0.22"
        />
      );
    case "mustache":
      return (
        <path
          d="M41 54 C45 52 48 53 50 54 C52 53 55 52 59 54 C56 57.5 53 56.5 50 55.4 C47 56.5 44 57.5 41 54 Z"
          fill={c}
        />
      );
    case "goatee":
      return (
        <>
          <path d="M42 54 C45 53 48 54 50 54.5 C52 54 55 53 58 54 C55 56 52 55.5 50 55 C48 55.5 45 56 42 54 Z" fill={c} />
          <path d="M44 61 C46 66 54 66 56 61 C55 65 52 67 50 67 C48 67 45 65 44 61 Z" fill={c} />
        </>
      );
    case "beard":
      return (
        <path
          d="M31 47 C33 64 42 70 50 70 C58 70 67 64 69 47 C68 58 63 63 63 60 C61 64 56 65 50 65 C44 65 39 64 37 60 C37 63 32 58 31 47 Z"
          fill={c}
        />
      );
    case "fullbeard":
      return (
        <path
          d="M30 44 C30 66 40 74 50 74 C60 74 70 66 70 44 C70 56 64 62 62 66 C58 69 54 70 50 70 C46 70 42 69 38 66 C36 62 30 56 30 44 Z"
          fill={c}
        />
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
        <rect x="33" y="40" width="14" height="10" rx="4" fill="#0b0f16" />
        <rect x="53" y="40" width="14" height="10" rx="4" fill="#0b0f16" />
        <rect x="46" y="43" width="8" height="2.6" rx="1.3" fill="#0b0f16" />
        <rect x="35" y="42" width="5" height="3" rx="1.5" fill="#3a4456" opacity="0.85" />
        <rect x="55" y="42" width="5" height="3" rx="1.5" fill="#3a4456" opacity="0.85" />
      </g>
    );
  }

  const focused = look.eyes === "focused";
  const irisR = focused ? 2.3 : 2.8;
  const whiteRx = focused ? 4 : 4.6;
  const lids = blink ? (
    <g className="pn-blink" fill={look.skin} style={{ animationDelay: `${blinkDelay}s` }}>
      <rect x="35" y="40" width="11" height="7" rx="3.5" />
      <rect x="54" y="40" width="11" height="7" rx="3.5" />
    </g>
  ) : null;

  const eyeballs = (
    <g>
      {/* whites */}
      <ellipse cx="40.5" cy="46" rx={whiteRx} ry="3.4" fill="#fbfdff" />
      <ellipse cx="59.5" cy="46" rx={whiteRx} ry="3.4" fill="#fbfdff" />
      {/* iris + pupil + catchlight */}
      <g>
        <circle cx="41" cy="46" r={irisR} fill="#5b3a26" />
        <circle cx="59" cy="46" r={irisR} fill="#5b3a26" />
        <circle cx="41" cy="46" r={irisR * 0.55} fill="#14161d" />
        <circle cx="59" cy="46" r={irisR * 0.55} fill="#14161d" />
        <circle cx="42" cy="44.8" r="0.9" fill="#fff" opacity="0.9" />
        <circle cx="60" cy="44.8" r="0.9" fill="#fff" opacity="0.9" />
      </g>
    </g>
  );

  if (look.eyes === "glasses") {
    return (
      <g>
        {eyeballs}
        {lids}
        <g fill="none" stroke="#1f2937" strokeWidth="2">
          <circle cx="41" cy="46" r="7" />
          <circle cx="59" cy="46" r="7" />
          <line x1="48" y1="46" x2="52" y2="46" />
          <line x1="34" y1="45" x2="30" y2="44" />
          <line x1="66" y1="45" x2="70" y2="44" />
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
        <g stroke={stroke} strokeWidth="2.8" strokeLinecap="round">
          <line x1="34" y1="38" x2="46" y2="41.5" />
          <line x1="66" y1="38" x2="54" y2="41.5" />
        </g>
      );
    case "raised":
      return (
        <g stroke={stroke} strokeWidth="2.6" strokeLinecap="round" fill="none">
          <path d="M34 38.5 Q41 34.5 47 37.5" />
          <path d="M53 37.5 Q59 34.5 66 38.5" />
        </g>
      );
    case "calm":
      return (
        <g stroke={stroke} strokeWidth="2.4" strokeLinecap="round">
          <line x1="35" y1="39" x2="46" y2="39" />
          <line x1="54" y1="39" x2="65" y2="39" />
        </g>
      );
    case "neutral":
    default:
      return (
        <g stroke={stroke} strokeWidth="2.6" strokeLinecap="round">
          <line x1="35" y1="39" x2="46" y2="38" />
          <line x1="54" y1="38" x2="65" y2="39" />
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
        <path d="M42 55 Q50 57 58 55 L57 58 Q50 63 43 58 Z" fill="#5b2310" />
        <path d="M44 56 Q50 57.5 56 56 L55.5 57 Q50 58.4 44.5 57 Z" fill="#fff" opacity="0.9" />
        <ellipse cx="50" cy="60.5" rx="3.2" ry="1.6" fill="#c64b53" opacity="0.85" />
      </g>
    );
  }

  switch (look.mouth) {
    case "grin":
      return (
        <path d="M40 55 Q50 65 60 55 Q50 59 40 55 Z" fill="#fff" stroke={stroke} strokeWidth="1.4" />
      );
    case "smirk":
      return (
        <path d="M42 57 Q52 60 60 54" fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" />
      );
    case "tough":
      return (
        <line x1="42" y1="57" x2="58" y2="57" stroke={stroke} strokeWidth="2.8" strokeLinecap="round" />
      );
    case "flat":
      return (
        <line x1="43" y1="56" x2="57" y2="56" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" />
      );
    case "open":
      return <ellipse cx="50" cy="57" rx="5" ry="4" fill="#7c2d12" />;
    case "smile":
    default:
      return (
        <path d="M41 55 Q50 62 59 55" fill="none" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" />
      );
  }
}

function Hat({ look }: { look: CharacterLook }) {
  switch (look.hat) {
    case "top":
      return (
        <g>
          <rect x="26" y="22" width="48" height="6" rx="3" fill={look.hatColor} />
          <rect x="33" y="2" width="34" height="22" rx="3" fill={look.hatColor} />
          <rect x="33" y="16" width="34" height="5" fill={look.accent} opacity="0.85" />
        </g>
      );
    case "fedora":
      return (
        <g>
          <path d="M24 27 C32 23 44 22 50 22 C56 22 68 23 76 27 C68 30 60 30 50 30 C40 30 32 30 24 27 Z" fill={look.hatColor} />
          <path d="M32 25 C32 12 42 8 50 8 C58 8 68 12 68 25 C60 21 56 20 50 20 C44 20 40 21 32 25 Z" fill={look.hatColor} />
          <path d="M32 24 C40 21 60 21 68 24 L67 27 C60 25 40 25 33 27 Z" fill="#000" opacity="0.3" />
        </g>
      );
    case "cap":
      return (
        <g>
          <path d="M27 30 C27 16 38 11 50 11 C62 11 73 16 73 30 C66 22 58 20 50 20 C42 20 34 22 27 30 Z" fill={look.hatColor} />
          <path d="M22 30 C28 27 40 26 50 27 L50 33 C40 32 30 33 24 35 Z" fill={look.hatColor} />
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
          <rect x="28" y="30" width="44" height="7" rx="3.5" fill={look.hatColor} />
          <path d="M70 33 l9 -3 l-2 6 Z" fill={look.hatColor} />
        </g>
      );
    case "none":
    default:
      return null;
  }
}

export const Head = memo(HeadImpl);
