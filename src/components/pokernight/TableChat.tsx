import { useEffect, useRef, useState } from "react";
import {
  sendChatMessage,
  setPlayerChatEnabled,
  subscribeToChat,
  type ChatMessage,
  type PokerRoom,
} from "../../lib/multiplayer/rooms";

interface TableChatProps {
  roomId: string;
  uid: string;
  room: PokerRoom;
  className?: string;
}

export function TableChat({ roomId, uid, room, className }: TableChatProps) {
  const me = room.players[uid];
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const chatEnabled = me?.chatEnabled ?? false;

  useEffect(() => {
    return subscribeToChat(roomId, chatEnabled, setMessages);
  }, [roomId, chatEnabled]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!me) return null;

  const handleToggle = () => {
    void setPlayerChatEnabled(roomId, uid, !chatEnabled);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatEnabled || !draft.trim()) return;
    void sendChatMessage(roomId, uid, me.name, draft, chatEnabled);
    setDraft("");
  };

  return (
    <div className={["pp-card flex min-h-0 flex-col p-2", className].filter(Boolean).join(" ")}>
      <div className="mb-1.5 flex shrink-0 items-center justify-between">
        <span className="text-xs font-semibold text-primary">Table chat</span>
        <button type="button" className="text-xs text-accent" onClick={handleToggle}>
          {chatEnabled ? "Turn off" : "Turn on"}
        </button>
      </div>
      {chatEnabled ? (
        <>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto text-xs">
            {messages.length === 0 && (
              <p className="text-muted">No messages yet.</p>
            )}
            {messages.map((m) => (
              <p key={m.id}>
                <span className="font-semibold text-accent">{m.name}:</span>{" "}
                <span className="text-secondary">{m.text}</span>
              </p>
            ))}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={handleSend} className="mt-1.5 flex shrink-0 gap-1.5">
            <input
              type="text"
              className="pp-input flex-1 text-sm"
              placeholder="Say something…"
              value={draft}
              maxLength={280}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button type="submit" className="pp-btn-secondary text-sm">
              Send
            </button>
          </form>
        </>
      ) : (
        <p className="text-xs text-muted">
          Chat is off. Turn it on to send and receive messages.
        </p>
      )}
    </div>
  );
}
