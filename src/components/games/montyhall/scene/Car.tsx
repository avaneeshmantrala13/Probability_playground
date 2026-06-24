/** Cartoon prize car shown behind the winning door. Pure inline SVG. */
export function Car({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="A shiny prize car"
    >
      {/* ground shadow */}
      <ellipse cx="50" cy="82" rx="38" ry="6" fill="#000000" opacity="0.12" />
      {/* lower body */}
      <path
        d="M12 64 q2 -10 12 -11 l10 -8 q4 -3 9 -3 h16 q6 0 11 5 l8 7 q9 1 11 10 l0 6 q0 4 -4 4 H16 q-4 0 -4 -4 z"
        fill="#e23b4e"
      />
      {/* cabin / roof */}
      <path
        d="M34 45 q4 -3 9 -3 h13 q5 0 9 4 l5 6 H30 z"
        fill="#f15566"
      />
      {/* windows */}
      <path d="M37 46 h8 v7 H32 z" fill="#bfe6f5" />
      <path d="M48 46 h8 l5 7 H48 z" fill="#bfe6f5" />
      {/* window frame highlight */}
      <path d="M46 45 v9" stroke="#e23b4e" strokeWidth="2" />
      {/* body shine */}
      <path d="M16 60 q34 -8 66 0" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.5" strokeLinecap="round" />
      {/* headlight */}
      <circle cx="84" cy="62" r="2.6" fill="#fff4c2" />
      {/* wheels */}
      <circle cx="32" cy="70" r="9" fill="#2b3038" />
      <circle cx="32" cy="70" r="4" fill="#c3cbd5" />
      <circle cx="70" cy="70" r="9" fill="#2b3038" />
      <circle cx="70" cy="70" r="4" fill="#c3cbd5" />
    </svg>
  );
}
