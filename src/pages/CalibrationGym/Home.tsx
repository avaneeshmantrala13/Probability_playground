import { Link } from "react-router-dom";

/**
 * Placeholder Calibration Gym landing. This index route is intentionally
 * structured so it can LATER become the Candy-Crush-style station map without
 * changing any routing — for now it just introduces the gym and drops the user
 * into the calibration drill.
 */
export function Home() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="pp-card p-8">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
          Calibration Gym
        </span>
        <h1 className="mt-4 text-3xl font-bold text-primary">
          Train your probability calibration
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-secondary">
          Read a probability puzzle, commit to an honest forecast, and get scored
          against the exact answer with proper scoring rules (Brier, log loss,
          and the Winkler interval score). Over time you learn to say what you
          actually know — and to stop being confidently wrong.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/calibration-gym/drill" className="pp-btn-primary">
            Start a drill →
          </Link>
        </div>

        <p className="mt-6 text-xs text-muted">
          A station map of calibration challenges is coming soon. For now, jump
          straight into the drill.
        </p>
      </div>
    </div>
  );
}
