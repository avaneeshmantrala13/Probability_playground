/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Semantic design tokens backed by CSS variables (see index.css).
        // These adapt automatically to light/dark mode.
        bg: "rgb(var(--color-bg) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        "surface-raised": "rgb(var(--color-surface-raised) / <alpha-value>)",
        "surface-muted": "rgb(var(--color-surface-muted) / <alpha-value>)",
        subtle: "rgb(var(--color-border) / <alpha-value>)",
        primary: "rgb(var(--color-text-primary) / <alpha-value>)",
        secondary: "rgb(var(--color-text-secondary) / <alpha-value>)",
        muted: "rgb(var(--color-text-muted) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        "accent-hover": "rgb(var(--color-accent-hover) / <alpha-value>)",
        "accent-contrast": "rgb(var(--color-accent-contrast) / <alpha-value>)",
        "accent-2": "rgb(var(--color-accent-2) / <alpha-value>)",
        "accent-2-hover": "rgb(var(--color-accent-2-hover) / <alpha-value>)",
        success: "rgb(var(--color-success) / <alpha-value>)",
        "success-soft": "rgb(var(--color-success-soft) / <alpha-value>)",
        danger: "rgb(var(--color-danger) / <alpha-value>)",
        "danger-soft": "rgb(var(--color-danger-soft) / <alpha-value>)",

        // Calibration Gym palette. Namespaced under `cg-` so it never collides
        // with Playground's semantic `accent` token (the Gym's source used a
        // bare `accent` scale). Used by the Gym drill's score coloring today;
        // `cg-ink` / `cg-accent` are reserved for later Gym-specific slices.
        "cg-ink": {
          950: "#080b14",
          900: "#0b1020",
          800: "#111a30",
          700: "#1b2740",
        },
        "cg-accent": {
          DEFAULT: "#5b8cff",
          soft: "#7aa2ff",
          muted: "#2b3d6b",
        },
        "cg-signal": {
          good: "#37d9a0",
          warn: "#ffb454",
          bad: "#ff6b81",
        },
      },
      textColor: {
        primary: "rgb(var(--color-text-primary) / <alpha-value>)",
        secondary: "rgb(var(--color-text-secondary) / <alpha-value>)",
        muted: "rgb(var(--color-text-muted) / <alpha-value>)",
      },
      backgroundColor: {
        bg: "rgb(var(--color-bg) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
      },
      borderColor: {
        subtle: "rgb(var(--color-border) / <alpha-value>)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgb(0 0 0 / 0.04), 0 4px 16px rgb(0 0 0 / 0.06)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};
