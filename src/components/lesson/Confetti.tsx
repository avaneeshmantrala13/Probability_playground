import { useMemo, type CSSProperties } from "react";

const COLORS = [
  "rgb(var(--color-accent))",
  "rgb(var(--color-success))",
  "rgb(var(--chart-2))",
  "rgb(var(--chart-3))",
  "rgb(var(--color-danger))",
];

interface Piece {
  left: number;
  xDrift: number;
  rotate: number;
  duration: number;
  delay: number;
  color: string;
  width: number;
  height: number;
}

/**
 * Lightweight celebratory confetti. Pieces are GPU-friendly transforms only and
 * are suppressed under prefers-reduced-motion (see .pp-confetti-piece in CSS).
 */
export function Confetti({ count = 44 }: { count?: number }) {
  const pieces = useMemo<Piece[]>(() => {
    return Array.from({ length: count }, () => ({
      left: Math.random() * 100,
      xDrift: (Math.random() - 0.5) * 240,
      rotate: 360 + Math.random() * 540,
      duration: 2.4 + Math.random() * 1.8,
      delay: Math.random() * 0.6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      width: 6 + Math.random() * 5,
      height: 10 + Math.random() * 8,
    }));
  }, [count]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="pp-confetti-piece"
          style={
            {
              left: `${p.left}%`,
              width: `${p.width}px`,
              height: `${p.height}px`,
              background: p.color,
              "--pp-confetti-x": `${p.xDrift}px`,
              "--pp-confetti-rot": `${p.rotate}deg`,
              "--pp-confetti-dur": `${p.duration}s`,
              "--pp-confetti-delay": `${p.delay}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
