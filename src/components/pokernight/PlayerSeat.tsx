import { type CSSProperties, memo, useEffect, useRef, useState } from "react";
import type { DeckSkin, TableTheme } from "../../lib/cosmetics";
import type { Seat } from "../../lib/poker";
import { getLook, type Expression } from "./characters";
import { PlayingCard } from "./PlayingCard";
import { PokerFigure, figureScale } from "./PokerFigure";
import type { Speech } from "./usePokerGame";
import { useGaze, type GazeOverride } from "./useGaze";

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
  /** Local viewer seat — only this seat's hole cards are face-up pre-showdown. */
  viewerSeatIndex?: number;
  /** Bumps to retrigger the deal animation on a fresh hand. */
  dealKey: number;
  /** Latest spoken line for this seat (drives the speech bubble). */
  speech?: Speech;
  /** Live, game-driven facial expression for this seat. */
  expression: Expression;
  /** Community-card count; an increase briefly pulls gazes to the board. */
  boardLen: number;
  /** Harness-only: force a fixed gaze target for screenshots. */
  gazeOverride?: GazeOverride;
}

/** How long an action speech bubble stays up (calmer reading pace). */
const SPEECH_MS = 3600;

function useBubble(speech: Speech | undefined): string {
  const [bubble, setBubble] = useState<string>("");
  const lastSpeechId = useRef<number>(0);
  useEffect(() => {
    // No speech (e.g. a fresh hand cleared them): drop the bubble immediately so
    // the talking flag — derived from `bubble` — stops the lip-sync in sync.
    if (!speech) {
      setBubble("");
      return;
    }
    if (speech.id === lastSpeechId.current) return;
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
  viewerSeatIndex,
  dealKey,
  speech,
  expression,
  boardLen,
  gazeOverride,
}: PlayerSeatProps) {
  const folded = seat.status === "folded";
  const out = seat.status === "out";
  const isViewer =
    viewerSeatIndex !== undefined
      ? seat.index === viewerSeatIndex
      : seat.isHuman;
  const showFaces = isViewer || reveal;
  const dealAnim = reduced ? "" : "pn-anim-deal";
  const look = getLook(seat.persona, seat.isHuman);
  const bubble = useBubble(speech);

  // Body orientation as a function of the seat's ANGLE around the felt ellipse
  // (camera/player at bottom-centre). Each opponent's torso is turned to sit
  // TANGENT to the rim — shoulders facing the table centre — instead of posing at
  // the camera. `hx` is how far the seat is to the side (-1 far-left .. +1 far-
  // right) and `near` is how close it sits to the camera (0 far/top .. 1 near).
  // Lateral + near seats turn the hardest (toward profile, ~up to 72°); far/top-
  // centre seats stay near-frontal because they're across the felt looking back.
  const leftPct = parseFloat(position.left);
  const topPct = parseFloat(position.top);
  const hx = Number.isFinite(leftPct) ? (leftPct - 50) / 43 : 0;
  const near = Number.isFinite(topPct) ? Math.max(0, Math.min(1, (topPct - 28) / 30)) : 0.5;
  const side = hx === 0 ? 0 : hx < 0 ? -1 : 1;
  // `turn` (-1..1) is the body's angle around the ring. It now mainly drives the
  // SVG torso SILHOUETTE (foreshortening + side contour) so the body reads as a
  // rounded volume turned in space. The CSS rotateY is kept GENTLE on top (the
  // shape carries the turn) to add a little plane-depth without shearing a slab.
  const turn = Math.max(-1, Math.min(1, -hx * (0.82 + 0.18 * near)));
  const bodyYaw = turn * 32;
  // The head yaws BACK ~half the body turn so a seated player still shows ~3/4 of
  // their face across the table (we can read the expression + gaze).
  const headYaw = -bodyYaw * 0.5;
  // Distinct per-persona overall scale (heavyset/broad larger, petite smaller).
  const figScale = figureScale(look.build);

  // Live gaze (eyes + subtle head lean). Hook is called unconditionally; the
  // hero path below simply ignores it. Inert under reduced motion / fixed override.
  const gaze = useGaze({
    seatIndex: seat.index,
    reduced,
    side,
    boardLen,
    talking: !!bubble && !out,
    override: gazeOverride,
  });

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

      <div
        className={`pn-figure-wrap ${isWinner && !reduced ? "pn-winner" : ""}`}
        style={{
          ["--pn-yaw" as string]: `${bodyYaw}deg`,
          ["--pn-head-yaw" as string]: `${headYaw}deg`,
          ["--pn-fig-scale" as string]: String(figScale),
        }}
      >
        <PokerFigure
          look={look}
          active={isToAct}
          dimmed={folded || out}
          reduced={reduced}
          talking={!!bubble && !out}
          expression={expression}
          gaze={gaze}
          turn={turn}
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
