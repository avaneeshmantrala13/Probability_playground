import { memo, useId } from "react";
import type { CharacterLook } from "./characters";

interface PokerAvatarProps {
  look: CharacterLook;
  /** Pixel size of the (square) avatar. */
  size?: number;
  /** Highlight ring (e.g. while it's this character's turn). */
  active?: boolean;
  /** Dim the character (folded / out of the hand). */
  dimmed?: boolean;
  className?: string;
  title?: string;
}

/**
 * A fully parametric CSS/SVG character. No images, no network — every feature
 * (hair, hat, eyes, brow, mouth, outfit) is drawn from the `look` config so each
 * persona reads as a distinct expert player. Rendering is memoized because a
 * character's appearance never changes during a hand.
 */
function PokerAvatarImpl({
  look,
  size = 56,
  active = false,
  dimmed = false,
  className,
  title,
}: PokerAvatarProps) {
  const rawId = useId();
  const clipId = `pn-clip-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      className={`pn-avatar ${active ? "pn-avatar-active" : ""} ${className ?? ""}`}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={title ?? "Player character"}
      style={{
        ["--pn-av-accent" as string]: look.accent,
        opacity: dimmed ? 0.55 : 1,
      }}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="50" cy="50" r="46" />
        </clipPath>
      </defs>

      {/* framing ring + backdrop */}
      <circle cx="50" cy="50" r="47" fill="#0b1220" />
      <circle
        cx="50"
        cy="50"
        r="47"
        fill="none"
        stroke={look.accent}
        strokeWidth="3"
      />

      <g clipPath={`url(#${clipId})`}>
        <circle cx="50" cy="50" r="46" fill="#111827" />
        {/* soft accent wash */}
        <circle cx="50" cy="36" r="40" fill={look.accent} opacity="0.14" />

        {/* shoulders / outfit */}
        <path
          d="M50 70 C28 70 16 84 14 102 L86 102 C84 84 72 70 50 70 Z"
          fill={look.outfit}
        />
        {/* collar trim */}
        <path
          d="M50 70 C44 78 42 86 42 96 L58 96 C58 86 56 78 50 70 Z"
          fill={look.outfitTrim}
          opacity="0.9"
        />

        {/* neck */}
        <rect x="43" y="62" width="14" height="14" rx="6" fill={look.skinShade} />

        {/* head */}
        <ellipse cx="50" cy="44" rx="21" ry="23" fill={look.skin} />
        {/* jaw shading */}
        <path
          d="M31 48 C33 62 42 68 50 68 C58 68 67 62 69 48 C66 58 58 62 50 62 C42 62 34 58 31 48 Z"
          fill={look.skinShade}
          opacity="0.5"
        />
        {/* ears */}
        <circle cx="29" cy="46" r="4.2" fill={look.skin} />
        <circle cx="71" cy="46" r="4.2" fill={look.skin} />

        <Hair look={look} />
        <Eyes look={look} />
        <Brows look={look} />
        <Mouth look={look} />
        <Hat look={look} />
      </g>
    </svg>
  );
}

function Hair({ look }: { look: CharacterLook }) {
  switch (look.hairStyle) {
    case "bald":
      return null;
    case "buzz":
      return (
        <path
          d="M30 38 C32 24 42 19 50 19 C58 19 68 24 70 38 C64 30 56 28 50 28 C44 28 36 30 30 38 Z"
          fill={look.hair}
        />
      );
    case "slick":
      return (
        <path
          d="M29 40 C29 22 40 16 50 16 C60 16 71 22 71 40 C71 33 64 24 50 24 C40 24 33 30 29 40 Z"
          fill={look.hair}
        />
      );
    case "long":
      return (
        <>
          <path d="M27 60 C24 40 30 18 50 18 C70 18 76 40 73 60 L66 60 C70 42 64 26 50 26 C36 26 30 42 34 60 Z" fill={look.hair} />
          <path d="M30 40 C32 22 42 16 50 16 C58 16 68 22 70 40 C63 30 56 27 50 27 C44 27 37 30 30 40 Z" fill={look.hair} />
        </>
      );
    case "tuft":
      return (
        <path
          d="M30 38 C31 25 41 18 50 18 C60 18 69 25 70 38 C66 32 60 33 57 27 C55 33 49 33 47 28 C44 34 38 33 35 28 C33 33 31 35 30 38 Z"
          fill={look.hair}
        />
      );
    case "short":
    default:
      return (
        <path
          d="M30 40 C30 23 41 17 50 17 C59 17 70 23 70 40 C65 31 58 28 50 28 C42 28 35 31 30 40 Z"
          fill={look.hair}
        />
      );
  }
}

function Eyes({ look }: { look: CharacterLook }) {
  if (look.eyes === "shades") {
    return (
      <g fill="#0b0f16">
        <rect x="34" y="41" width="13" height="9" rx="3.5" />
        <rect x="53" y="41" width="13" height="9" rx="3.5" />
        <rect x="46" y="44" width="8" height="2.4" rx="1.2" />
        <rect x="35.5" y="42.5" width="4.5" height="2.6" rx="1.3" fill="#3a4456" opacity="0.8" />
      </g>
    );
  }
  if (look.eyes === "glasses") {
    return (
      <g>
        <circle cx="41" cy="46" r="3" fill="#1c2531" />
        <circle cx="59" cy="46" r="3" fill="#1c2531" />
        <g fill="none" stroke="#1f2937" strokeWidth="2">
          <circle cx="41" cy="46" r="6.5" />
          <circle cx="59" cy="46" r="6.5" />
          <line x1="47.5" y1="46" x2="52.5" y2="46" />
        </g>
      </g>
    );
  }
  const r = look.eyes === "focused" ? 2.2 : 2.9;
  return (
    <g fill="#1c2531">
      <circle cx="41" cy="46" r={r} />
      <circle cx="59" cy="46" r={r} />
    </g>
  );
}

function Brows({ look }: { look: CharacterLook }) {
  const stroke = look.hair;
  switch (look.brow) {
    case "angry":
      return (
        <g stroke={stroke} strokeWidth="2.6" strokeLinecap="round">
          <line x1="35" y1="38" x2="46" y2="41" />
          <line x1="65" y1="38" x2="54" y2="41" />
        </g>
      );
    case "raised":
      return (
        <g stroke={stroke} strokeWidth="2.4" strokeLinecap="round" fill="none">
          <path d="M35 39 Q41 35 47 38" />
          <path d="M53 38 Q59 35 65 39" />
        </g>
      );
    case "calm":
      return (
        <g stroke={stroke} strokeWidth="2.2" strokeLinecap="round">
          <line x1="36" y1="39" x2="46" y2="39" />
          <line x1="54" y1="39" x2="64" y2="39" />
        </g>
      );
    case "neutral":
    default:
      return (
        <g stroke={stroke} strokeWidth="2.4" strokeLinecap="round">
          <line x1="35" y1="39" x2="46" y2="38.5" />
          <line x1="54" y1="38.5" x2="65" y2="39" />
        </g>
      );
  }
}

function Mouth({ look }: { look: CharacterLook }) {
  const stroke = "#7c2d12";
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

export const PokerAvatar = memo(PokerAvatarImpl);
