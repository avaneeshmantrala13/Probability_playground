import { type CSSProperties, memo, useEffect, useRef, useState } from "react";
import type { DeckSkin, TableTheme } from "../../lib/cosmetics";
import type { Seat } from "../../lib/poker";
import { getLook } from "./characters";
import { PlayingCard } from "./PlayingCard";
import { PokerAvatar } from "./PokerAvatar";
import type { Speech } from "./usePokerGame";

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
  /** The human seat is rendered larger / front-and-center. */
  isHero: boolean;
  /** Bumps to retrigger the deal animation on a fresh hand. */
  dealKey: number;
  /** Latest spoken line for this seat (drives the speech bubble). */
  speech?: Speech;
}

/** How long an action speech bubble stays up. */
const SPEECH_MS = 2200;

function PlayerSeatImpl({
  seat,
  deck,
  theme,
  isButton,
  isToAct,
  isWinner,
  reveal,
  reduced,
  position,
  isHero,
  dealKey,
  speech,
}: PlayerSeatProps) {
  const folded = seat.status === "folded";
  const out = seat.status === "out";
  const showFaces = seat.isHuman || reveal;
  const dealAnim = reduced ? "" : "pn-anim-deal";
  const look = getLook(seat.persona, seat.isHuman);

  // Short-lived speech bubble: shows whenever a new speech id arrives.
  const [bubble, setBubble] = useState<string>("");
  const lastSpeechId = useRef<number>(0);
  useEffect(() => {
    if (!speech || speech.id === lastSpeechId.current) return;
    lastSpeechId.current = speech.id;
    setBubble(speech.text);
    const t = window.setTimeout(() => setBubble(""), SPEECH_MS);
    return () => window.clearTimeout(t);
  }, [speech]);

  const ring: CSSProperties = isToAct
    ? { boxShadow: `0 0 0 3px ${theme.glow}, 0 0 18px ${theme.glow}` }
    : {};

  const cardSize = isHero ? "lg" : "sm";

  return (
    <div
      className={`pn-seat ${isHero ? "pn-seat-hero" : ""}`}
      style={{ top: position.top, left: position.left }}
    >
      {/* speech bubble (above the character) */}
      {bubble && !out && (
        <div
          className={`pn-speech ${reduced ? "" : "pn-anim-bubble"}`}
          style={{
            ["--pn-speech-accent" as string]: look.accent,
          }}
        >
          {bubble}
        </div>
      )}

      <div
        className={`pn-seat-card rounded-2xl px-2.5 py-2 text-center transition-opacity ${
          folded || out ? "opacity-45" : "opacity-100"
        } ${isWinner && !reduced ? "pn-winner" : ""}`}
        style={{
          background: "rgb(0 0 0 / 0.34)",
          backdropFilter: "blur(3px)",
          color: theme.text,
          ...ring,
        }}
      >
        {/* character + identity */}
        <div className="flex items-center justify-center gap-2">
          <PokerAvatar
            look={look}
            size={isHero ? 60 : 44}
            active={isToAct}
            dimmed={folded || out}
            title={seat.name}
          />
          <div className="min-w-0 text-left">
            <div className="flex items-center gap-1 text-sm font-semibold leading-tight">
              <span className="max-w-[6.5rem] truncate">{seat.name}</span>
              {isButton && (
                <span
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-[0.6rem] font-extrabold text-black"
                  title="Dealer button"
                >
                  D
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs leading-tight">
              <span className="font-mono tabular-nums opacity-90">
                {seat.stack.toLocaleString()}
              </span>
              {seat.status === "allin" && (
                <span className="rounded bg-rose-500/80 px-1 text-[0.6rem] font-bold uppercase text-white">
                  All-in
                </span>
              )}
            </div>
          </div>
        </div>

        {/* hole cards */}
        <div className={`mt-1.5 flex items-center justify-center gap-1 ${isHero ? "gap-1.5" : ""}`}>
          {seat.holeCards.length === 0 ? (
            <span className="opacity-40 text-xs">—</span>
          ) : (
            seat.holeCards.map((c, i) => (
              <PlayingCard
                key={`${dealKey}-${i}-${c}`}
                card={c}
                faceDown={!showFaces}
                deck={deck}
                size={cardSize}
                animClass={dealAnim}
                style={reduced ? undefined : { animationDelay: `${i * 90}ms` }}
              />
            ))
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
    </div>
  );
}

export const PlayerSeat = memo(PlayerSeatImpl);
