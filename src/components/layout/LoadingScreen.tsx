import { Brand } from "../Brand";

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Brand size={44} />
      <div
        className="h-1.5 w-32 overflow-hidden rounded-full bg-surface-muted"
        role="status"
        aria-label="Loading"
      >
        <div className="h-full w-1/3 animate-pulse rounded-full bg-accent" />
      </div>
    </div>
  );
}
