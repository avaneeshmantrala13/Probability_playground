import type { LevelConfig } from "../../../lib/marketMaking";

interface LevelPickerProps {
  levels: LevelConfig[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function LevelPicker({ levels, selectedId, onSelect }: LevelPickerProps) {
  const standard = levels.filter((l) => l.tier === "standard");
  const firm = levels.filter((l) => l.tier === "firm");

  return (
    <div>
      <p className="mm-section-title">Standard levels</p>
      <div className="mm-level-grid">
        {standard.map((l) => (
          <LevelButton key={l.id} level={l} active={l.id === selectedId} onSelect={onSelect} />
        ))}
      </div>
      <p className="mm-section-title">Firm levels</p>
      <div className="mm-level-grid">
        {firm.map((l) => (
          <LevelButton key={l.id} level={l} active={l.id === selectedId} onSelect={onSelect} firm />
        ))}
      </div>
    </div>
  );
}

function LevelButton({
  level,
  active,
  onSelect,
  firm,
}: {
  level: LevelConfig;
  active: boolean;
  onSelect: (id: string) => void;
  firm?: boolean;
}) {
  return (
    <button
      type="button"
      className={`mm-level-btn${active ? " mm-level-btn--active" : ""}${firm ? " mm-level-btn--firm" : ""}`}
      onClick={() => onSelect(level.id)}
    >
      <span className="mm-level-name">{level.name}</span>
      <span className="mm-level-desc">{level.description}</span>
    </button>
  );
}
