import { useEffect } from "react";
import { redirectPreviewToCanonical } from "../lib/appUrl";

/** Redirect Vercel preview deployments to the stable production URL for auth. */
export function useCanonicalAuthUrl(): void {
  useEffect(() => {
    redirectPreviewToCanonical();
  }, []);
}
