import { useState } from "react";
import { sendTutorMessage } from "../../lib/ai/client";

interface TutorMessage {
  role: "user" | "assistant";
  content: string;
}

interface QuestionTutorChatProps {
  lessonTitle: string;
  questionText: string;
  options: string[];
  selectedIndex: number | null;
}

export function QuestionTutorChat({
  lessonTitle,
  questionText,
  options,
  selectedIndex,
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

  if (!open) {
    return (
      <button
        type="button"
        className="mt-4 w-full rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm font-semibold text-accent transition hover:bg-accent/10"
        onClick={() => setOpen(true)}
      >
        Ask the quant tutor about this problem
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

      <div className="max-h-52 space-y-2 overflow-y-auto text-sm">
        {messages.length === 0 && (
          <p className="text-secondary">
            Ask anything — why an answer works, similar problems, or the underlying theory.
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
          placeholder="Why is C wrong? Give me a similar problem…"
          value={input}
          disabled={busy}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="pp-btn-primary shrink-0" disabled={busy || !input.trim()}>
          {busy ? "…" : "Ask"}
        </button>
      </form>

      <div className="mt-2 flex flex-wrap gap-2">
        {["Explain step by step", "Why are the wrong answers wrong?", "Give a similar problem"].map(
          (chip) => (
            <button
              key={chip}
              type="button"
              disabled={busy}
              className="rounded-full border border-subtle px-2.5 py-1 text-xs text-secondary hover:border-accent/40 hover:text-accent"
              onClick={() => void send(chip)}
            >
              {chip}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
