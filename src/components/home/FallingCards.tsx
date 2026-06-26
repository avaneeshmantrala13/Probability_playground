import { useMemo, type CSSProperties } from "react";
import {
  RANKS,
  SUITS,
  cardName,
  isRed,
  rankLabel,
  suitSymbol,
  type Card,
} from "../games/poker/deck";

const RED = "#d4183d";
const BLACK = "#1f2937";

interface FallingPiece {
  card: Card;
  /** Horizontal start position as a viewport-width percentage. */
  left: number;
  /** Rendered card width in px (height derives at 1.4×). */
  width: number;
  /** Full fall duration in seconds (slow drift). */
  duration: number;
  /** Negative delay spreads pieces across the screen on first paint. */
  delay: number;
  /** Horizontal sway midway through the fall, in px. */
  sway: number;
  rotateStart: number;
  rotateMid: number;
  rotateEnd: number;
  /** Per-card opacity for soft depth variation. */
  opacity: number;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Decorative, GPU-friendly app-wide background layer: a handful of
 * randomly generated playing cards drifting slowly down the screen. Rendered as
 * a fixed, full-viewport, pointer-events-none / aria-hidden layer that sits
 * BEHIND the page content (low z-index); the opaque `pp-card` panels naturally
 * occlude any card that drifts under them. Suppressed under prefers-reduced-motion
 * (see `.pp-falling-card` in index.css).
 */
export function FallingCards({ count = 15 }: { count?: number }) {
  const pieces = useMemo<FallingPiece[]>(() => {
    return Array.from({ length: count }, () => {
      const duration = 14 + Math.random() * 14; // 14–28s
      return {
        card: { rank: pick(RANKS), suit: pick(SUITS) },
        left: Math.random() * 100,
        width: 44 + Math.random() * 34, // 44–78px
        duration,
        delay: -Math.random() * duration,
        sway: (Math.random() - 0.5) * 60,
        rotateStart: (Math.random() - 0.5) * 30,
        rotateMid: (Math.random() - 0.5) * 30,
        rotateEnd: (Math.random() - 0.5) * 30,
        opacity: 0.55 + Math.random() * 0.45,
      };
    });
  }, [count]);

  return (
    <div className="pp-falling-cards-layer" aria-hidden>
      {pieces.map((p, i) => {
        const color = isRed(p.card) ? RED : BLACK;
        const label = rankLabel(p.card.rank);
        const symbol = suitSymbol(p.card.suit);
        return (
          <div
            key={i}
            className="pp-falling-card"
            title={cardName(p.card)}
            style={
              {
                left: `${p.left}%`,
                width: `${p.width}px`,
                height: `${p.width * 1.4}px`,
                color,
                opacity: p.opacity,
                "--pp-card-dur": `${p.duration}s`,
                "--pp-card-delay": `${p.delay}s`,
                "--pp-card-sway": `${p.sway}px`,
                "--pp-card-rot-start": `${p.rotateStart}deg`,
                "--pp-card-rot-mid": `${p.rotateMid}deg`,
                "--pp-card-rot-end": `${p.rotateEnd}deg`,
              } as CSSProperties
            }
          >
            <span className="pp-falling-card-corner">
              {label}
              <span className="pp-falling-card-corner-suit">{symbol}</span>
            </span>
            <span className="pp-falling-card-pip">{symbol}</span>
          </div>
        );
      })}
    </div>
  );
}
