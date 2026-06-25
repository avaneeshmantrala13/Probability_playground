import { memo, useId } from "react";
import type { CharacterLook } from "./characters";
import { Head } from "./face";

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
 * A round bust avatar built from the shared parametric `<Head>` primitives.
 * No images, no network — every feature comes from the `look` config. Memoized
 * because a character's appearance never changes during a hand.
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

      <circle cx="50" cy="50" r="47" fill="#0b1220" />
      <circle cx="50" cy="50" r="47" fill="none" stroke={look.accent} strokeWidth="3" />

      <g clipPath={`url(#${clipId})`}>
        <circle cx="50" cy="50" r="46" fill="#111827" />
        <circle cx="50" cy="36" r="40" fill={look.accent} opacity="0.14" />

        {/* shoulders / outfit */}
        <path d="M50 70 C28 70 16 84 14 102 L86 102 C84 84 72 70 50 70 Z" fill={look.outfit} />
        <path
          d="M50 70 C44 78 42 86 42 96 L58 96 C58 86 56 78 50 70 Z"
          fill={look.outfitTrim}
          opacity="0.9"
        />

        <Head look={look} />
      </g>
    </svg>
  );
}

export const PokerAvatar = memo(PokerAvatarImpl);
