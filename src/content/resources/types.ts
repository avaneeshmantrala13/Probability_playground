export type ResourceCategory =
  | "official-firm"
  | "quant-probability"
  | "market-making"
  | "poker-theory"
  | "books"
  | "practice"
  | "courses"
  | "meta-guides";

export type ResourceTrack = "quant" | "market-making" | "poker-theory" | "general";

export type ResourceKind = "official" | "free" | "book" | "course" | "practice" | "article";

export interface ResourceItem {
  id: string;
  title: string;
  /** Original one-liner — not copied from source sites. */
  summary: string;
  /** Why we recommend it for quant prep. */
  why: string;
  url: string;
  category: ResourceCategory;
  tracks: ResourceTrack[];
  kind: ResourceKind;
  /** Match against lesson `topics` for in-lesson panels. */
  tags: string[];
  /** Optional author or publisher for books. */
  author?: string;
  featured?: boolean;
}

export interface StudyPathStep {
  label: string;
  resourceIds: string[];
}

export interface StudyPath {
  id: string;
  track: ResourceTrack;
  title: string;
  description: string;
  steps: StudyPathStep[];
}

export const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  "official-firm": "Official firm prep",
  "quant-probability": "Probability & quant math",
  "market-making": "Market making",
  "poker-theory": "Poker theory",
  books: "Books to buy",
  practice: "Practice platforms",
  courses: "Free courses",
  "meta-guides": "Curated reading lists",
};

export const CATEGORY_ORDER: ResourceCategory[] = [
  "official-firm",
  "quant-probability",
  "market-making",
  "poker-theory",
  "courses",
  "practice",
  "books",
  "meta-guides",
];

export const TRACK_LABELS: Record<ResourceTrack, string> = {
  quant: "Quant probability",
  "market-making": "Market making",
  "poker-theory": "Poker theory",
  general: "General prep",
};
