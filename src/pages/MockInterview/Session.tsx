import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getFirmInterviewContext } from "../../lib/mockInterview/firm";
import {
  requestMockInterviewFeedback,
  sendMockInterviewTurn,
} from "../../lib/mockInterview/client";
import {
  INTERVIEW_PHASES,
  PHASE_META,
  type InterviewMessage,
  type InterviewPhase,
  type MockInterviewFeedback,
} from "../../lib/mockInterview/types";

/**
 * Phase is driven by how many answers the candidate has given so far. This
 * keeps progression deterministic on the client while the API just shapes the
 * question to the requested phase.
 */
function phaseForAnswerCount(answers: number): InterviewPhase {
  if (answers <= 0) return "intro";
  if (answers === 1) return "warmup";
  if (answers === 2) return "core";
  if (answers === 3) return "deep";
  return "wrapup";
}

/** Render an interviewer/candidate message body, preserving paragraph breaks. */
function MessageBody({ text }: { text: string }) {
  const paragraphs = text.split(/\n{2,}/).filter(Boolean);
  return (
    <>
      {paragraphs.map((p, i) => (
        <p key={i} className={i > 0 ? "mt-2" : undefined}>
          {p.split("\n").map((line, j) => (
            <span key={j}>
              {j > 0 && <br />}
              {line}
            </span>
          ))}
        </p>
      ))}
    </>
  );
}

export function MockInterviewSession() {
  const { firmId = "" } = useParams<{ firmId: string }>();
  const firm = useMemo(() => getFirmInterviewContext(firmId), [firmId]);

  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<MockInterviewFeedback | null>(null);
  const [finishing, setFinishing] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  const answerCount = messages.filter((m) => m.role === "user").length;
  const phase = phaseForAnswerCount(answerCount);
  const phaseIndex = INTERVIEW_PHASES.indexOf(phase);
  const ended = feedback !== null;

  // Auto-scroll to the latest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy, feedback]);

  // Kick off the interview with the interviewer's opening turn.
  useEffect(() => {
    if (!firm || startedRef.current) return;
    startedRef.current = true;
    void (async () => {
      setBusy(true);
      try {
        const reply = await sendMockInterviewTurn({
          firmId: firm.id,
          firm,
          phase: "intro",
          messages: [],
        });
        setMessages([{ role: "assistant", content: reply }]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Mock interview unavailable.");
      } finally {
        setBusy(false);
      }
    })();
  }, [firm]);

  if (!firm) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="pp-card border border-subtle p-6 text-center">
          <h1 className="text-xl font-extrabold text-primary">Firm not found</h1>
          <p className="mt-2 text-secondary">
            We couldn't find a mock interview for “{firmId}”.
          </p>
          <Link to="/mock-interview" className="pp-btn-primary mt-4 inline-flex">
            Back to firms
          </Link>
        </div>
      </div>
    );
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy || ended || !firm) return;
    setError(null);
    setBusy(true);
    const history: InterviewMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(history);
    setInput("");
    try {
      const nextPhase = phaseForAnswerCount(history.filter((m) => m.role === "user").length);
      const reply = await sendMockInterviewTurn({
        firmId: firm.id,
        firm,
        phase: nextPhase,
        messages: history,
      });
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mock interview unavailable.");
      // Roll back the optimistic candidate turn so they can retry.
      setMessages((m) => m.slice(0, -1));
      setInput(trimmed);
    } finally {
      setBusy(false);
    }
  }

  async function endInterview() {
    if (busy || finishing || ended || !firm) return;
    setError(null);
    setFinishing(true);
    try {
      const result = await requestMockInterviewFeedback({
        firmId: firm.id,
        firm,
        messages,
      });
      setFeedback(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate feedback.");
    } finally {
      setFinishing(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            to="/mock-interview"
            className="text-sm font-medium text-muted hover:text-primary"
          >
            ← All firms
          </Link>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-primary">
            {firm.name} — Mock Interview
          </h1>
        </div>
        {!ended && (
          <button
            type="button"
            onClick={() => void endInterview()}
            disabled={finishing || busy || messages.length === 0}
            className="rounded-xl border border-subtle px-4 py-2 text-sm font-semibold text-secondary transition hover:border-accent/40 hover:text-accent disabled:opacity-50"
          >
            {finishing ? "Scoring…" : "End & get feedback"}
          </button>
        )}
      </header>

      {/* Phase / progress indicator */}
      {!ended && (
        <div className="mb-4 flex items-center gap-2">
          {INTERVIEW_PHASES.map((p, i) => {
            const active = i === phaseIndex;
            const done = i < phaseIndex;
            return (
              <div key={p} className="flex flex-1 flex-col items-center">
                <div
                  className={[
                    "h-1.5 w-full rounded-full transition-colors",
                    done || active ? "bg-accent" : "bg-surface-muted",
                  ].join(" ")}
                />
                <span
                  className={[
                    "mt-1 text-[11px] font-semibold",
                    active ? "text-accent" : done ? "text-secondary" : "text-muted",
                  ].join(" ")}
                >
                  {PHASE_META[p].label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr]">
        {/*
          VIDEO PANEL PLACEHOLDER (future).
          When video is added, switch this grid to `lg:grid-cols-[1fr_320px]`
          and render the candidate/interviewer video feed here. Intentionally
          left out of the DOM today so the chat takes the full width.

          <aside className="pp-card hidden border border-subtle p-3 lg:block">
            <div className="aspect-video rounded-lg bg-surface-muted" />
            <p className="mt-2 text-xs text-muted">Video coming soon</p>
          </aside>
        */}

        <section className="pp-card flex h-[60vh] flex-col border border-subtle p-0">
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 && busy && (
              <p className="text-sm text-secondary">Your interviewer is joining…</p>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={[
                  "flex",
                  m.role === "user" ? "justify-end" : "justify-start",
                ].join(" ")}
              >
                <div
                  className={[
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    m.role === "user"
                      ? "bg-accent/15 text-primary"
                      : "bg-surface-muted/60 text-secondary",
                  ].join(" ")}
                >
                  {m.role === "assistant" && (
                    <p className="mb-1 text-xs font-bold uppercase tracking-wide text-accent">
                      Interviewer
                    </p>
                  )}
                  <MessageBody text={m.content} />
                </div>
              </div>
            ))}

            {busy && messages.length > 0 && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl bg-surface-muted/60 px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted [animation-delay:-0.2s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted [animation-delay:-0.1s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted" />
                </div>
              </div>
            )}

            {ended && feedback && <FeedbackCard feedback={feedback} firmName={firm.name} />}
          </div>

          {error && (
            <p className="border-t border-subtle px-4 py-2 text-xs text-danger" role="alert">
              {error}
            </p>
          )}

          {!ended && (
            <form
              className="flex gap-2 border-t border-subtle p-3"
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
            >
              <input
                className="pp-input flex-1 text-sm"
                placeholder="Think out loud and type your answer…"
                value={input}
                disabled={busy || finishing}
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                type="submit"
                className="pp-btn-primary shrink-0"
                disabled={busy || finishing || !input.trim()}
              >
                {busy ? "…" : "Send"}
              </button>
            </form>
          )}
        </section>
      </div>

      {ended && (
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/mock-interview" className="pp-btn-primary inline-flex">
            Try another firm
          </Link>
          <button
            type="button"
            className="rounded-xl border border-subtle px-4 py-2 text-sm font-semibold text-secondary transition hover:border-accent/40 hover:text-accent"
            onClick={() => {
              // Restart a fresh interview with the same firm (new questions).
              startedRef.current = false;
              setMessages([]);
              setFeedback(null);
              setError(null);
              setInput("");
            }}
          >
            Retake (new questions)
          </button>
        </div>
      )}
    </div>
  );
}

function FeedbackCard({
  feedback,
  firmName,
}: {
  feedback: MockInterviewFeedback;
  firmName: string;
}) {
  const scoreColor =
    feedback.score >= 8
      ? "text-emerald-500"
      : feedback.score >= 5
        ? "text-amber-500"
        : "text-rose-500";

  return (
    <div className="rounded-2xl border border-subtle bg-surface-muted/40 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold text-primary">
          {firmName} interview feedback
        </h2>
        <div className="text-right">
          <span className={["text-3xl font-extrabold", scoreColor].join(" ")}>
            {feedback.score}
          </span>
          <span className="text-sm font-semibold text-muted">/10</span>
        </div>
      </div>

      <p className="mt-3 text-sm text-secondary">{feedback.summary}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <FeedbackList title="Strengths" items={feedback.strengths} tone="positive" />
        <FeedbackList title="Weaknesses" items={feedback.weaknesses} tone="negative" />
      </div>

      {feedback.whatToStudy.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted">What to study</h3>
          <ul className="mt-2 space-y-1.5">
            {feedback.whatToStudy.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-secondary">
                <span className="text-accent" aria-hidden>
                  →
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function FeedbackList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "positive" | "negative";
}) {
  const marker = tone === "positive" ? "text-emerald-500" : "text-rose-500";
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wide text-muted">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted">—</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm text-secondary">
              <span className={marker} aria-hidden>
                {tone === "positive" ? "✓" : "•"}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
