import { useEffect, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";

export type CoinResult = "heads" | "tails";

function CoinFace({
  label,
  symbol,
  varName,
  back,
}: {
  label: string;
  symbol: string;
  varName: string;
  back?: boolean;
}) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center rounded-full font-bold text-accent-contrast"
      style={{
        background: `radial-gradient(circle at 35% 30%, rgb(${varName} / 0.95), rgb(${varName} / 0.7))`,
        border: "3px solid rgb(var(--color-surface))",
        boxShadow: "inset 0 0 0 2px rgb(0 0 0 / 0.08)",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform: back ? "rotateX(180deg)" : undefined,
      }}
    >
      <span style={{ fontSize: "1.4em", lineHeight: 1 }} aria-hidden="true">
        {symbol}
      </span>
      <span className="mt-0.5 text-[0.6em] uppercase tracking-wide opacity-90">
        {label}
      </span>
    </div>
  );
}

/**
 * A coin that physically flips and lands showing `result`. Re-animates whenever
 * `flipId` changes; lands instantly under reduced-motion.
 */
export function Coin({
  result,
  flipId,
  size = 96,
}: {
  result: CoinResult | null;
  flipId: number;
  size?: number;
}) {
  const reduced = useReducedMotion();
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (flipId === 0 || result === null) return;
    const baseTarget = result === "tails" ? 180 : 0;
    if (reduced) {
      setRotation(baseTarget);
      return;
    }
    setRotation((prev) => {
      let next = prev + 360 * 3;
      next = next - (((next % 360) + 360) % 360) + baseTarget;
      if (next <= prev) next += 360;
      return next;
    });
  }, [flipId, result, reduced]);

  const label =
    result === null
      ? "Coin ready to flip"
      : `Coin landed on ${result}`;

  return (
    <div
      role="img"
      aria-label={label}
      style={{ width: size, height: size, perspective: size * 6 }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
          transform: `rotateX(${rotation}deg)`,
          transition: reduced
            ? "none"
            : "transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1)",
          fontSize: size * 0.28,
        }}
      >
        <CoinFace label="Heads" symbol="H" varName="var(--chart-1)" />
        <CoinFace label="Tails" symbol="T" varName="var(--chart-3)" back />
      </div>
    </div>
  );
}
