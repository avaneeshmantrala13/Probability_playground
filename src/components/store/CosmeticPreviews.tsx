import type { CSSProperties } from "react";
import { SpadeIcon } from "../icons";
import type {
  AccentTheme,
  AvatarAccessory,
  ChipStyle,
  DeckSkin,
  PlayerOutfit,
  TableTheme,
  WinAnimation,
} from "../../lib/cosmetics";
import { PokerFigure } from "../pokernight/PokerFigure";
import { getCharacterLook } from "../../lib/characters";
import type { CharacterLook } from "../pokernight/characters";

/** Mini card-back preview rendering the skin's surface, border, ink + pattern. */
export function DeckPreview({ skin }: { skin: DeckSkin }) {
  const style = {
    background: skin.background,
    borderColor: skin.border,
    // Consumed by the CSS pattern overlays in store.css.
    ["--deck-ink" as string]: skin.ink,
  } as CSSProperties;

  return (
    <div
      className="pp-deck-preview flex h-28 w-20 items-center justify-center rounded-xl border-2 shadow-inner"
      style={style}
      role="img"
      aria-label={`${skin.name} card back`}
    >
      <span
        className="inline-flex h-9 w-9 items-center justify-center rounded-full"
        style={{
          color: skin.ink,
          border: `1.5px solid ${skin.ink}`,
        }}
      >
        <SpadeIcon size={16} />
      </span>
    </div>
  );
}

/** Felt swatch preview using the table's felt / rail / glow. */
export function TablePreview({ theme }: { theme: TableTheme }) {
  return (
    <div
      className="flex h-28 w-full items-center justify-center rounded-2xl p-2.5"
      style={{ background: theme.rail }}
      role="img"
      aria-label={`${theme.name} table felt`}
    >
      <div
        className="flex h-full w-full items-center justify-center rounded-xl"
        style={{
          background: theme.felt,
          boxShadow: `inset 0 0 22px 2px ${theme.glow}`,
        }}
      >
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{
            color: theme.text,
            border: `1px solid ${theme.glow}`,
          }}
        >
          Felt
        </span>
      </div>
    </div>
  );
}

/** Two-color swatch preview for an accent theme. */
export function AccentPreview({ theme }: { theme: AccentTheme }) {
  const [a, b] = theme.swatch;
  return (
    <div
      className="flex h-28 w-full overflow-hidden rounded-2xl border border-subtle"
      role="img"
      aria-label={`${theme.name} accent colors`}
    >
      <div className="flex-1" style={{ background: a }} />
      <div className="flex-1" style={{ background: b }} />
    </div>
  );
}

export function ChipPreview({ chip }: { chip: ChipStyle }) {
  return (
    <div
      className="flex h-28 w-28 items-center justify-center rounded-full border-4 shadow-lg"
      style={{ background: chip.face, borderColor: chip.edge }}
      role="img"
      aria-label={`${chip.name} chip`}
    >
      <span className="text-sm font-bold" style={{ color: chip.edge }}>
        {chip.label}
      </span>
    </div>
  );
}

export function AccessoryPreview({ accessory }: { accessory: AvatarAccessory }) {
  return (
    <div
      className="flex h-28 w-28 items-center justify-center rounded-full bg-surface-muted text-4xl"
      role="img"
      aria-label={`${accessory.name} accessory`}
    >
      {accessory.emoji || "—"}
    </div>
  );
}

export function AnimationPreview({ animation }: { animation: WinAnimation }) {
  return (
    <div
      className={`flex h-28 w-full items-center justify-center rounded-2xl bg-surface-muted ${animation.cssClass}`}
      role="img"
      aria-label={`${animation.name} animation`}
    >
      <span className="text-sm font-semibold text-secondary">Win!</span>
    </div>
  );
}

const TIER_LABEL: Record<PlayerOutfit["tier"], string> = {
  basic: "Default",
  casual: "Casual",
  sharp: "Sharp",
  luxury: "Luxury",
  legend: "Legend",
};

const DEFAULT_PREVIEW_LOOK: CharacterLook = {
  skin: "#e8b98f",
  skinShade: "#cf9568",
  hair: "#3b2a20",
  hairStyle: "short",
  hat: "none",
  hatColor: "#000",
  eyes: "normal",
  brow: "neutral",
  mouth: "smile",
  facialHair: "none",
  outfit: "#2563eb",
  outfitTrim: "#bfdbfe",
  accent: "#60a5fa",
  build: "average",
  posture: "upright",
  accessory: "none",
};

export function OutfitPreview({ outfit }: { outfit: PlayerOutfit }) {
  const look =
    outfit.characterId === "outfit-default"
      ? { ...DEFAULT_PREVIEW_LOOK, outfit: outfit.swatch[0], accent: outfit.swatch[1] }
      : getCharacterLook(outfit.characterId);

  if (!look) {
    return (
      <div className="flex h-28 w-full overflow-hidden rounded-2xl border border-subtle" role="img" aria-label={`${outfit.name} outfit`}>
        <div className="flex-1" style={{ background: outfit.swatch[0] }} />
        <div className="flex-1" style={{ background: outfit.swatch[1] }} />
      </div>
    );
  }

  return (
    <div className="relative flex h-28 w-full items-end justify-center overflow-hidden rounded-2xl bg-surface-muted" role="img" aria-label={`${outfit.name} outfit`}>
      <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-white">
        {TIER_LABEL[outfit.tier]}
      </span>
      <div className="h-[7.5rem] w-[5.5rem] origin-bottom scale-[0.72]">
        <PokerFigure look={look} reduced seatIndex={0} />
      </div>
    </div>
  );
}
