import { useState } from "react";
import { useProgress } from "../../context/ProgressContext";
import { hasFullMastery } from "../../lib/multiplayer/access";
import type { MultiplayerAccess } from "../../lib/multiplayer/access";

interface MultiplayerGateProps {
  onUnlocked: () => void;
}

export function MultiplayerGate({ onUnlocked }: MultiplayerGateProps) {
  const { progress, unlockMultiplayer } = useProgress();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (hasFullMastery(progress)) {
    return (
      <div className="pp-card p-6 text-center">
        <p className="text-secondary">
          You've mastered all lessons — multiplayer is unlocked for you anytime.
        </p>
        <button type="button" className="pp-btn-primary mt-4" onClick={onUnlocked}>
          Enter Multiplayer
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/verify-daily-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        expiresAt?: string;
        dateKey?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Incorrect password. Try again tomorrow for a new one.");
        return;
      }
      const access: MultiplayerAccess = {
        expiresAt: data.expiresAt!,
        dateKey: data.dateKey!,
      };
      unlockMultiplayer(access);
      onUnlocked();
    } catch {
      setError("Could not verify password. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pp-card mx-auto max-w-md p-6">
      <h2 className="text-lg font-bold text-primary">Multiplayer locked</h2>
      <p className="mt-2 text-sm text-secondary">
        Master all 6 lessons to play anytime, or enter today's password to unlock
        multiplayer until the next daily reset (midnight UTC).
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <label className="pp-label" htmlFor="mp-password">
          Password of the day
        </label>
        <input
          id="mp-password"
          type="text"
          className="pp-input w-full uppercase"
          placeholder="WORD-WORD-00"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="off"
          disabled={loading}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button type="submit" className="pp-btn-primary w-full" disabled={loading}>
          {loading ? "Verifying…" : "Unlock multiplayer"}
        </button>
      </form>
    </div>
  );
}
