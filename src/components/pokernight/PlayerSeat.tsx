import { type CSSProperties, memo, useEffect, useRef, useState } from "react";
import type { DeckSkin, TableTheme } from "../../lib/cosmetics";
import type { Seat } from "../../lib/poker";
import { getLook } from "./characters";
import { PlayingCard } from "./PlayingCard";
import { PokerFigure } from "./PokerFigure";
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
  position: { top: string; left: string; scale?: number };
  /** The human seat is rendered as a first-person dock at the bottom. */
  isHero: boolean;
  /** Bumps to retrigger the deal animation on a fresh hand. */
  dealKey: number;
  /** Latest spoken line for this seat (drives the speech bubble). */
  speech?: Speech;
}

/** How long an action speech bubble stays up. */
const SPEECH_MS = 2200;

function useBubble(speech: Speech | undefined): string {
  const [bubble, setBubble] = useState<string>("");
  const lastSpeechId = useRef<number>(0);
  useEffect(() => {
    if (!speech || speech.id === lastSpeechId.current) return;
    lastSpeechId.current = speech.id;
    setBubble(speech.text);
    const t = window.setTimeout(() => setBubble(""), SPEECH_MS);
    return () => window.clearTimeout(t);
  }, [speech]);
  return bubble;
}

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
  const bubble = useBubble(speech);

  const wrapStyle: CSSProperties = {
    top: position.top,
    left: position.left,
    ["--pn-seat-scale" as string]: String(position.scale ?? 1),
  };

  const nameplate = (
    <div
      className={`pn-nameplate ${isToAct ? "pn-nameplate-active" : ""} ${
        folded || out ? "opacity-50" : ""
      }`}
      style={{
        color: theme.text,
        ...(isToAct ? { boxShadow: `0 0 0 2px ${theme.glow}, 0 0 16px ${theme.glow}` } : {}),
      }}
    >
      <span className="flex items-center gap-1">
        <span className="max-w-[7rem] truncate font-semibold">{seat.name}</span>
        {isButton && (
          <span className="pn-dealer-btn" title="Dealer button">
            D
          </span>
        )}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="font-mono tabular-nums opacity-90">
          {seat.stack.toLocaleString()}
        </span>
        {seat.status === "allin" && (
          <span className="rounded bg-rose-500/80 px-1 text-[0.58rem] font-bold uppercase text-white">
            All-in
          </span>
        )}
      </span>
    </div>
  );

  const holeCards = (
    <div className={`pn-hole ${isHero ? "pn-hole-hero" : ""}`}>
      {seat.holeCards.length === 0 ? (
        <span className="opacity-40 text-xs">—</span>
      ) : (
        seat.holeCards.map((c, i) => (
          <PlayingCard
            key={`${dealKey}-${i}-${c}`}
            card={c}
            faceDown={!showFaces}
            deck={deck}
            size={isHero ? "lg" : "sm"}
            animClass={isHero ? "" : dealAnim}
            style={isHero || reduced ? undefined : { animationDelay: `${i * 90}ms` }}
          />
        ))
      )}
    </div>
  );

  const betChip = seat.roundBet > 0 && (
    <div className="pn-seat-bet">
      <span className="pn-chip">
        <span aria-hidden>🪙</span>
        {seat.roundBet.toLocaleString()}
      </span>
    </div>
  );

  // ---- First-person hero dock (the player, seen from their own eyes) ----
  if (isHero) {
    return (
      <div className="pn-seat pn-hero-dock" style={wrapStyle}>
        {bubble && !out && (
          <div className="pn-speech" style={{ ["--pn-speech-accent" as string]: look.accent }}>
            {bubble}
          </div>
        )}
        <div
          key={dealKey}
          className={`pn-hero-cards ${
            !reduced && seat.holeCards.length > 0 ? "pn-anim-handin" : ""
          } ${isWinner && !reduced ? "pn-winner" : ""}`}
          style={isToAct ? { boxShadow: `0 0 0 2px ${theme.glow}, 0 0 26px ${theme.glow}` } : {}}
        >
          {holeCards}
        </div>
        {nameplate}
        {betChip}
      </div>
    );
  }

  // ---- Opponent: a full seated figure across the table ----
  return (
    <div className="pn-seat" style={wrapStyle}>
      {bubble && !out && (
        <div className="pn-speech" style={{ ["--pn-speech-accent" as string]: look.accent }}>
          {bubble}
        </div>
      )}

      <div className={`pn-figure-wrap ${isWinner && !reduced ? "pn-winner" : ""}`}>
        <PokerFigure
          look={look}
          active={isToAct}
          dimmed={folded || out}
          reduced={reduced}
          talking={!!bubble && !out}
          seatIndex={seat.index}
          title={seat.name}
        />
        {!out && <div className="pn-figure-cards">{holeCards}</div>}
        {betChip}
      </div>

      {nameplate}

      {seat.lastAction && !out && (
        <div className="pn-last-action">{seat.lastAction}</div>
      )}
    </div>
  );
}

export const PlayerSeat = memo(PlayerSeatImpl);
