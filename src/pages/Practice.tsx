import { Link } from "react-router-dom";
import {
  PRACTICE_BANKS,
  TOTAL_PRACTICE_QUESTIONS,
  type PracticeTrack,
} from "../content/practice";

const TRACK_META: Record<PracticeTrack, { label: string; accent: string }> = {
  quant: { label: "Quant & Probability", accent: "text-sky-500" },
  "poker-theory": { label: "Poker Theory", accent: "text-red-500" },
  "market-making": { label: "Market Making", accent: "text-emerald-500" },
};

const TRACK_ORDER: PracticeTrack[] = ["quant", "poker-theory", "market-making"];

export function Practice() {
  const banksByTrack = TRACK_ORDER.map((track) => ({
    track,
    banks: PRACTICE_BANKS.filter((b) => b.track === track).sort((a, b) =>
      a.lessonId.localeCompare(b.lessonId, undefined, { numeric: true }),
    ),
  })).filter((g) => g.banks.length > 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-primary sm:text-3xl">Practice</h1>
        <p className="mt-2 text-secondary">
          Endless, ungated drills — {TOTAL_PRACTICE_QUESTIONS.toLocaleString()} authored
          questions across every track, each with full explanations and an AI tutor.
          Nothing here affects lesson mastery; just reps.
        </p>
      </header>

      {banksByTrack.map(({ track, banks }) => (
        <section key={track} className="mb-8">
          <h2 className={`mb-3 text-sm font-semibold uppercase tracking-wide ${TRACK_META[track].accent}`}>
            {TRACK_META[track].label}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {banks.map((bank) => (
              <Link
                key={bank.lessonId}
                to={`/practice/${bank.lessonId}`}
                className="pp-card flex items-center justify-between gap-3 p-4 transition hover:ring-1 hover:ring-accent/40"
              >
                <span className="font-semibold text-primary">{bank.title}</span>
                <span className="shrink-0 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium tabular-nums text-secondary">
                  {bank.questions.length} Qs
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
