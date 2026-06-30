import { useState } from "react";
import { sendTutorMessage } from "../../lib/ai/client";
import type { Explanations } from "../../content/types";

interface TutorMessage {
  role: "user" | "assistant";
  content: string;
}

interface QuestionTutorChatProps {
  lessonTitle: string;
  questionText: string;
  options: string[];
  selectedIndex: number | null;
  /** True once the student has checked their answer for this question. */
  answered: boolean;
  /**
   * Solution context for the process-aware tutor. The server gates the answer/
   * explanations behind `answered`, so passing these never leaks pre-submission.
   */
  correctIndex?: number | null;
  explanations?: Explanations | null;
  concept?: string | null;
}

export function QuestionTutorChat({
  lessonTitle,
  questionText,
  options,
  selectedIndex,
  answered,
  correctIndex,
  explanations,
  concept,
}: QuestionTutorChatProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setError(null);
    setBusy(true);
    const nextUser: TutorMessage = { role: "user", content: trimmed };
    const history = [...messages, nextUser];
    setMessages(history);
    setInput("");
    try {
      const reply = await sendTutorMessage({
        lessonTitle,
        questionText,
        options,
        selectedIndex,
        answered,
        correctIndex,
        explanations,
        concept,
        messages: history,
      });
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tutor unavailable.");
      setMessages((m) => m.slice(0, -1));
    } finally {
      setBusy(false);
    }
  }

  const chips = answered
    ? ["Explain step by step", "Why are the wrong answers wrong?", "Give a similar problem"]
    : ["Explain the key concept", "What approach should I take?", "Define the terms used"];

  if (!open) {
    return (
      <button
        type="button"
        className="mt-4 w-full rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm font-semibold text-accent transition hover:bg-accent/10"
        onClick={() => setOpen(true)}
      >
        {answered ? "Ask the quant tutor about this problem" : "Ask the quant tutor for a concept hint"}
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-subtle bg-surface-muted/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-primary">Quant tutor</p>
        <button
          type="button"
          className="text-xs font-medium text-muted hover:text-primary"
          onClick={() => setOpen(false)}
        >
          Hide
        </button>
      </div>

      {!answered && (
        <p className="mb-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-400">
          Heads up: until you submit, the tutor only clarifies concepts — it
          won't reveal or hint at the answer.
        </p>
      )}

      <div className="max-h-52 space-y-2 overflow-y-auto text-sm">
        {messages.length === 0 && (
          <p className="text-secondary">
            {answered
              ? "Ask anything — why an answer works, similar problems, or the underlying theory."
              : "Ask about a concept, definition, or the general approach. The answer stays hidden until you submit."}
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={[
              "rounded-lg px-3 py-2",
              m.role === "user" ? "bg-accent/10 text-primary" : "bg-surface text-secondary",
            ].join(" ")}
          >
            {m.content}
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-2 text-xs text-danger" role="alert">
          {error}
        </p>
      )}

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <input
          className="pp-input flex-1 text-sm"
          placeholder={
            answered
              ? "Why is C wrong? Give me a similar problem…"
              : "Explain the concept or approach (no answers!)…"
          }
          value={input}
          disabled={busy}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="pp-btn-primary shrink-0" disabled={busy || !input.trim()}>
          {busy ? "…" : "Ask"}
        </button>
      </form>

      <div className="mt-2 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            disabled={busy}
            className="rounded-full border border-subtle px-2.5 py-1 text-xs text-secondary hover:border-accent/40 hover:text-accent"
            onClick={() => void send(chip)}
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}
