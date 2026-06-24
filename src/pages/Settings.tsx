import { useAuth } from "../context/AuthContext";
import { useTheme, type ThemePreference } from "../context/ThemeContext";
import { MoonIcon, SettingsIcon, SunIcon } from "../components/icons";

const THEME_OPTIONS: { value: ThemePreference; label: string; hint: string }[] = [
  { value: "light", label: "Light", hint: "Always use the light theme" },
  { value: "dark", label: "Dark", hint: "Always use the dark theme" },
  { value: "system", label: "System", hint: "Match your device setting" },
];

export function Settings() {
  const { user } = useAuth();
  const { preference, resolved, setPreference } = useTheme();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-surface-muted text-secondary">
          <SettingsIcon size={20} />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-primary">Settings</h1>
          <p className="text-sm text-secondary">Manage your account and appearance.</p>
        </div>
      </div>

      <section className="pp-card p-6">
        <h2 className="font-semibold text-primary">Appearance</h2>
        <p className="mt-1 text-sm text-secondary">
          Choose your theme. Currently showing{" "}
          <span className="font-medium text-primary">{resolved}</span> mode.
        </p>

        <div
          className="mt-4 grid gap-3 sm:grid-cols-3"
          role="radiogroup"
          aria-label="Theme preference"
        >
          {THEME_OPTIONS.map((opt) => {
            const active = preference === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setPreference(opt.value)}
                className={[
                  "flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-colors",
                  active
                    ? "border-accent bg-surface-muted"
                    : "border-subtle hover:border-accent/60",
                ].join(" ")}
              >
                <span className="flex items-center gap-2 font-medium text-primary">
                  {opt.value === "dark" ? (
                    <MoonIcon size={18} />
                  ) : opt.value === "light" ? (
                    <SunIcon size={18} />
                  ) : (
                    <SettingsIcon size={18} />
                  )}
                  {opt.label}
                </span>
                <span className="text-xs text-secondary">{opt.hint}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="pp-card mt-4 p-6">
        <h2 className="font-semibold text-primary">Account</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-secondary">Username</dt>
            <dd className="text-primary">{user?.displayName ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-secondary">Email</dt>
            <dd className="truncate text-primary">{user?.email ?? "—"}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
