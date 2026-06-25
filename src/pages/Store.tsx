import { useState } from "react";
import { useProgress } from "../context/ProgressContext";
import type { CosmeticCategory } from "../lib/progress";
import {
  ACCENT_THEMES,
  DECK_SKINS,
  TABLE_THEMES,
} from "../lib/cosmetics";
import { CosmeticCard } from "../components/store/CosmeticCard";
import {
  AccentPreview,
  DeckPreview,
  TablePreview,
} from "../components/store/CosmeticPreviews";
import { TokenIcon } from "../components/store/TokenIcon";
import "../components/store/store.css";

type TabId = CosmeticCategory;

const TABS: { id: TabId; label: string }[] = [
  { id: "deckSkin", label: "Card Decks" },
  { id: "tableTheme", label: "Table Themes" },
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
              Spend the tokens you win at the poker table on card decks, table
              themes, and app-wide accent colors. Buy once, equip any time.
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
                  "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
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
