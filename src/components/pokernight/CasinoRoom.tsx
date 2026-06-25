import { memo } from "react";

/**
 * The casino around the table — a static, decorative backdrop that sits BEHIND
 * the 3D table stage and the first-person foreground. It builds depth in layers:
 * a warm panelled back wall, a glowing row of slot machines, other gaming tables
 * with patron silhouettes, a hanging chandelier, a cocktail server drifting
 * through with a tray, and a perspective carpet.
 *
 * Everything is pure CSS/SVG (no images, no network). All ambient motion lives
 * in CSS as cheap transform/opacity loops and is fully suppressed under
 * prefers-reduced-motion. Memoized with no props so it never re-renders while
 * the hand plays out.
 */
function CasinoRoomImpl() {
  return (
    <div className="pn-room" aria-hidden>
      <div className="pn-wall" />
      <div className="pn-ambient" />

      {/* glowing row of slot machines along the back wall */}
      <div className="pn-slots">
        {SLOTS.map((s, i) => (
          <span
            key={i}
            className="pn-slot"
            style={{
              ["--pn-slot-hue" as string]: String(s.hue),
              ["--pn-slot-delay" as string]: `${s.delay}s`,
            }}
          >
            <span className="pn-slot-marquee" />
            <span className="pn-slot-screen" />
            <span className="pn-slot-base" />
          </span>
        ))}
      </div>

      {/* the casino floor: several distinct gaming areas (roulette / blackjack /
          poker ovals) at varying DEPTHS, each ringed with patron silhouettes,
          plus standing patrons. Each area is positioned + scaled + blurred via
          inline custom props so further areas read smaller and hazier (aerial
          perspective). All cheap CSS; ambient sway is suppressed under reduced
          motion. They live above the main felt's visual top so they never collide
          with the foreground table. */}
      <div className="pn-floor">
        {GAMING_AREAS.map((g, i) => (
          <span
            key={i}
            className={`pn-gtable pn-gtable-${g.kind}`}
            style={{
              left: `${g.x}%`,
              top: `${g.y}%`,
              ["--pn-g-scale" as string]: String(g.s),
              ["--pn-g-blur" as string]: `${g.blur}px`,
              ["--pn-g-dim" as string]: String(g.dim),
              ["--pn-g-delay" as string]: `${g.delay}s`,
            }}
          >
            <span className="pn-gtable-felt" />
            {Array.from({ length: g.seats }).map((_, k) => (
              <i
                key={k}
                className="pn-gpatron"
                style={{ ["--pn-a" as string]: `${(360 / g.seats) * k + g.rot}deg`, ["--pn-pd" as string]: `${(k % 3) * 0.7}s` }}
              />
            ))}
          </span>
        ))}

        {/* standing patrons milling between the gaming areas */}
        {STANDERS.map((s, i) => (
          <i
            key={i}
            className="pn-bg-stander"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              ["--pn-g-scale" as string]: String(s.s),
              ["--pn-g-blur" as string]: `${s.blur}px`,
              ["--pn-g-delay" as string]: `${s.delay}s`,
            }}
          />
        ))}

        <span className="pn-bg-lamp pn-bg-lamp-1" />
        <span className="pn-bg-lamp pn-bg-lamp-2" />
        <span className="pn-bg-lamp pn-bg-lamp-3" />
      </div>

      <div className="pn-chandelier" />

      {/* a cocktail server crossing the floor with a tray of drinks */}
      <div className="pn-server">
        <svg viewBox="0 0 70 130" className="pn-server-svg" role="img" aria-label="Cocktail server">
          {/* back leg / skirt */}
          <path d="M30 70 C24 92 22 110 26 128 L40 128 C40 110 41 92 40 72 Z" fill="#2a1822" />
          <path d="M30 70 C36 78 40 90 40 104 L33 104 C31 92 30 80 30 72 Z" fill="#3c2230" opacity="0.8" />
          {/* torso (vest) */}
          <path d="M28 44 C22 50 22 64 30 70 C38 72 42 64 42 52 C42 47 39 44 35 43 Z" fill="#7a1d2b" />
          <path d="M31 45 L34 67" stroke="#fbcfe8" strokeWidth="1" opacity="0.5" />
          {/* serving arm holding a tray out front */}
          <path d="M40 50 Q54 50 60 56" fill="none" stroke="#7a1d2b" strokeWidth="5" strokeLinecap="round" />
          <ellipse cx="60" cy="57" rx="3" ry="2.4" fill="#e8b98f" />
          {/* tray + drinks */}
          <ellipse cx="60" cy="54" rx="11" ry="3" fill="#caa45a" />
          <ellipse cx="60" cy="53.4" rx="11" ry="2.4" fill="#e3c884" />
          <rect x="54" y="45" width="4" height="8" rx="1.2" fill="#bfe7ff" opacity="0.9" />
          <rect x="60" y="44" width="4" height="9" rx="1.2" fill="#ffd27d" opacity="0.95" />
          <rect x="65" y="46" width="3.5" height="7" rx="1.2" fill="#ffb3c7" opacity="0.9" />
          {/* head + hair */}
          <circle cx="33" cy="34" r="9" fill="#e8b98f" />
          <path d="M24 33 C24 22 42 22 42 33 C42 28 38 25 33 25 C28 25 24 28 24 33 Z" fill="#241019" />
          <path d="M24 33 C23 44 27 50 27 50 L24 40 Z" fill="#241019" />
          {/* rim light so she reads against the dim room */}
          <path d="M27 27 C24 31 24 38 27 44" fill="none" stroke="#ffd9a8" strokeWidth="1.2" opacity="0.5" />
        </svg>
      </div>

      {/* out-of-focus light orbs + warm depth haze over the far room */}
      <div className="pn-bokeh" />
      <div className="pn-haze" />

      <div className="pn-carpet" />
      <div className="pn-vignette" />
    </div>
  );
}

const SLOTS = [
  { hue: 32, delay: 0 },
  { hue: 200, delay: 0.6 },
  { hue: 320, delay: 1.1 },
  { hue: 50, delay: 0.3 },
  { hue: 160, delay: 0.9 },
  { hue: 275, delay: 1.4 },
  { hue: 12, delay: 0.45 },
  { hue: 210, delay: 1.2 },
];

type Kind = "roulette" | "blackjack" | "poker";

/** Gaming areas placed across the floor at varying depth. Higher on screen (lower
 *  y) + smaller scale + more blur = further away. Kept in the upper band so they
 *  sit clearly behind/around the foreground felt, never poking through it. */
const GAMING_AREAS: {
  kind: Kind;
  x: number;
  y: number;
  s: number;
  blur: number;
  dim: number;
  seats: number;
  rot: number;
  delay: number;
}[] = [
  // far row (smallest, haziest)
  { kind: "roulette", x: 30, y: 13, s: 0.6, blur: 3.4, dim: 0.5, seats: 6, rot: 10, delay: 0 },
  { kind: "blackjack", x: 70, y: 12, s: 0.58, blur: 3.6, dim: 0.5, seats: 5, rot: 30, delay: 0.8 },
  { kind: "poker", x: 50, y: 16, s: 0.66, blur: 3, dim: 0.46, seats: 6, rot: 0, delay: 1.4 },
  // mid row (a touch larger / clearer)
  { kind: "blackjack", x: 13, y: 27, s: 0.92, blur: 2, dim: 0.34, seats: 5, rot: 20, delay: 0.4 },
  { kind: "roulette", x: 87, y: 26, s: 0.88, blur: 2.1, dim: 0.36, seats: 6, rot: -10, delay: 1.1 },
];

/** Standing/milling patron silhouettes for a populated room. */
const STANDERS: { x: number; y: number; s: number; blur: number; delay: number }[] = [
  { x: 41, y: 23, s: 0.7, blur: 2.4, delay: 0 },
  { x: 60, y: 24, s: 0.78, blur: 2.2, delay: 1.2 },
  { x: 23, y: 18, s: 0.55, blur: 3, delay: 0.6 },
  { x: 78, y: 19, s: 0.58, blur: 3, delay: 1.8 },
  { x: 50, y: 30, s: 1, blur: 1.6, delay: 0.9 },
];

export const CasinoRoom = memo(CasinoRoomImpl);
export default CasinoRoom;
