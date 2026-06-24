/** Tiny inline-SVG glyphs for non-color state cues. Own icons (no shared set). */

interface GlyphProps {
  className?: string;
}

export function CheckMark({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" aria-hidden="true">
      <path
        d="M3 8.5l3 3 7-7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CrossMark({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" aria-hidden="true">
      <path
        d="M4 4l8 8M12 4l-8 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PointerGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden="true">
      <path d="M3 2l8 5-3.2 1L9 12l-1.6.8-1.4-3L3 12z" />
    </svg>
  );
}

export function GoatGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden="true">
      <path d="M5 3c-1 0-1.5 1-1.5 1l1 1.2A4 4 0 002 9c0 2.2 2 4 5 4s5-1.8 5-4a4 4 0 00-1.5-3.1l1-1.2S11 3 10 3c-.6 0-1 .5-1.3 1A4.7 4.7 0 008 4c-.3 0-.5 0-.7.05C7 3.5 6.6 3 5 3zm1.5 6a.8.8 0 11.001 1.6A.8.8 0 016.5 9zm3 0a.8.8 0 11.001 1.6A.8.8 0 019.5 9z" />
    </svg>
  );
}
