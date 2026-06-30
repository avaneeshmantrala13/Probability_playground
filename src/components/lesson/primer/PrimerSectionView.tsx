import type { PrimerSection } from "../../../content/types";
import { RichText } from "./RichText";
import { PrimerVisualView } from "./PrimerVisualView";

/** Renders a single primer section: heading, body, key terms, example, visual. */
export function PrimerSectionView({ section }: { section: PrimerSection }) {
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-primary sm:text-2xl">{section.heading}</h2>

      <div className="space-y-3 leading-relaxed text-secondary">
        {section.body.map((p, i) => (
          <p key={i}>
            <RichText text={p} />
          </p>
        ))}
      </div>

      {section.visual && <PrimerVisualView visual={section.visual} />}

      {section.keyTerms && section.keyTerms.length > 0 && (
        <dl className="grid gap-3 rounded-xl border border-subtle bg-surface-muted/40 p-4 sm:grid-cols-2">
          {section.keyTerms.map((kt, i) => (
            <div key={i}>
              <dt className="text-sm font-semibold text-primary">{kt.term}</dt>
              <dd className="mt-0.5 text-sm leading-relaxed text-secondary">
                <RichText text={kt.definition} />
              </dd>
            </div>
          ))}
        </dl>
      )}

      {section.example && (
        <div className="rounded-xl border border-accent/30 bg-accent/[0.06] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            Worked example
          </p>
          <p className="mt-1.5 font-medium text-primary">
            <RichText text={section.example.prompt} />
          </p>
          <ol className="mt-3 space-y-1.5">
            {section.example.steps.map((step, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-secondary">
                <span className="font-semibold text-accent">{i + 1}.</span>
                <span className="leading-relaxed">
                  <RichText text={step} />
                </span>
              </li>
            ))}
          </ol>
          {section.example.result && (
            <p className="mt-3 rounded-lg bg-success-soft/60 px-3 py-2 text-sm font-medium text-primary">
              <RichText text={section.example.result} />
            </p>
          )}
        </div>
      )}
    </div>
  );
}
