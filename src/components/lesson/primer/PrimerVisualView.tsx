import type { PrimerVisual } from "../../../content/types";
import { RichText } from "./RichText";

/** Renders a declarative primer visual (formula, callout, bars, steps, table). */
export function PrimerVisualView({ visual }: { visual: PrimerVisual }) {
  switch (visual.kind) {
    case "formula":
      return (
        <figure className="rounded-xl border border-subtle bg-surface-muted/50 p-4 text-center">
          <div className="font-serif text-lg italic text-primary sm:text-xl">
            <RichText text={visual.expression} />
          </div>
          {visual.caption && (
            <figcaption className="mt-2 text-xs text-secondary">
              <RichText text={visual.caption} />
            </figcaption>
          )}
        </figure>
      );

    case "callout": {
      const tone = visual.tone ?? "info";
      const toneClass =
        tone === "warning"
          ? "border-danger/30 bg-danger-soft/50"
          : tone === "success"
            ? "border-success/30 bg-success-soft/60"
            : "border-accent/30 bg-accent/10";
      return (
        <div className={`rounded-xl border p-4 ${toneClass}`}>
          {visual.title && (
            <p className="mb-1 text-sm font-semibold text-primary">{visual.title}</p>
          )}
          <p className="text-sm leading-relaxed text-secondary">
            <RichText text={visual.text} />
          </p>
        </div>
      );
    }

    case "bars": {
      const max = Math.max(...visual.items.map((i) => Math.abs(i.value)), 1);
      return (
        <figure className="rounded-xl border border-subtle bg-surface-muted/40 p-4">
          <div className="space-y-2.5">
            {visual.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-right text-xs font-medium text-secondary">
                  {item.label}
                </span>
                <div className="h-5 flex-1 overflow-hidden rounded-md bg-surface">
                  <div
                    className="h-full rounded-md bg-accent/70"
                    style={{ width: `${(Math.abs(item.value) / max) * 100}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-xs tabular-nums text-secondary">
                  {item.note ?? item.value}
                </span>
              </div>
            ))}
          </div>
          {visual.caption && (
            <figcaption className="mt-3 text-xs text-secondary">
              <RichText text={visual.caption} />
            </figcaption>
          )}
        </figure>
      );
    }

    case "steps":
      return (
        <figure className="rounded-xl border border-subtle bg-surface-muted/40 p-4">
          <ol className="space-y-2">
            {visual.items.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-secondary">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent">
                  {i + 1}
                </span>
                <span className="leading-relaxed">
                  <RichText text={step} />
                </span>
              </li>
            ))}
          </ol>
          {visual.caption && (
            <figcaption className="mt-3 text-xs text-secondary">
              <RichText text={visual.caption} />
            </figcaption>
          )}
        </figure>
      );

    case "table":
      return (
        <figure className="overflow-x-auto rounded-xl border border-subtle">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-surface-muted/60">
                {visual.headers.map((h, i) => (
                  <th
                    key={i}
                    className="border-b border-subtle px-3 py-2 text-left font-semibold text-primary"
                  >
                    <RichText text={h} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visual.rows.map((row, r) => (
                <tr key={r} className="even:bg-surface-muted/30">
                  {row.map((cell, c) => (
                    <td key={c} className="border-b border-subtle px-3 py-2 text-secondary">
                      <RichText text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {visual.caption && (
            <figcaption className="px-3 py-2 text-xs text-secondary">
              <RichText text={visual.caption} />
            </figcaption>
          )}
        </figure>
      );

    default:
      return null;
  }
}
