import type { Scenario } from "../../../lib/marketMaking";

interface ScenarioPanelProps {
  scenario: Scenario;
  showFair?: boolean;
}

export function ScenarioPanel({ scenario, showFair = false }: ScenarioPanelProps) {
  return (
    <div className="mm-scenario">
      <h2>{scenario.title}</h2>
      <p className="mt-1 text-sm text-secondary">{scenario.description}</p>
      <ul className="mm-clues">
        {scenario.clues.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <ScenarioVisual scenario={scenario} />
      {showFair && (
        <p className="mt-3 text-sm font-semibold text-accent">
          Fair value: {scenario.fairValue.toFixed(2)}
        </p>
      )}
    </div>
  );
}

function ScenarioVisual({ scenario }: { scenario: Scenario }) {
  const { kind, params } = scenario;

  if (kind === "single_die" || kind === "two_dice") {
    const count = kind === "two_dice" ? 2 : 1;
    return (
      <div className="mm-visual" aria-hidden>
        {Array.from({ length: count }, (_, i) => (
          <span key={i} className="mm-chip">
            🎲
          </span>
        ))}
      </div>
    );
  }

  if (kind === "die_plus_fixed") {
    const fixed = params.fixed as number;
    return (
      <div className="mm-visual" aria-hidden>
        <span className="mm-chip">{fixed}</span>
        <span className="text-muted">+</span>
        <span className="mm-chip">🎲</span>
      </div>
    );
  }

  if (kind === "coin_flips") {
    const n = params.count as number;
    return (
      <div className="mm-visual" aria-hidden>
        {Array.from({ length: n }, (_, i) => (
          <span key={i} className="mm-chip">
            🪙
          </span>
        ))}
      </div>
    );
  }

  if (kind === "card_draw" || kind === "cards_with_reveal") {
    const revealed = (params.revealed as string[]) ?? [];
    return (
      <div className="mm-visual" aria-hidden>
        {revealed.map((c) => (
          <span key={c} className="mm-chip">
            {c}
          </span>
        ))}
        {(params.drawCount as number) > 1 && (
          <span className="text-xs text-muted">+{(params.drawCount as number) - revealed.length} hidden</span>
        )}
      </div>
    );
  }

  return null;
}
