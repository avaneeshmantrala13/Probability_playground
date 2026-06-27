import { useState, type FormEvent, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Brand } from "../components/Brand";
import { GoogleButton } from "../components/GoogleButton";
import {
  authErrorMessage,
  consumeStoredAuthError,
  isAuthError,
  signInWithGoogle,
  signInWithIdentifier,
} from "../lib/auth";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: { pathname?: string } } };
  const redirectTo = location.state?.from?.pathname ?? "/";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const stored = consumeStoredAuthError();
    if (stored) setError(stored);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signInWithIdentifier(identifier, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (isAuthError(err) && err.code === "redirect") return;
      setError(authErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Brand size={48} />
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-primary">
            Welcome back
          </h1>
          <p className="mt-1 text-secondary">Sign in to continue learning.</p>
        </div>

        <div className="pp-card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="identifier" className="pp-label">
                Username or email
              </label>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                className="pp-input"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="pp-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="pp-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="pp-btn-primary w-full" disabled={busy}>
              {busy ? "Signing in\u2026" : "Sign in"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-subtle" />
            OR
            <span className="h-px flex-1 bg-subtle" />
          </div>

          <GoogleButton onClick={handleGoogle} disabled={busy} label="Continue with Google" />
        </div>

        <p className="mt-6 text-center text-sm text-secondary">
          New here?{" "}
          <Link to="/signup" className="font-semibold text-accent hover:text-accent-hover">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
