import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Badge } from "./ui";
import { ProbabilityInput, IntervalInput } from "./forecastInputs";

type Mode = "proposition" | "numeric";

interface PublicProblem {
  family: string;
  problemType: string;
  mode: Mode;
  title: string;
  prompt: string;
  proposition?: string;
  threshold?: string;
  unit?: string;
  suggestedMax?: number;
  seed: string;
}

interface Result {
  scored: {
    mode: Mode;
    brier: number | null;
    logLoss: number | null;
    winkler: number | null;
    covered: boolean | null;
    outcome: 0 | 1 | null;
  };
  truth: {
    mode: Mode;
    truthValue: string;
    truthDecimal: number;
    resolvesTrue: boolean | null;
    threshold: string | null;
    proposition: string | null;
    unit: string | null;
    explanation: string;
  };
}

const FAMILY_TABS = [
  { id: "", label: "Mixed" },
  { id: "coin-flip", label: "Coin-flip" },
  { id: "bayes", label: "Bayes" },
];

async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    if (body?.error) return body.error;
  } catch {
    // ignore parse errors
  }
  return fallback;
}

export function Drill() {
  const { user } = useAuth();
  const [family, setFamily] = useState("");
  const [problem, setProblem] = useState<PublicProblem | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [prob, setProb] = useState(50); // percent
  const [lo, setLo] = useState("");
  const [hi, setHi] = useState("");
  const [confidence, setConfidence] = useState(0.9);

  const loadProblem = useCallback(async (fam: string) => {
    setLoading(true);
    setResult(null);
    setError(null);
    setProb(50);
    setLo("");
    setHi("");
    setConfidence(0.9);
    try {
      const url = fam ? `/api/gym/problem?family=${fam}` : "/api/gym/problem";
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        setError(await errorMessage(res, "Could not load a problem."));
        setProblem(null);
        return;
      }
      const data = (await res.json()) as PublicProblem;
      setProblem(data);
    } catch {
      setError("Could not reach the problem service.");
      setProblem(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProblem(family);
  }, [family, loadProblem]);

  async function submit() {
    if (!problem) return;
    setSubmitting(true);
    setError(null);
    try {
      const token = user ? await user.getIdToken() : null;
      if (!token) {
        setError("You need to be signed in to submit a forecast.");
        return;
      }
      const body: Record<string, unknown> = { seed: problem.seed };
      if (problem.mode === "proposition") {
        body.forecastProb = prob / 100;
      } else {
        body.intervalLo = parseFloat(lo);
        body.intervalHi = parseFloat(hi);
        body.confidence = confidence;
      }
      const res = await fetch("/api/gym/attempt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError(await errorMessage(res, "Could not score your forecast."));
        return;
      }
      setResult((await res.json()) as Result);
    } catch {
      setError("Could not reach the scoring service.");
    } finally {
      setSubmitting(false);
    }
  }

  const numericValid =
    problem?.mode === "numeric" &&
    lo !== "" &&
    hi !== "" &&
    !Number.isNaN(parseFloat(lo)) &&
    !Number.isNaN(parseFloat(hi)) &&
    parseFloat(lo) <= parseFloat(hi);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Calibration drill</h1>
          <p className="text-sm text-secondary">
            Read the problem, commit to an honest forecast, then see the exact
            answer and your score.
          </p>
        </div>
        <div className="flex gap-1 rounded-xl border border-subtle bg-surface-muted p-1">
          {FAMILY_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setFamily(t.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                family === t.id
                  ? "bg-accent/15 text-primary"
                  : "text-muted hover:text-primary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="pp-card border-danger/30 bg-danger-soft p-4 text-sm text-danger">
          {error}
        </div>
      ) : null}

      {loading || !problem ? (
        <div className="pp-card grid h-64 place-items-center p-8 text-muted">
          {error ? "Try another problem." : "Generating a fresh problem…"}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Problem */}
          <div className="pp-card p-6 lg:col-span-3">
            <div className="flex items-center gap-2">
              <Badge tone={problem.family === "coin-flip" ? "accent" : "good"}>
                {problem.family}
              </Badge>
              <Badge>{problem.mode}</Badge>
              <span className="font-mono text-xs text-muted">
                {problem.problemType}
              </span>
            </div>
            <h2 className="mt-3 text-lg font-semibold text-primary">
              {problem.title}
            </h2>
            <p className="mt-2 leading-relaxed text-secondary">{problem.prompt}</p>

            {problem.mode === "proposition" ? (
              <div className="mt-5 rounded-xl border border-accent/25 bg-accent/5 p-4">
                <div className="pp-label text-accent">Claim to price</div>
                <p className="mt-1 font-medium text-primary">
                  {problem.proposition}
                </p>
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-subtle bg-surface-muted p-4 text-sm text-secondary">
                Give a{" "}
                <span className="font-semibold text-primary">
                  prediction interval
                </span>{" "}
                for the exact value (in {problem.unit}). A wider interval is
                safer but scores worse if you already knew the answer.
              </div>
            )}
          </div>

          {/* Elicitation / Result */}
          <div className="pp-card p-6 lg:col-span-2">
            {!result ? (
              problem.mode === "proposition" ? (
                <ProbabilityInput
                  prob={prob}
                  setProb={setProb}
                  onSubmit={submit}
                  submitting={submitting}
                />
              ) : (
                <IntervalInput
                  lo={lo}
                  hi={hi}
                  setLo={setLo}
                  setHi={setHi}
                  confidence={confidence}
                  setConfidence={setConfidence}
                  suggestedMax={problem.suggestedMax}
                  unit={problem.unit}
                  valid={!!numericValid}
                  onSubmit={submit}
                  submitting={submitting}
                />
              )
            ) : (
              <ResultPanel result={result} onNext={() => loadProblem(family)} />
            )}
          </div>
        </div>
      )}

      <div className="text-center text-sm text-muted">
        <Link to="/calibration-gym" className="text-accent hover:underline">
          ← Back to the Calibration Gym
        </Link>
      </div>
    </div>
  );
}

function ResultPanel({
  result,
  onNext,
}: {
  result: Result;
  onNext: () => void;
}) {
  const { scored, truth } = result;
  const isProp = truth.mode === "proposition";
  const good = isProp ? (scored.brier ?? 1) < 0.15 : (scored.covered ?? false);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2">
        <Badge tone={good ? "good" : "warn"}>
          {isProp
            ? scored.outcome === 1
              ? "Claim was TRUE"
              : "Claim was FALSE"
            : scored.covered
              ? "Interval covered it"
              : "Interval missed"}
        </Badge>
      </div>

      <div className="mt-4 rounded-xl border border-subtle bg-surface-muted p-4">
        <div className="pp-label">Exact answer</div>
        <div className="mt-1 font-mono text-2xl font-bold text-primary">
          {truth.truthValue}
          <span className="ml-2 text-base text-muted">
            ≈ {truth.truthDecimal.toFixed(4)}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {isProp ? (
          <>
            <MiniStat
              label="Brier"
              value={scored.brier!.toFixed(4)}
              tone={
                scored.brier! < 0.15 ? "good" : scored.brier! < 0.25 ? "warn" : "bad"
              }
            />
            <MiniStat label="Log loss" value={scored.logLoss!.toFixed(4)} />
          </>
        ) : (
          <>
            <MiniStat
              label="Winkler"
              value={scored.winkler!.toFixed(3)}
              tone={scored.covered ? "good" : "bad"}
            />
            <MiniStat
              label="Covered"
              value={scored.covered ? "Yes" : "No"}
              tone={scored.covered ? "good" : "bad"}
            />
          </>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-subtle bg-surface-muted p-4 text-sm leading-relaxed text-secondary">
        {truth.explanation}
      </div>

      <button onClick={onNext} className="pp-btn-primary mt-6 w-full">
        Next problem →
      </button>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  const c =
    tone === "good"
      ? "text-cg-signal-good"
      : tone === "warn"
        ? "text-cg-signal-warn"
        : tone === "bad"
          ? "text-cg-signal-bad"
          : "text-primary";
  return (
    <div className="rounded-xl border border-subtle bg-surface-muted p-3">
      <div className="pp-label">{label}</div>
      <div className={`mt-1 font-mono text-xl font-bold ${c}`}>{value}</div>
    </div>
  );
}
