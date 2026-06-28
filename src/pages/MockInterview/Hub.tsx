import { Link } from "react-router-dom";
import { COMPETENCY_LABELS, type Competency } from "../../lib/firms/profiles";
import { INTERVIEW_FIRMS } from "../../lib/mockInterview/firm";

/** Top competencies for a firm, used as quick "focus" chips on each card. */
function topFocus(weights: Record<Competency, number>, n = 3): string[] {
  return (Object.entries(weights) as [Competency, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key]) => COMPETENCY_LABELS[key]);
}

export function MockInterview() {
  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
          AI Mock Interview
        </h1>
        <p className="mt-2 max-w-2xl text-secondary">
          Sit a live, conversational quant interview tailored to a specific firm. The AI
          interviewer asks one question at a time, reacts to your answers, and pushes back with
          follow-ups — just like the real thing. At the end you get a score and a focused study plan.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-sm text-accent">
          <span aria-hidden>↻</span>
          <span>Questions change every session — no two interviews are the same.</span>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {INTERVIEW_FIRMS.map((firm) => (
          <div
            key={firm.id}
            className="pp-card flex flex-col border border-subtle bg-gradient-to-br from-accent/5 to-transparent p-5"
          >
            <h2 className="text-lg font-extrabold text-primary">{firm.name}</h2>
            <p className="mt-2 line-clamp-3 text-sm text-secondary">{firm.emphasis}</p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {topFocus(firm.weights).map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-subtle px-2.5 py-0.5 text-xs font-medium text-muted"
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="mt-5 flex-1" />

            <Link
              to={`/mock-interview/${firm.id}`}
              className="pp-btn-primary mt-2 inline-flex w-full items-center justify-center"
            >
              Start mock interview →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
