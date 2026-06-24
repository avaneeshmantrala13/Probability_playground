import { useEffect, useState } from "react";
import { useTheme } from "../../context/ThemeContext";

export interface ChartColors {
  series: string[];
  grid: string;
  axis: string;
  accent: string;
  success: string;
  danger: string;
}

function readVar(name: string): string {
  if (typeof window === "undefined") return "rgb(79 70 229)";
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  // CSS vars hold space-separated RGB channels, e.g. "79 70 229".
  return raw ? `rgb(${raw})` : "rgb(79 70 229)";
}

/**
 * Reads the theme's chart palette from CSS variables and recomputes whenever the
 * resolved theme changes, so Recharts (which needs concrete color strings)
 * stays in sync with light/dark mode.
 */
export function useChartColors(): ChartColors {
  const { resolved } = useTheme();
  const [colors, setColors] = useState<ChartColors>(() => computeColors());

  useEffect(() => {
    // Defer to the next frame so the `dark` class is applied before reading.
    const id = requestAnimationFrame(() => setColors(computeColors()));
    return () => cancelAnimationFrame(id);
  }, [resolved]);

  return colors;
}

function computeColors(): ChartColors {
  return {
    series: [
      readVar("--chart-1"),
      readVar("--chart-2"),
      readVar("--chart-3"),
      readVar("--chart-4"),
    ],
    grid: readVar("--chart-grid"),
    axis: readVar("--chart-axis"),
    accent: readVar("--color-accent"),
    success: readVar("--color-success"),
    danger: readVar("--color-danger"),
  };
}
