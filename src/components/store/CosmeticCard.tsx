import type { ReactNode } from "react";
import { CheckIcon } from "../icons";
import { TokenIcon } from "./TokenIcon";

interface CosmeticCardProps {
  name: string;
  description: string;
  price: number;
  owned: boolean;
  equipped: boolean;
  affordable: boolean;
  preview: ReactNode;
  onBuy: () => void;
  onEquip: () => void;
}

export function CosmeticCard({
  name,
  description,
  price,
  owned,
  equipped,
  affordable,
  preview,
  onBuy,
  onEquip,
}: CosmeticCardProps) {
  return (
    <div className="pp-store-card pp-card flex flex-col gap-4 p-5">
      <div className="flex items-center justify-center">{preview}</div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-primary">{name}</h3>
          {equipped ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-contrast">
              <CheckIcon size={13} />
              Equipped
            </span>
          ) : owned ? (
            <span className="shrink-0 rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-secondary">
              Owned
            </span>
          ) : (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-primary">
              <TokenIcon size={13} className="text-accent" />
              {price.toLocaleString()}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-secondary">{description}</p>
      </div>

      <div className="mt-auto">
        {equipped ? (
          <button
            type="button"
            disabled
            className="pp-btn-secondary w-full"
            aria-label={`${name} is equipped`}
          >
            <CheckIcon size={16} />
            Equipped
          </button>
        ) : owned ? (
          <button
            type="button"
            onClick={onEquip}
            className="pp-btn-primary w-full"
          >
            Equip
          </button>
        ) : (
          <div>
            <button
              type="button"
              onClick={onBuy}
              disabled={!affordable}
              className="pp-btn-primary w-full"
            >
              <TokenIcon size={16} />
              Buy · {price.toLocaleString()}
            </button>
            {!affordable && (
              <p className="mt-1.5 text-center text-xs text-muted">
                Not enough tokens
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
