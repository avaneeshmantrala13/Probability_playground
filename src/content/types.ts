/**
 * Content model for the Probability Playground curriculum.
 *
 * Lessons live as JSON in src/content/lessons and are NOT stored in Firestore.
 * Explanation fields are authored as empty strings and are only filled in by
 * the product owner (see the Explanation Policy in the PRD).
 */

export type SimulationType =
  | "coin_flip"
  | "dice"
  | "spinner"
  | "experimental_probability"
  | "two_coin"
  | "two_dice"
  | "card_marble"
  | "distribution_builder";

/**
 * Per-question simulation configuration. `type` selects the engine; any other
 * fields are optional engine-specific defaults (e.g. number of sectors).
 */
export interface SimulationConfig {
  type: SimulationType;
  [param: string]: unknown;
}

export type QuestionKind = "standard" | "challenge";

/** Explanations keyed by option letter. All empty until provided by the owner. */
export interface Explanations {
  A: string;
  B: string;
  C: string;
  D: string;
}

/** A simplified, same-concept variant served during remediation. */
export interface RemediationVariant {
  id: string;
  simulation?: SimulationConfig;
  question: string;
  options: string[];
  correctAnswer: number;
  explanations: Explanations;
}

export interface Question {
  id: string;
  kind: QuestionKind;
  /** Concept tag used to group a question with its remediation variants. */
  concept: string;
  simulation?: SimulationConfig;
  question: string;
  options: string[];
  /** Zero-based index into `options`. */
  correctAnswer: number;
  explanations: Explanations;
  /** Two authored variants used when the student must remediate. */
  remediation: RemediationVariant[];
}

/** A defined key term surfaced in a primer section. */
export interface PrimerKeyTerm {
  term: string;
  definition: string;
}

/** A fully worked example: a prompt, ordered solving steps, and a result. */
export interface PrimerExample {
  prompt: string;
  /** Ordered solving steps (the METHOD, not just the answer). */
  steps: string[];
  result?: string;
}

/**
 * A lightweight, declarative visual spec the primer renderer understands. New
 * kinds can be added without touching content already authored.
 */
export type PrimerVisual =
  | { kind: "formula"; expression: string; caption?: string }
  | {
      kind: "callout";
      tone?: "info" | "warning" | "success";
      title?: string;
      text: string;
    }
  | {
      kind: "bars";
      caption?: string;
      items: { label: string; value: number; note?: string }[];
    }
  | { kind: "steps"; caption?: string; items: string[] }
  | { kind: "table"; caption?: string; headers: string[]; rows: string[][] };

/**
 * One paced page of the pre-lesson primer. Bodies support a markdown-lite
 * syntax (**bold**, `code`) and inline math via \( … \) or $ … $.
 */
export interface PrimerSection {
  heading: string;
  body: string[];
  keyTerms?: PrimerKeyTerm[];
  example?: PrimerExample;
  visual?: PrimerVisual;
}

/** One auto-advancing slide of the narrated concept primer (Web Speech). */
export interface NarrationSlide {
  title: string;
  /** Text that is both spoken (Web Speech) and rendered on-screen as captions. */
  caption: string;
  /** Optional headline term being introduced on this slide. */
  term?: string;
  bullets?: string[];
  visual?: PrimerVisual;
}

export interface Lesson {
  lessonId: string;
  /** 1-based position in the course. */
  order: number;
  title: string;
  subtitle?: string;
  topics: string[];
  /** Preparatory overview paragraphs shown before the first question. */
  intro?: string[];
  /**
   * Rich, paced, multi-page pre-lesson primer. Preferred over `intro` when
   * present; `intro` remains the fallback for lessons not yet upgraded.
   */
  primer?: PrimerSection[];
  /** Narrated concept-primer slideshow script (in-app "AI video"). */
  primerNarration?: NarrationSlide[];
  questions: Question[];
  /**
   * Optional fast-track quiz (typically 8 questions). Score ≥80% marks the lesson
   * passed without working through all primary questions.
   */
  placementQuestions?: Omit<Question, "remediation" | "kind">[];
}

/** A question-like object that can be rendered (primary or remediation). */
export interface RenderableQuestion {
  id: string;
  simulation?: SimulationConfig;
  question: string;
  options: string[];
  correctAnswer: number;
  explanations: Explanations;
}

export const OPTION_LETTERS = ["A", "B", "C", "D"] as const;
