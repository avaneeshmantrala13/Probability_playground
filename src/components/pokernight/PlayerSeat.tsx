import type { CSSProperties } from "react";
import type { DeckSkin, TableTheme } from "../../lib/cosmetics";
import type { Seat } from "../../lib/poker";
import { PlayingCard } from "./PlayingCard";

interface PlayerSeatProps {
  seat: Seat;
  deck: DeckSkin;
  theme: TableTheme;
  isButton: boolean;
  isToAct: boolean;
  isWinner: boolean;
  /** Reveal a bot's hole cards (showdown). */
  reveal: boolean;
  reduced: boolean;
  position: { top: string; left: string };
  /** Bumps to retrigger the deal animation on a fresh hand. */
  dealKey: number;
}

export function PlayerSeat({
  seat,
  deck,
  theme,
  isButton,
  isToAct,
  isWinner,
  reveal,
  reduced,
  position,
  dealKey,
}: PlayerSeatProps) {
  const folded = seat.status === "folded";
  const out = seat.status === "out";
  const showFaces = seat.isHuman || reveal;
  const dealAnim = reduced ? "" : "pn-anim-deal";

  const ring: CSSProperties = isToAct
    ? { boxShadow: `0 0 0 3px ${theme.glow}, 0 0 18px ${theme.glow}` }
    : {};

  return (
    <div
      className="pn-seat"
      style={{ top: position.top, left: position.left }}
    >
      <div
        className={`rounded-2xl px-2.5 py-2 text-center transition-opacity ${
          folded || out ? "opacity-45" : "opacity-100"
        } ${isWinner && !reduced ? "pn-winner" : ""}`}
        style={{
          background: "rgb(0 0 0 / 0.34)",
          backdropFilter: "blur(3px)",
          color: theme.text,
          ...ring,
        }}
      >
        {/* hole cards */}
        <div className="mb-1 flex items-center justify-center gap-1">
          {seat.holeCards.length === 0 ? (
            <span className="opacity-40 text-xs">—</span>
          ) : (
            seat.holeCards.map((c, i) => (
              <PlayingCard
                key={`${dealKey}-${i}-${c}`}
                card={c}
                faceDown={!showFaces}
                deck={deck}
                size="sm"
                animClass={`${dealAnim}`}
                style={reduced ? undefined : { animationDelay: `${i * 70}ms` }}
              />
            ))
          )}
        </div>

        <div className="flex items-center justify-center gap-1.5 text-sm font-semibold">
          <span aria-hidden className="text-base leading-none">
            {seat.persona?.avatar ?? "🧑"}
          </span>
          <span className="max-w-[7rem] truncate">{seat.name}</span>
          {isButton && (
            <span
              className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-[0.6rem] font-extrabold text-black"
              title="Dealer button"
            >
              D
            </span>
          )}
        </div>

        <div className="mt-0.5 flex items-center justify-center gap-2 text-xs">
          <span className="font-mono tabular-nums opacity-90">
            {seat.stack.toLocaleString()}
          </span>
          {seat.status === "allin" && (
            <span className="rounded bg-rose-500/80 px-1 text-[0.6rem] font-bold uppercase text-white">
              All-in
            </span>
          )}
        </div>

        {seat.lastAction && !out && (
          <div className="mt-0.5 text-[0.62rem] uppercase tracking-wide opacity-70">
            {seat.lastAction}
          </div>
        )}

        {seat.roundBet > 0 && (
          <div className="mt-1 flex justify-center">
            <span className="pn-chip">
              <span aria-hidden>🪙</span>
              {seat.roundBet.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* table-talk bubble */}
      {seat.quip && !folded && (
        <div
          className={`absolute left-1/2 top-0 z-10 w-max max-w-[12rem] -translate-x-1/2 -translate-y-full rounded-xl bg-surface px-2.5 py-1.5 text-[0.7rem] text-primary shadow-card ${
            reduced ? "" : "pn-anim-bubble"
          }`}
        >
          {seat.quip}
        </div>
      )}
    </div>
  );
}
