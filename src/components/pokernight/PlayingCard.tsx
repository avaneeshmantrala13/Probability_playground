import { type CSSProperties, memo } from "react";
import type { DeckSkin } from "../../lib/cosmetics";
import { displayRank, isRedCard, suitSymbol } from "../../lib/poker";

interface PlayingCardProps {
  card?: string;
  faceDown?: boolean;
  masked?: boolean;
  deck: DeckSkin;
  size?: "sm" | "md" | "lg";
  /** Deal animation class to apply (suppressed under reduced motion upstream). */
  animClass?: string;
  /**
   * When true, render a real two-sided card that physically flips from its back
   * to its face on mount (used for the dealer's community-card reveals). The
   * caller keys the card per street so the flip fires exactly once.
   */
  flip?: boolean;
  style?: CSSProperties;
}

const DIM: Record<NonNullable<PlayingCardProps["size"]>, string> = {
  sm: "h-9 w-7",
  md: "h-12 w-9",
  lg: "h-16 w-12",
};
const TXT: Record<NonNullable<PlayingCardProps["size"]>, string> = {
  sm: "text-[0.7rem]",
  md: "text-sm",
  lg: "text-base",
};

function MaskedFace({ txt }: { txt: string }) {
  return (
    <span className={`pn-card pn-card-face pn-card-masked ${txt}`} aria-label="Hidden card">
      <span className="pn-card-rank">?</span>
      <span className="pn-card-suit">?</span>
    </span>
  );
}

function Face({ card, txt }: { card: string; txt: string }) {
  const red = isRedCard(card);
  return (
    <span
      className={`pn-card pn-card-face ${red ? "pn-card-red" : "pn-card-black"} ${txt}`}
      aria-label={`${displayRank(card)} ${suitSymbol(card)}`}
    >
      <span className="pn-card-rank">{displayRank(card)}</span>
      <span className="pn-card-suit">{suitSymbol(card)}</span>
    </span>
  );
}

function Back({ deck, txt }: { deck: DeckSkin; txt: string }) {
  const backVars: CSSProperties = {
    ["--pn-deck-bg" as string]: deck.background,
    ["--pn-deck-border" as string]: deck.border,
    ["--pn-deck-ink" as string]: deck.ink,
  };
  return (
    <span
      className={`pn-card pn-card-back pn-pat-${deck.pattern} ${txt}`}
      style={backVars}
      aria-label="Face-down card"
    >
      <span className="pn-card-back-emblem">♠</span>
    </span>
  );
}

function PlayingCardImpl({
  card,
  faceDown,
  masked,
  deck,
  size = "md",
  animClass,
  flip,
  style,
}: PlayingCardProps) {
  const dim = DIM[size];
  const txt = TXT[size];

  if (masked && card) {
    return (
      <span className={`pn-card pn-card-masked-wrap ${dim} ${animClass ?? ""}`} style={style}>
        <MaskedFace txt={txt} />
      </span>
    );
  }

  // Real 3D flip: a two-sided card that rotates from back to face on mount.
  if (flip && card && !faceDown) {
    return (
      <span className={`pn-card-flip ${dim}`}>
        <span className="pn-card-flip-inner pn-anim-flip3d" style={style}>
          <span className="pn-card-side pn-card-side-back">
            <Back deck={deck} txt={txt} />
          </span>
          <span className="pn-card-side pn-card-side-front">
            <Face card={card} txt={txt} />
          </span>
        </span>
      </span>
    );
  }

  if (faceDown || !card) {
    const backVars: CSSProperties = {
      ["--pn-deck-bg" as string]: deck.background,
      ["--pn-deck-border" as string]: deck.border,
      ["--pn-deck-ink" as string]: deck.ink,
      ...style,
    };
    return (
      <span
        className={`pn-card pn-card-back pn-pat-${deck.pattern} ${dim} ${txt} ${animClass ?? ""}`}
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
      className={`pn-card pn-card-face ${red ? "pn-card-red" : "pn-card-black"} ${dim} ${txt} ${animClass ?? ""}`}
      style={style}
      aria-label={`${displayRank(card)} ${suitSymbol(card)}`}
    >
      <span className="pn-card-rank">{displayRank(card)}</span>
      <span className="pn-card-suit">{suitSymbol(card)}</span>
    </span>
  );
}

export const PlayingCard = memo(PlayingCardImpl);
