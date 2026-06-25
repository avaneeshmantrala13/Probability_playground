import { useEffect } from "react";
import { useProgress } from "../../context/ProgressContext";
import { getAccentTheme, type AccentVars } from "../../lib/cosmetics";

/**
 * Applies the equipped accent theme app-wide by overriding the `--color-accent*`
 * CSS custom properties (defined in index.css) through a single injected
 * <style id="pp-accent-overrides"> element.
 *
 * The app toggles dark mode via a `.dark` class on <html> (see ThemeContext),
 * so we emit BOTH a `:root { ... }` block (light) and a `.dark { ... }` block
 * (dark); the cascade then picks the right one automatically.
 *
 * Renders nothing — the parent mounts it once inside the provider tree.
 */

const STYLE_ID = "pp-accent-overrides";
const DEFAULT_ACCENT_ID = "accent-default";

/** Map an AccentVars set onto the CSS variable declarations. */
function varsToDeclarations(vars: AccentVars): string {
  return [
    `--color-accent: ${vars.accent};`,
    `--color-accent-hover: ${vars.accentHover};`,
    `--color-accent-contrast: ${vars.accentContrast};`,
    `--color-accent-2: ${vars.accent2};`,
    `--color-accent-2-hover: ${vars.accent2Hover};`,
  ].join(" ");
}

export function AccentThemeApplier() {
  const { progress } = useProgress();
  const accentId = progress.equipped?.accentTheme ?? DEFAULT_ACCENT_ID;

  // Re-run whenever the equipped accent theme changes.
  useEffect(() => {
    let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }

    // The default theme should defer to index.css — emit nothing so the
    // built-in `:root` / `.dark` definitions win unchanged.
    if (accentId === DEFAULT_ACCENT_ID) {
      style.textContent = "";
      return;
    }

    const theme = getAccentTheme(accentId);
    style.textContent =
      `:root { ${varsToDeclarations(theme.light)} } ` +
      `.dark { ${varsToDeclarations(theme.dark)} }`;
  }, [accentId]);

  // Remove the injected element when the applier unmounts (app teardown).
  useEffect(() => {
    return () => {
      document.getElementById(STYLE_ID)?.remove();
    };
  }, []);

  return null;
}

export default AccentThemeApplier;
