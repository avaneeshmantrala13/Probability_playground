interface HostProps {
  message: string;
  /** Bumping this key replays the bubble entrance animation. */
  messageKey: string | number;
  reduced: boolean;
}

/**
 * Cartoon game-show host: an inline-SVG character with an idle bob and a
 * theme-aware speech bubble. The bubble text is real HTML for crisp rendering.
 */
export function Host({ message, messageKey, reduced }: HostProps) {
  return (
    <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-end sm:gap-3">
      <div
        className="relative w-20 flex-shrink-0 sm:w-24"
        aria-hidden="true"
      >
        <svg viewBox="0 0 120 150" className="h-auto w-full">
          {/* shadow */}
          <ellipse cx="60" cy="144" rx="34" ry="5" fill="#000000" opacity="0.12" />
          <g className={reduced ? undefined : "mh-host-body"}>
            {/* jacket */}
            <path d="M30 148 q0 -42 30 -46 q30 4 30 46 z" fill="#33415c" />
            {/* shirt */}
            <path d="M50 104 L60 140 L70 104 q-10 -6 -20 0 z" fill="#f4f6fa" />
            {/* lapels */}
            <path d="M52 104 L60 124 L54 104 z" fill="#283449" />
            <path d="M68 104 L60 124 L66 104 z" fill="#283449" />
            {/* bowtie */}
            <path d="M60 108 l-9 -5 v10 z" fill="#7c5cff" />
            <path d="M60 108 l9 -5 v10 z" fill="#7c5cff" />
            <circle cx="60" cy="108" r="2.4" fill="#5a3fd6" />
            {/* neck */}
            <rect x="55" y="92" width="10" height="12" rx="3" fill="#e9b48f" />
            {/* head */}
            <circle cx="60" cy="74" r="22" fill="#f1c8a5" />
            {/* hair */}
            <path d="M38 70 q-2 -28 22 -30 q24 2 22 30 q-6 -14 -22 -12 q-16 -2 -22 12 z" fill="#3a2e26" />
            {/* ears */}
            <circle cx="38" cy="76" r="4" fill="#e9b48f" />
            <circle cx="82" cy="76" r="4" fill="#e9b48f" />
            {/* eyes */}
            <circle cx="52" cy="73" r="2.6" fill="#2b3038" />
            <circle cx="68" cy="73" r="2.6" fill="#2b3038" />
            {/* eyebrows */}
            <path d="M48 67 q4 -3 8 0" stroke="#3a2e26" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <path d="M64 67 q4 -3 8 0" stroke="#3a2e26" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            {/* smile */}
            <path d="M50 82 q10 9 20 0" stroke="#a85b48" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            {/* left arm resting */}
            <path d="M34 112 q-10 8 -8 22" stroke="#33415c" strokeWidth="9" fill="none" strokeLinecap="round" />
          </g>
          {/* raised presenting arm */}
          <g className={reduced ? undefined : "mh-host-arm"}>
            <path d="M86 110 q16 -6 18 -24" stroke="#33415c" strokeWidth="9" fill="none" strokeLinecap="round" />
            <circle cx="105" cy="84" r="5.5" fill="#e9b48f" />
          </g>
        </svg>
      </div>

      <div
        key={messageKey}
        className={[
          "relative max-w-[16rem] rounded-2xl border border-subtle bg-surface-raised px-3.5 py-2.5 text-sm font-medium text-primary shadow-card",
          reduced ? "" : "mh-bubble",
        ].join(" ")}
        role="status"
        aria-live="polite"
      >
        {message}
        {/* tail pointing toward the host */}
        <span className="absolute -left-1.5 bottom-3 h-3 w-3 rotate-45 border-b border-l border-subtle bg-surface-raised sm:bottom-4" />
      </div>
    </div>
  );
}
