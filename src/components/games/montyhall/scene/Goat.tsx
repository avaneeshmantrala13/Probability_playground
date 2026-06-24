/** Cartoon goat shown behind a losing door. Pure inline SVG. */
export function Goat({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="A cartoon goat"
    >
      {/* legs */}
      <rect x="34" y="68" width="6" height="20" rx="3" fill="#9aa3ad" />
      <rect x="46" y="70" width="6" height="18" rx="3" fill="#828b96" />
      <rect x="58" y="68" width="6" height="20" rx="3" fill="#9aa3ad" />
      {/* hooves */}
      <rect x="33" y="85" width="8" height="5" rx="2" fill="#3f4651" />
      <rect x="45" y="83" width="8" height="5" rx="2" fill="#3f4651" />
      <rect x="57" y="85" width="8" height="5" rx="2" fill="#3f4651" />
      {/* body */}
      <ellipse cx="50" cy="58" rx="26" ry="17" fill="#e9edf2" />
      <ellipse cx="50" cy="58" rx="26" ry="17" fill="none" stroke="#c3cbd5" strokeWidth="1.5" />
      {/* tail */}
      <path d="M75 52 q9 -3 8 7 q-5 1 -8 -2 z" fill="#d7dde4" />
      {/* head */}
      <ellipse cx="30" cy="42" rx="15" ry="13" fill="#f3f6f9" />
      {/* ears */}
      <path d="M40 34 q10 -4 13 4 q-7 4 -13 0 z" fill="#d7dde4" />
      <path d="M22 33 q-9 -3 -12 5 q7 3 12 0 z" fill="#d7dde4" />
      {/* horns */}
      <path d="M26 31 q-3 -12 4 -16" fill="none" stroke="#b58a55" strokeWidth="4" strokeLinecap="round" />
      <path d="M34 31 q-1 -12 7 -15" fill="none" stroke="#b58a55" strokeWidth="4" strokeLinecap="round" />
      {/* snout */}
      <ellipse cx="19" cy="46" rx="8" ry="6.5" fill="#ffffff" />
      <circle cx="15" cy="45" r="1.4" fill="#5b626c" />
      <circle cx="20" cy="46" r="1.4" fill="#5b626c" />
      {/* eyes */}
      <circle cx="28" cy="40" r="3.4" fill="#ffffff" />
      <circle cx="28.6" cy="40.4" r="1.8" fill="#2b3038" />
      <circle cx="36" cy="40" r="3.4" fill="#ffffff" />
      <circle cx="36.6" cy="40.4" r="1.8" fill="#2b3038" />
      {/* beard */}
      <path d="M16 52 q3 9 6 1 z" fill="#d7dde4" />
    </svg>
  );
}
