import { RESOURCES, STUDY_PATHS } from "./catalog";
import type { ResourceCategory, ResourceItem, ResourceTrack } from "./types";
import { CATEGORY_ORDER } from "./types";

export * from "./types";
export { RESOURCES, STUDY_PATHS };

export function getResource(id: string): ResourceItem | undefined {
  return RESOURCES.find((r) => r.id === id);
}

export function getResourcesByCategory(category: ResourceCategory): ResourceItem[] {
  return RESOURCES.filter((r) => r.category === category);
}

export function getResourcesByTrack(track: ResourceTrack): ResourceItem[] {
  return RESOURCES.filter((r) => r.tracks.includes(track));
}

export function getFeaturedResources(): ResourceItem[] {
  return RESOURCES.filter((r) => r.featured);
}

/** Match resources to lesson topics via tag overlap (case-insensitive). */
export function getResourcesForLesson(
  track: ResourceTrack,
  topics: string[],
  limit = 5,
): ResourceItem[] {
  const normalized = topics.map((t) => t.toLowerCase());
  const scored = RESOURCES.map((r) => {
    if (!r.tracks.includes(track) && !r.tracks.includes("general")) return { r, score: 0 };
    let score = r.featured ? 2 : 0;
    for (const tag of r.tags) {
      const tl = tag.toLowerCase();
      if (normalized.some((t) => t.includes(tl) || tl.includes(t))) score += 3;
    }
    return { r, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const out: ResourceItem[] = [];
  for (const { r } of scored) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    out.push(r);
    if (out.length >= limit) break;
  }
  return out;
}

export function searchResources(query: string): ResourceItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return RESOURCES;
  return RESOURCES.filter(
    (r) =>
      r.title.toLowerCase().includes(q) ||
      r.summary.toLowerCase().includes(q) ||
      r.why.toLowerCase().includes(q) ||
      r.tags.some((t) => t.toLowerCase().includes(q)) ||
      (r.author?.toLowerCase().includes(q) ?? false),
  );
}

export function resourcesGroupedByCategory(
  items: ResourceItem[] = RESOURCES,
): { category: ResourceCategory; items: ResourceItem[] }[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    items: items.filter((r) => r.category === category),
  })).filter((g) => g.items.length > 0);
}
