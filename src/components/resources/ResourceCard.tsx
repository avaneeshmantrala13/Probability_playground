import type { ResourceItem } from "../../content/resources";
import { ExternalLinkIcon } from "../icons";

const KIND_LABELS: Record<ResourceItem["kind"], string> = {
  official: "Official",
  free: "Free",
  book: "Book",
  course: "Course",
  practice: "Practice",
  article: "Article",
};

const KIND_STYLES: Record<ResourceItem["kind"], string> = {
  official: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  free: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  book: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
  course: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  practice: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  article: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
};

export function ResourceCard({ resource, compact = false }: { resource: ResourceItem; compact?: boolean }) {
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className={[
        "pp-card group block transition hover:border-accent/40 hover:shadow-md",
        compact ? "p-4" : "p-5",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={[
                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                KIND_STYLES[resource.kind],
              ].join(" ")}
            >
              {KIND_LABELS[resource.kind]}
            </span>
            {resource.featured && (
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                Featured
              </span>
            )}
          </div>
          <h3 className="mt-2 font-semibold text-primary group-hover:text-accent">
            {resource.title}
          </h3>
          {resource.author && (
            <p className="mt-0.5 text-xs text-muted">{resource.author}</p>
          )}
          <p className={["mt-2 text-secondary", compact ? "text-sm line-clamp-2" : "text-sm"].join(" ")}>
            {resource.summary}
          </p>
          {!compact && (
            <p className="mt-2 text-sm text-muted">
              <span className="font-medium text-secondary">Why we link it:</span> {resource.why}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {resource.tags.slice(0, compact ? 3 : 5).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <ExternalLinkIcon
          size={18}
          className="mt-1 shrink-0 text-muted transition group-hover:text-accent"
        />
      </div>
    </a>
  );
}
