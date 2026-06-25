import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

/**
 * Shared base props for the casino/token badge icons. Kept local to the badges
 * folder on purpose — these unique icons must NOT pollute the global icon set.
 */
function base({ size = 20, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  };
}

/** Poker chip — "In the Black" (2k). */
export const ChipIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
  </svg>
);

/** Stack of coins — "High Roller" (5k). */
export const CoinStackIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <ellipse cx="12" cy="6" rx="7" ry="3" />
    <path d="M5 6v4c0 1.66 3.13 3 7 3s7-1.34 7-3V6" />
    <path d="M5 10v4c0 1.66 3.13 3 7 3s7-1.34 7-3v-4" />
    <path d="M5 14v4c0 1.66 3.13 3 7 3s7-1.34 7-3v-4" />
  </svg>
);

/** Brilliant-cut diamond — "Card Shark" (10k). */
export const DiamondIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 3h12l3 6-9 12L3 9z" />
    <path d="M3 9h18M9 3 6 9l6 12M15 3l3 6-6 12" />
  </svg>
);

/** Faceted gem — "Whale" (25k). */
export const GemIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 4h14l3 5-10 11L2 9z" />
    <path d="M2 9h20M8 4 6 9l6 11 6-11-2-5M9 9l3-5 3 5" />
  </svg>
);

/** Bank vault / safe — "Table Captain" (50k). */
export const VaultIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="12" cy="12" r="4" />
    <path d="M12 9v3l2 1.2" />
    <path d="M7 20v1.5M17 20v1.5" />
  </svg>
);

/** Jackpot 7-7-7 starburst — "Casino Legend" (100k). */
export const JackpotIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 2.5 14 8l5.5-.6L15.8 11.8 18 17l-6-3-6 3 2.2-5.2L4.5 7.4 10 8z" />
    <path d="M12 12.5h.01" />
  </svg>
);

/** Ace card flag — "First Pot" (first hand won). */
export const AceCardIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M12 7.5 14.5 14h-5z" />
    <path d="M10.4 12.2h3.2" />
    <path d="M8 6.2h.01M16 17.8h.01" />
  </svg>
);

/** Phoenix rising — "Comeback Kid" (recovered from going bust). */
export const PhoenixIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 21V9" />
    <path d="M12 9c-1.5-2.2-4.5-3-7.5-2.5 1 3 3.4 4.6 6 4.8" />
    <path d="M12 9c1.5-2.2 4.5-3 7.5-2.5-1 3-3.4 4.6-6 4.8" />
    <path d="M9 14c-1.6.3-3 1.4-3.6 3 1.8.2 3.4-.3 4.4-1.4M15 14c1.6.3 3 1.4 3.6 3-1.8.2-3.4-.3-4.4-1.4" />
    <path d="M12 9 9.8 4.5 12 5.6l2.2-1.1z" />
  </svg>
);
