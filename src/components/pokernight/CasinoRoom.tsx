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

      {/* other gaming tables in the mid-ground, each ringed with patrons */}
      <div className="pn-bg-tables">
        <span className="pn-bg-table pn-bg-table-1">
          <i className="pn-patron pn-patron-a" />
          <i className="pn-patron pn-patron-b" />
          <i className="pn-patron pn-patron-c" />
        </span>
        <span className="pn-bg-table pn-bg-table-2">
          <i className="pn-patron pn-patron-a" />
          <i className="pn-patron pn-patron-b" />
        </span>
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

export const CasinoRoom = memo(CasinoRoomImpl);
export default CasinoRoom;
