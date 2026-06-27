import { useProgress } from "../context/ProgressContext";
import {
  BADGES,
  earnedCount,
  isEarned,
  type Badge,
  type BadgeCategory,
} from "../lib/badges";
import { CheckIcon, FlameIcon, LockIcon } from "../components/icons";

const CATEGORY_ORDER: BadgeCategory[] = [
  "lesson",
  "quant",
  "game",
  "streak",
  "speed",
  "token",
];

const CATEGORY_LABELS: Record<BadgeCategory, string> = {
  lesson: "Lessons",
  quant: "Quant prep",
  game: "Games",
  streak: "Streaks",
  speed: "Speed",
  token: "Casino",
};

export function Badges() {
  const { progress } = useProgress();
  const total = BADGES.length;
  const earned = earnedCount(progress);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
          Badges
        </h1>
        <p className="mt-2 max-w-xl text-secondary">
          Earn badges by mastering lessons, unlocking games, keeping your daily
          streak alive, and finishing lessons fast.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="pp-card inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary">
            <span className="text-accent">{earned}</span> of {total} badges earned
          </span>
          <span className="pp-card inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary">
            <FlameIcon size={16} className="text-accent" />
            {progress.streak}-day streak
          </span>
        </div>
      </header>

      {CATEGORY_ORDER.map((category) => {
        const items = BADGES.filter((badge) => badge.category === category);
        if (items.length === 0) return null;
        return (
          <section key={category} className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-primary">
              {CATEGORY_LABELS[category]}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((badge) => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  earned={isEarned(badge, progress)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function BadgeCard({ badge, earned }: { badge: Badge; earned: boolean }) {
  const Icon = badge.icon;
  const [from, to] = badge.gradient;
  return (
    <div
      className={[
        "pp-card flex items-start gap-4 p-5 transition",
        earned ? "border-transparent" : "opacity-60",
      ].join(" ")}
      style={earned ? { boxShadow: `0 10px 28px -14px ${to}` } : undefined}
      aria-label={`${badge.title} — ${earned ? "earned" : "locked"}`}
    >
      <span
        className={[
          "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
          earned ? "text-white shadow-inner" : "bg-surface-muted text-muted",
        ].join(" ")}
        style={
          earned
            ? { backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }
            : undefined
        }
      >
        <Icon size={24} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-primary">{badge.title}</h3>
          {earned ? (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-white"
              style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
            >
              <CheckIcon size={13} />
              Earned
            </span>
          ) : (
            <span className="text-muted">
              <LockIcon size={16} />
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-secondary">{badge.description}</p>
      </div>
    </div>
  );
}
