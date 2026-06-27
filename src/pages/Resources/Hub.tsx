import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  getFeaturedResources,
  getResourcesByTrack,
  RESOURCES,
  resourcesGroupedByCategory,
  searchResources,
  STUDY_PATHS,
  TRACK_LABELS,
  type ResourceCategory,
  type ResourceTrack,
} from "../../content/resources";
import { ResourceCard } from "../../components/resources/ResourceCard";
import { ChevronRightIcon } from "../../components/icons";

const TRACKS: (ResourceTrack | "all")[] = [
  "all",
  "quant",
  "market-making",
  "poker-theory",
  "general",
];

export function ResourcesHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const trackParam = (searchParams.get("track") as ResourceTrack | null) ?? "all";
  const categoryParam = searchParams.get("category") as ResourceCategory | null;
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const filtered = useMemo(() => {
    let items = RESOURCES;
    if (trackParam !== "all") {
      items = getResourcesByTrack(trackParam);
    }
    if (categoryParam && CATEGORY_ORDER.includes(categoryParam)) {
      items = items.filter((r) => r.category === categoryParam);
    }
    if (query.trim()) {
      const ids = new Set(searchResources(query).map((r) => r.id));
      items = items.filter((r) => ids.has(r.id));
    }
    return items;
  }, [trackParam, categoryParam, query]);

  const grouped = resourcesGroupedByCategory(filtered);
  const featured = getFeaturedResources();
  const activePath = STUDY_PATHS.find((p) => p.track === trackParam);

  function setTrack(track: ResourceTrack | "all") {
    const next = new URLSearchParams(searchParams);
    if (track === "all") next.delete("track");
    else next.set("track", track);
    setSearchParams(next, { replace: true });
  }

  function setCategory(category: ResourceCategory | null) {
    const next = new URLSearchParams(searchParams);
    if (category) next.set("category", category);
    else next.delete("category");
    setSearchParams(next, { replace: true });
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
          Prep resources
        </h1>
        <p className="mt-2 max-w-2xl text-secondary">
          Curated links to the best <strong className="font-semibold text-primary">official</strong>{" "}
          quant, market-making, and poker theory materials. We link out to publishers and
          firms — we don&apos;t scrape or host copyrighted books. Use Probability Playground
          lessons for interactive practice; use these for depth and reading lists.
        </p>
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-secondary">
          <span className="font-semibold text-primary">Support authors:</span> buy books from
          official publishers. For Stat 110, use{" "}
          <a
            href="https://probabilitybook.net/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:underline"
          >
            probabilitybook.net
          </a>{" "}
          (free authorized edition) instead of leaked PDFs.
        </div>
      </header>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {TRACKS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTrack(t)}
              className={[
                "rounded-full px-3 py-1.5 text-sm font-medium transition",
                trackParam === t
                  ? "bg-accent text-white shadow-sm"
                  : "bg-surface-muted text-secondary hover:text-primary",
              ].join(" ")}
            >
              {t === "all" ? "All tracks" : TRACK_LABELS[t]}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search resources…"
          className="pp-input w-full sm:max-w-xs"
          aria-label="Search resources"
        />
      </div>

      {trackParam !== "all" && activePath && !categoryParam && !query && (
        <section className="mb-8">
          <h2 className="mb-2 text-lg font-semibold text-primary">{activePath.title}</h2>
          <p className="mb-4 max-w-2xl text-sm text-secondary">{activePath.description}</p>
          <div className="pp-card divide-y divide-border/60">
            {activePath.steps.map((step) => (
              <div key={step.label} className="p-4 sm:p-5">
                <p className="text-sm font-semibold text-primary">{step.label}</p>
                <ul className="mt-2 space-y-1">
                  {step.resourceIds.map((id) => {
                    const r = RESOURCES.find((x) => x.id === id);
                    if (!r) return null;
                    return (
                      <li key={id}>
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-accent hover:underline"
                        >
                          {r.title}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {!categoryParam && !query && trackParam === "all" && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-primary">Featured picks</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {featured.slice(0, 6).map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        </section>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory(null)}
          className={[
            "rounded-full px-2.5 py-1 text-xs font-medium",
            !categoryParam ? "bg-accent/15 text-accent" : "bg-surface-muted text-muted",
          ].join(" ")}
        >
          All categories
        </button>
        {CATEGORY_ORDER.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(categoryParam === cat ? null : cat)}
            className={[
              "rounded-full px-2.5 py-1 text-xs font-medium transition",
              categoryParam === cat
                ? "bg-accent/15 text-accent"
                : "bg-surface-muted text-muted hover:text-secondary",
            ].join(" ")}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {grouped.map(({ category, items }) => (
        <section key={category} className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-primary">
            {CATEGORY_LABELS[category]}
            <span className="ml-2 text-sm font-normal text-muted">({items.length})</span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        </section>
      ))}

      {filtered.length === 0 && (
        <div className="pp-card p-8 text-center text-secondary">
          No resources match your filters.{" "}
          <button
            type="button"
            className="font-medium text-accent hover:underline"
            onClick={() => {
              setQuery("");
              setCategory(null);
              setTrack("all");
            }}
          >
            Clear filters
          </button>
        </div>
      )}

      <section className="mt-10 rounded-xl border border-border/80 bg-surface-muted/30 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-primary">How this hub works</h2>
        <ul className="mt-3 space-y-2 text-sm text-secondary">
          <li>
            <strong className="text-primary">Official firm pages</strong> — Jane Street,
            Citadel, SIG, etc. Always start here for interview format truth.
          </li>
          <li>
            <strong className="text-primary">Free courses</strong> — Stat 110, edX, MIT OCW.
            Legitimate free textbooks linked from author sites.
          </li>
          <li>
            <strong className="text-primary">Books</strong> — purchase links only; we never
            host pirated scans.
          </li>
          <li>
            <strong className="text-primary">Meta-guides</strong> — third-party reading lists;
            cross-check against official sources.
          </li>
        </ul>
        <Link
          to="/lessons"
          className="pp-btn-secondary mt-5 inline-flex items-center gap-1 text-sm"
        >
          Back to interactive lessons
          <ChevronRightIcon size={14} />
        </Link>
      </section>
    </div>
  );
}
