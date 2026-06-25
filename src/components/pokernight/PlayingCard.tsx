import { type CSSProperties, memo } from "react";
import type { DeckSkin } from "../../lib/cosmetics";
import { displayRank, isRedCard, suitSymbol } from "../../lib/poker";

interface PlayingCardProps {
  card?: string;
  faceDown?: boolean;
  deck: DeckSkin;
  size?: "sm" | "md" | "lg";
  /** Deal animation class to apply (suppressed under reduced motion upstream). */
  animClass?: string;
  style?: CSSProperties;
}

const SIZE: Record<NonNullable<PlayingCardProps["size"]>, string> = {
  sm: "h-9 w-7 text-[0.7rem]",
  md: "h-12 w-9 text-sm",
  lg: "h-16 w-12 text-base",
};

function PlayingCardImpl({
  card,
  faceDown,
  deck,
  size = "md",
  animClass,
  style,
}: PlayingCardProps) {
  const sizeClass = SIZE[size];

  if (faceDown || !card) {
    const backVars: CSSProperties = {
      ["--pn-deck-bg" as string]: deck.background,
      ["--pn-deck-border" as string]: deck.border,
      ["--pn-deck-ink" as string]: deck.ink,
      ...style,
    };
    return (
      <span
        className={`pn-card pn-card-back pn-pat-${deck.pattern} ${sizeClass} ${animClass ?? ""}`}
        style={backVars}
        aria-label="Face-down card"
      >
        <span className="pn-card-back-emblem">♠</span>
      </span>
    );
  }

  const red = isRedCard(card);
  return (
    <span
      className={`pn-card pn-card-face ${red ? "pn-card-red" : "pn-card-black"} ${sizeClass} ${animClass ?? ""}`}
      style={style}
      aria-label={`${displayRank(card)} ${suitSymbol(card)}`}
    >
      <span className="pn-card-rank">{displayRank(card)}</span>
      <span className="pn-card-suit">{suitSymbol(card)}</span>
    </span>
  );
}

export const PlayingCard = memo(PlayingCardImpl);
