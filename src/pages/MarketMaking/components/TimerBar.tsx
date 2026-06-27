import { useEffect, useState } from "react";

interface TimerBarProps {
  seconds: number;
  onExpire: () => void;
  paused?: boolean;
}

export function TimerBar({ seconds, onExpire, paused }: TimerBarProps) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (paused || seconds <= 0) return;
    setRemaining(seconds);
    const id = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(id);
          onExpire();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [seconds, paused, onExpire]);

  if (seconds <= 0) return null;

  const pct = (remaining / seconds) * 100;
  const urgent = remaining <= seconds * 0.25;

  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-muted">
        <span>Time</span>
        <span>{remaining}s</span>
      </div>
      <div className="mm-timer">
        <div
          className={`mm-timer-bar${urgent ? " mm-timer-bar--urgent" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
