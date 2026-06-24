interface BrandProps {
  size?: number;
  withWordmark?: boolean;
}

/** Minimalist mark: a probability "scatter" inside a rounded square. */
export function Brand({ size = 32, withWordmark = false }: BrandProps) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        role="img"
        aria-label="Probability Playground logo"
      >
        <rect width="32" height="32" rx="9" className="fill-accent" />
        <circle cx="10" cy="22" r="2.4" className="fill-accent-contrast" />
        <circle cx="16" cy="15" r="2.4" className="fill-accent-contrast" opacity="0.85" />
        <circle cx="22" cy="10" r="2.4" className="fill-accent-contrast" opacity="0.6" />
        <path
          d="M8 24 L24 8"
          stroke="rgb(var(--color-accent-contrast))"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>
      {withWordmark && (
        <span className="text-lg font-extrabold tracking-tight text-primary">
          Probability Playground
        </span>
      )}
    </span>
  );
}
