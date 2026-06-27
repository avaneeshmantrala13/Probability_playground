import { useState, type FormEvent, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Brand } from "../components/Brand";
import { GoogleButton } from "../components/GoogleButton";
import {
  authErrorMessage,
  consumeStoredAuthError,
  isAuthError,
  isValidUsername,
  signInWithGoogle,
  signUpWithUsername,
} from "../lib/auth";
import { useCanonicalAuthUrl } from "../hooks/useCanonicalAuthUrl";

export function Signup() {
  useCanonicalAuthUrl();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
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

    if (!isValidUsername(username)) {
      setError("Username must be 3-20 characters: letters, numbers, or underscores.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setBusy(true);
    try {
      await signUpWithUsername(username, email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(authErrorMessage(err, "Unable to create account."));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      navigate("/", { replace: true });
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
            Create your account
          </h1>
          <p className="mt-1 text-secondary">Start learning probability by doing.</p>
        </div>

        <div className="pp-card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="username" className="pp-label">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                className="pp-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. math_whiz"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="pp-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="pp-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                autoComplete="new-password"
                className="pp-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
              />
            </div>

            {error && (
              <p className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="pp-btn-primary w-full" disabled={busy}>
              {busy ? "Creating account\u2026" : "Create account"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-subtle" />
            OR
            <span className="h-px flex-1 bg-subtle" />
          </div>

          <GoogleButton onClick={handleGoogle} disabled={busy} label="Sign up with Google" />
        </div>

        <p className="mt-6 text-center text-sm text-secondary">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-accent hover:text-accent-hover">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
