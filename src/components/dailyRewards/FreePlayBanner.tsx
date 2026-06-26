import { Link } from "react-router-dom";
import { POKER_ROUTE } from "../../lib/tokens";
import { ClockIcon } from "../icons";

interface FreePlayBannerProps {
  minutesRemaining: number;
  streakDay: number;
}

export function FreePlayBanner({ minutesRemaining, streakDay }: FreePlayBannerProps) {
  if (minutesRemaining <= 0) return null;

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-accent/25 bg-accent/10 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent">
          <ClockIcon size={20} />
        </div>
        <div>
          <p className="font-semibold text-primary">{minutesRemaining} min free poker play</p>
          <p className="text-sm text-secondary">
            Day {streakDay} streak reward — practice at the table on us
          </p>
        </div>
      </div>
      <Link to={POKER_ROUTE} className="pp-btn-primary flex-shrink-0">
        Play now
      </Link>
    </div>
  );
}
