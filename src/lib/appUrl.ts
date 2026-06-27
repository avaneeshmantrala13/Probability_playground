/** Stable production URL — preview deployment links change every deploy and break Firebase auth. */
export const CANONICAL_APP_URL =
  import.meta.env.VITE_CANONICAL_APP_URL?.trim() ||
  "https://probability-playground-flax.vercel.app";

export function canonicalAppHost(): string {
  return new URL(CANONICAL_APP_URL).hostname;
}

/** Vercel preview URLs look like project-{hash}-team.vercel.app and are not Firebase-authorized. */
export function isVercelPreviewHost(hostname = window.location.hostname): boolean {
  if (hostname === canonicalAppHost() || hostname === "localhost" || hostname === "127.0.0.1") {
    return false;
  }
  return hostname.endsWith(".vercel.app");
}

/** Send auth flows to production so Google sign-in uses an authorized domain. */
export function redirectPreviewToCanonical(): void {
  if (typeof window === "undefined" || !isVercelPreviewHost()) return;
  const target = new URL(window.location.pathname + window.location.search, CANONICAL_APP_URL);
  window.location.replace(target.toString());
}
