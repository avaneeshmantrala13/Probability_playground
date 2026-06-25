import { useState } from "react";
import { useProgress } from "../context/ProgressContext";
import type { CosmeticCategory } from "../lib/progress";
import {
  ACCENT_THEMES,
  AVATAR_ACCESSORIES,
  CHIP_STYLES,
  DECK_SKINS,
  TABLE_THEMES,
  WIN_ANIMATIONS,
} from "../lib/cosmetics";
import { CosmeticCard } from "../components/store/CosmeticCard";
import {
  AccentPreview,
  AccessoryPreview,
  AnimationPreview,
  ChipPreview,
  DeckPreview,
  TablePreview,
} from "../components/store/CosmeticPreviews";
import { TokenIcon } from "../components/store/TokenIcon";
import "../components/store/store.css";

type TabId = CosmeticCategory;

const TABS: { id: TabId; label: string }[] = [
  { id: "deckSkin", label: "Card Decks" },
  { id: "tableTheme", label: "Table Felts" },
  { id: "chipStyle", label: "Chip Styles" },
  { id: "avatarAccessory", label: "Avatar Gear" },
  { id: "animation", label: "Win Animations" },
  { id: "accentTheme", label: "Accent Themes" },
];

export function Store() {
  const { progress, purchaseCosmetic, equipCosmetic } = useProgress();
  const [tab, setTab] = useState<TabId>("deckSkin");

  const tokens = progress.tokens ?? 0;
  const owned = progress.ownedCosmetics ?? [];
  const equipped = progress.equipped;

  const isOwned = (id: string) => owned.includes(id);
  const isEquipped = (category: CosmeticCategory, id: string) =>
    equipped?.[category] === id;

  return (
    <div>
      <header className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
              Store
            </h1>
            <p className="mt-2 max-w-xl text-secondary">
              Premium decks, felts, chips, avatar gear, win animations, and accent
              colors — your token sink for the high-stakes lifestyle.
            </p>
          </div>
          <span className="pp-card inline-flex items-center gap-2 px-4 py-2.5 text-base font-bold text-primary">
            <TokenIcon size={20} className="text-accent" />
            {tokens.toLocaleString()}
            <span className="text-sm font-medium text-muted">tokens</span>
          </span>
        </div>

        <div
          role="tablist"
          aria-label="Cosmetic categories"
          className="mt-5 inline-flex flex-wrap gap-1 rounded-xl bg-surface-muted p-1"
        >
          {TABS.map((t) => {
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={[
                  "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                  active
                    ? "bg-surface text-accent shadow-card"
                    : "text-secondary hover:text-primary",
                ].join(" ")}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tab === "deckSkin" &&
          DECK_SKINS.map((skin) => (
            <CosmeticCard
              key={skin.id}
              name={skin.name}
              description={skin.description}
              price={skin.price}
              owned={isOwned(skin.id)}
              equipped={isEquipped("deckSkin", skin.id)}
              affordable={tokens >= skin.price}
              preview={<DeckPreview skin={skin} />}
              onBuy={() => purchaseCosmetic(skin.id, skin.price)}
              onEquip={() => equipCosmetic("deckSkin", skin.id)}
            />
          ))}

        {tab === "tableTheme" &&
          TABLE_THEMES.map((theme) => (
            <CosmeticCard
              key={theme.id}
              name={theme.name}
              description={theme.description}
              price={theme.price}
              owned={isOwned(theme.id)}
              equipped={isEquipped("tableTheme", theme.id)}
              affordable={tokens >= theme.price}
              preview={<TablePreview theme={theme} />}
              onBuy={() => purchaseCosmetic(theme.id, theme.price)}
              onEquip={() => equipCosmetic("tableTheme", theme.id)}
            />
          ))}

        {tab === "chipStyle" &&
          CHIP_STYLES.map((chip) => (
            <CosmeticCard
              key={chip.id}
              name={chip.name}
              description={chip.description}
              price={chip.price}
              owned={isOwned(chip.id)}
              equipped={isEquipped("chipStyle", chip.id)}
              affordable={tokens >= chip.price}
              preview={<ChipPreview chip={chip} />}
              onBuy={() => purchaseCosmetic(chip.id, chip.price)}
              onEquip={() => equipCosmetic("chipStyle", chip.id)}
            />
          ))}

        {tab === "avatarAccessory" &&
          AVATAR_ACCESSORIES.map((acc) => (
            <CosmeticCard
              key={acc.id}
              name={acc.name}
              description={acc.description}
              price={acc.price}
              owned={isOwned(acc.id)}
              equipped={isEquipped("avatarAccessory", acc.id)}
              affordable={tokens >= acc.price}
              preview={<AccessoryPreview accessory={acc} />}
              onBuy={() => purchaseCosmetic(acc.id, acc.price)}
              onEquip={() => equipCosmetic("avatarAccessory", acc.id)}
            />
          ))}

        {tab === "animation" &&
          WIN_ANIMATIONS.map((anim) => (
            <CosmeticCard
              key={anim.id}
              name={anim.name}
              description={anim.description}
              price={anim.price}
              owned={isOwned(anim.id)}
              equipped={isEquipped("animation", anim.id)}
              affordable={tokens >= anim.price}
              preview={<AnimationPreview animation={anim} />}
              onBuy={() => purchaseCosmetic(anim.id, anim.price)}
              onEquip={() => equipCosmetic("animation", anim.id)}
            />
          ))}

        {tab === "accentTheme" &&
          ACCENT_THEMES.map((theme) => (
            <CosmeticCard
              key={theme.id}
              name={theme.name}
              description={theme.description}
              price={theme.price}
              owned={isOwned(theme.id)}
              equipped={isEquipped("accentTheme", theme.id)}
              affordable={tokens >= theme.price}
              preview={<AccentPreview theme={theme} />}
              onBuy={() => purchaseCosmetic(theme.id, theme.price)}
              onEquip={() => equipCosmetic("accentTheme", theme.id)}
            />
          ))}
      </div>
    </div>
  );
}

export default Store;
