import { memo, useEffect, useState } from "react";
import { PlayingCard } from "./Card";
import type { Card } from "./deck";

interface CasinoSceneProps {
  hole: Card[];
  community: Card[];
  /** Changes whenever a new hand is dealt, to retrigger the deal animation. */
  dealKey: number;
}

/** Cartoon NPC seated at the table with a swaying fan of face-down cards. */
const Npc = memo(function Npc({
  skin,
  shirt,
  bobDelay,
}: {
  skin: string;
  shirt: string;
  bobDelay: number;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="poker-sway" style={{ animationDelay: `${bobDelay}s` }}>
        <div className="flex">
          <div className="-mr-3 rotate-[-12deg]">
            <PlayingCard faceDown width={26} />
          </div>
          <div className="-ml-1 rotate-[12deg]">
            <PlayingCard faceDown width={26} />
          </div>
        </div>
      </div>
      <div
        className="poker-bob -mt-1"
        style={{ animationDelay: `${bobDelay}s` }}
        aria-hidden="true"
      >
        <svg width="52" height="52" viewBox="0 0 52 52" style={{ display: "block" }}>
          <ellipse cx="26" cy="50" rx="18" ry="9" fill={shirt} />
          <rect x="9" y="34" width="34" height="18" rx="9" fill={shirt} />
          <circle cx="26" cy="22" r="13" fill={skin} />
          <circle cx="21" cy="21" r="1.8" fill="#1f2937" />
          <circle cx="31" cy="21" r="1.8" fill="#1f2937" />
          <path
            d="M21 27 Q26 30 31 27"
            stroke="#1f2937"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
});

/** A small stack of shimmering casino chips. */
const ChipStack = memo(function ChipStack({ delay }: { delay: number }) {
  const chips = ["#e63946", "#457b9d", "#f4a261", "#2a9d8f"];
  return (
    <div
      className="poker-shimmer flex flex-col-reverse"
      style={{ animationDelay: `${delay}s` }}
      aria-hidden="true"
    >
      {chips.map((color, i) => (
        <svg
          key={i}
          width="34"
          height="12"
          viewBox="0 0 34 12"
          className="-mt-2"
          style={{ display: "block" }}
        >
          <ellipse cx="17" cy="8" rx="15" ry="4" fill="rgb(0 0 0 / 0.25)" />
          <ellipse cx="17" cy="6" rx="15" ry="4.5" fill={color} />
          <ellipse cx="17" cy="6" rx="9" ry="2.6" fill="#ffffff" opacity="0.85" />
        </svg>
      ))}
    </div>
  );
});

/** Cartoon dealer figure at the head of the table. */
const Dealer = memo(function Dealer() {
  return (
    <div className="flex flex-col items-center" aria-hidden="true">
      <svg width="58" height="56" viewBox="0 0 58 56" style={{ display: "block" }}>
        <rect x="11" y="34" width="36" height="20" rx="10" fill="#1f2937" />
        <rect x="20" y="36" width="18" height="18" fill="#f8fafc" />
        <circle cx="29" cy="20" r="14" fill="#e6b88a" />
        <rect x="16" y="9" width="26" height="6" rx="3" fill="#111827" />
        <rect x="20" y="3" width="18" height="8" rx="4" fill="#111827" />
        <circle cx="24" cy="19" r="1.9" fill="#1f2937" />
        <circle cx="34" cy="19" r="1.9" fill="#1f2937" />
        <path
          d="M24 25 Q29 28 34 25"
          stroke="#1f2937"
          strokeWidth="1.7"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      <span className="mt-0.5 rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
        Dealer
      </span>
    </div>
  );
});

/** Reports whether the viewport is narrow, to scale cards down on phones. */
function useIsCompact(): boolean {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setCompact(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return compact;
}

function CasinoSceneBase({ hole, community, dealKey }: CasinoSceneProps) {
  const compact = useIsCompact();
  const communityWidth = compact ? 46 : 60;
  const holeWidth = compact ? 60 : 78;

  return (
    <div className="poker-rail rounded-[2.5rem] p-2.5 sm:p-4">
      <div className="poker-felt relative flex min-h-[300px] flex-col items-center justify-between overflow-hidden rounded-[2rem] px-3 py-4 sm:min-h-[360px] sm:py-6">
        {/* Dealer + decorative NPC seats across the top (hidden on phones). */}
        <div className="flex w-full items-start justify-center">
          <Dealer />
        </div>

        <div className="pointer-events-none absolute inset-x-3 top-12 hidden items-start justify-between sm:flex">
          <Npc skin="#e6b88a" shirt="#2a6f97" bobDelay={0} />
          <Npc skin="#c98a5e" shirt="#9d4edd" bobDelay={0.6} />
          <Npc skin="#f0c39b" shirt="#e76f51" bobDelay={1.2} />
        </div>

        {/* Pot / community area in the middle of the felt. */}
        <div className="flex flex-col items-center gap-3">
          <ChipStack delay={0} />
          <div
            key={`community-${dealKey}`}
            className="flex min-h-[1px] items-center gap-1.5"
          >
            {community.map((card, i) => (
              <PlayingCard
                key={`${dealKey}-comm-${i}`}
                card={card}
                width={communityWidth}
                dealDelay={i * 0.12}
              />
            ))}
          </div>
        </div>

        {/* Player's seat: hole cards always visible at the bottom. */}
        <div className="flex flex-col items-center gap-1.5">
          <div
            key={`hole-${dealKey}`}
            className="flex items-end gap-2"
          >
            {hole.map((card, i) => (
              <div key={`${dealKey}-hole-${i}`} className={i === 0 ? "rotate-[-5deg]" : "rotate-[5deg]"}>
                <PlayingCard
                  card={card}
                  width={holeWidth}
                  dealDelay={community.length * 0.12 + i * 0.12}
                />
              </div>
            ))}
          </div>
          <span className="rounded-full bg-black/30 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            You
          </span>
        </div>
      </div>
    </div>
  );
}

export const CasinoScene = memo(CasinoSceneBase);
