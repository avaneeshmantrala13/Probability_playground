import type { SimulationConfig } from "../../content/types";
import { SIMULATION_REGISTRY } from "./registry";

/**
 * Renders the interactive simulation engine selected by `simulation.type`.
 * Engines are reusable, theme-aware, and responsive.
 */
export function SimulationView({ config }: { config: SimulationConfig }) {
  const Engine = SIMULATION_REGISTRY[config.type];

  if (!Engine) {
    return (
      <div className="rounded-2xl border border-dashed border-subtle bg-surface-muted p-6 text-center text-sm text-secondary">
        Unknown simulation: {config.type}
      </div>
    );
  }

  return <Engine config={config} />;
}
