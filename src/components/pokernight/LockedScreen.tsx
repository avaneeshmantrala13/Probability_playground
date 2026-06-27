import { Link } from "react-router-dom";
import { LockIcon } from "../icons";

interface LockedScreenProps {
  headline: string;
  detail: string;
}

export function LockedScreen({ headline, detail }: LockedScreenProps) {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="pp-card p-8 text-center">
        <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-surface-muted text-secondary">
          <LockIcon size={28} />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
          {headline}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-secondary">{detail}</p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/poker-theory" className="pp-btn-primary">
            Go to Poker Theory
          </Link>
          <Link to="/" className="pp-btn-secondary">
            Back Home
          </Link>
        </div>
      </div>
    </div>
  );
}
