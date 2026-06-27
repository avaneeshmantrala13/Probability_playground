import { useState } from "react";
import { Link } from "react-router-dom";
import {
  getResourcesForLesson,
  type ResourceTrack,
} from "../../content/resources";
import { ChevronRightIcon, ExternalLinkIcon } from "../icons";

interface LessonResourcesPanelProps {
  track: ResourceTrack;
  topics: string[];
  /** Link to full resources hub filtered by track */
  hubTrack?: ResourceTrack;
}

export function LessonResourcesPanel({ track, topics, hubTrack }: LessonResourcesPanelProps) {
  const [open, setOpen] = useState(false);
  const items = getResourcesForLesson(track, topics, 4);
  if (items.length === 0) return null;

  const hub = hubTrack ?? track;

  return (
    <div className="mt-6 rounded-xl border border-border/80 bg-surface-muted/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-primary">
          Recommended external resources
        </span>
        <ChevronRightIcon
          size={16}
          className={[
            "shrink-0 text-muted transition",
            open ? "rotate-90" : "",
          ].join(" ")}
        />
      </button>

      {open && (
        <div className="border-t border-border/60 px-4 pb-4 pt-3">
          <p className="mb-3 text-xs text-muted">
            Official links only — we don&apos;t host third-party books or PDFs. Support
            authors by using publisher sites.
          </p>
          <ul className="space-y-2">
            {items.map((r) => (
              <li key={r.id}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-2 rounded-lg px-2 py-2 transition hover:bg-surface-muted"
                >
                  <ExternalLinkIcon
                    size={14}
                    className="mt-0.5 shrink-0 text-muted group-hover:text-accent"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-primary group-hover:text-accent">
                      {r.title}
                    </span>
                    <span className="block text-xs text-secondary line-clamp-2">
                      {r.summary}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <Link
            to={`/resources?track=${hub}`}
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
          >
            Browse all {hub.replace("-", " ")} resources
            <ChevronRightIcon size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
