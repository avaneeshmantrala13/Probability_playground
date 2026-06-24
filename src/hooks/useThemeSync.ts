import { useEffect, useRef } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { useTheme, type ThemePreference } from "../context/ThemeContext";

/**
 * Keeps the theme preference in sync with the user's Firestore settings doc so
 * it follows them across devices. localStorage remains the fast, pre-paint
 * source of truth; Firestore is the cross-device backup.
 */
export function useThemeSync() {
  const { user } = useAuth();
  const { preference, setPreference } = useTheme();
  const hydratedFor = useRef<string | null>(null);

  // Pull the stored preference once per signed-in user.
  useEffect(() => {
    if (!user) {
      hydratedFor.current = null;
      return;
    }
    if (hydratedFor.current === user.uid) return;

    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "settings", user.uid));
        const remote = snap.data()?.theme as ThemePreference | undefined;
        if (
          !cancelled &&
          remote &&
          (remote === "light" || remote === "dark" || remote === "system")
        ) {
          setPreference(remote);
        }
      } catch {
        // Offline or rules issue: keep the local preference.
      } finally {
        hydratedFor.current = user.uid;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, setPreference]);

  // Push changes after hydration so we never overwrite the remote value with
  // the default before we've read it.
  useEffect(() => {
    if (!user || hydratedFor.current !== user.uid) return;
    void setDoc(doc(db, "settings", user.uid), { theme: preference }, { merge: true }).catch(
      () => undefined,
    );
  }, [user, preference]);
}
