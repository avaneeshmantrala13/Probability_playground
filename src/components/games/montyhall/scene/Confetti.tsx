import { useMemo } from "react";

const COLORS = ["#7c5cff", "#22c3a6", "#ff8a3d", "#ffd23d", "#ff5d8f"];

interface Piece {
  left: number;
  delay: number;
  duration: number;
  x: number;
  rot: number;
  color: string;
  size: number;
}

/**
 * Lightweight CSS confetti burst (transform/opacity only). Renders nothing
 * under reduced-motion. Pieces are computed once per mount.
 */
export function Confetti({ count = 26 }: { count?: number }) {
  const pieces = useMemo<Piece[]>(() => {
    return Array.from({ length: count }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.25,
      duration: 0.9 + Math.random() * 0.6,
      x: (Math.random() - 0.5) * 120,
      rot: 180 + Math.random() * 540,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 6 + Math.random() * 6,
    }));
  }, [count]);

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="mh-confetti-piece absolute top-0 block rounded-[2px]"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size * 0.6}px`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            // Consumed by the mh-confetti-fall keyframes.
            ["--mh-x" as string]: `${p.x}px`,
            ["--mh-r" as string]: `${p.rot}deg`,
          }}
        />
      ))}
    </div>
  );
}
