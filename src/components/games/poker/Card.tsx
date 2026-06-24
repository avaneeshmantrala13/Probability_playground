import { memo } from "react";
import { cardName, isRed, rankLabel, suitSymbol, type Card as CardModel } from "./deck";

const RED = "#d4183d";
const BLACK = "#1f2937";

interface PlayingCardProps {
  /** The card to show face up. Ignored when faceDown is true. */
  card?: CardModel;
  faceDown?: boolean;
  /** Rendered width in px; height is width * 1.4. */
  width?: number;
  /** When set, plays the staggered deal-in animation with this delay (seconds). */
  dealDelay?: number;
  className?: string;
}

/**
 * A single playing card rendered as inline SVG. The face is a fixed light
 * surface (legible in both light and dark mode); only surrounding UI uses
 * theme tokens. No external assets.
 */
function PlayingCardBase({
  card,
  faceDown = false,
  width = 64,
  dealDelay,
  className,
}: PlayingCardProps) {
  const height = Math.round(width * 1.4);
  const animated = dealDelay !== undefined;

  return (
    <div
      className={[animated ? "poker-card-deal" : "", className ?? ""]
        .join(" ")
        .trim()}
      style={animated ? { animationDelay: `${dealDelay}s` } : undefined}
    >
      {faceDown || !card ? (
        <CardBack width={width} height={height} />
      ) : (
        <CardFace card={card} width={width} height={height} />
      )}
    </div>
  );
}

function CardFace({
  card,
  width,
  height,
}: {
  card: CardModel;
  width: number;
  height: number;
}) {
  const color = isRed(card) ? RED : BLACK;
  const label = rankLabel(card.rank);
  const symbol = suitSymbol(card.suit);

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 140"
      role="img"
      aria-label={cardName(card)}
      style={{ display: "block" }}
    >
      <rect
        x="1.5"
        y="1.5"
        width="97"
        height="137"
        rx="11"
        fill="#fdfdfb"
        stroke="#d8d8d8"
        strokeWidth="1.5"
      />
      <text
        x="13"
        y="30"
        fontSize="26"
        fontWeight="800"
        fontFamily="Inter, system-ui, sans-serif"
        fill={color}
        textAnchor="middle"
      >
        {label}
      </text>
      <text x="13" y="48" fontSize="18" fill={color} textAnchor="middle">
        {symbol}
      </text>
      <text
        x="50"
        y="92"
        fontSize="50"
        fill={color}
        textAnchor="middle"
        opacity="0.92"
      >
        {symbol}
      </text>
      <g transform="rotate(180 87 110)">
        <text
          x="87"
          y="110"
          fontSize="26"
          fontWeight="800"
          fontFamily="Inter, system-ui, sans-serif"
          fill={color}
          textAnchor="middle"
        >
          {label}
        </text>
        <text x="87" y="128" fontSize="18" fill={color} textAnchor="middle">
          {symbol}
        </text>
      </g>
    </svg>
  );
}

function CardBack({ width, height }: { width: number; height: number }) {
  const patternId = "poker-back-pattern";
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 140"
      role="img"
      aria-label="Face-down card"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id="poker-back-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b2f7a" />
          <stop offset="100%" stopColor="#1f1747" />
        </linearGradient>
        <pattern
          id={patternId}
          width="14"
          height="14"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="14" height="14" fill="url(#poker-back-grad)" />
          <circle cx="7" cy="7" r="2.2" fill="#6c5ce7" opacity="0.55" />
        </pattern>
      </defs>
      <rect
        x="1.5"
        y="1.5"
        width="97"
        height="137"
        rx="11"
        fill="url(#poker-back-grad)"
        stroke="#15102e"
        strokeWidth="1.5"
      />
      <rect
        x="8"
        y="8"
        width="84"
        height="124"
        rx="8"
        fill={`url(#${patternId})`}
        stroke="#8b80f0"
        strokeWidth="1.5"
        opacity="0.9"
      />
    </svg>
  );
}

export const PlayingCard = memo(PlayingCardBase);
