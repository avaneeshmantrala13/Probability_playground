import { useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProgress } from "../context/ProgressContext";
import {
  PLANS,
  SPRINTS,
  PLAN_NAMES,
  formatUsd,
  monthlyEquivalent,
  annualSavingsAmount,
  type BillingInterval,
  type EntitlementLevel,
  type PaidPlanId,
  type PlanId,
  type SprintId,
  type Plan,
} from "../lib/billing/plans";
import { effectivePlan, type PlanProgressLike } from "../lib/billing/entitlements";
import { startCheckout } from "../lib/billing/client";

type CheckoutTarget =
  | { kind: "plan"; plan: PaidPlanId }
  | { kind: "sprint"; sprintId: SprintId };

function targetKey(target: CheckoutTarget): string {
  return target.kind === "plan" ? `plan:${target.plan}` : `sprint:${target.sprintId}`;
}

/** Feature comparison rows: ✓/—/text per plan. */
const COMPARISON: { label: string; values: Record<PlanId, string> }[] = [
  {
    label: "Practice questions",
    values: { free: "10 / day", pro: "Unlimited", interview_prep: "Unlimited" },
  },
  {
    label: "Mental-math arena",
    values: {
      free: "Arithmetic",
      pro: "Full + brainteasers",
      interview_prep: "Full + brainteasers",
    },
  },
  {
    label: "Poker Night",
    values: { free: "1 / day", pro: "Full", interview_prep: "Full" },
  },
  {
    label: "AI tutor",
    values: { free: "5 / day", pro: "Unlimited", interview_prep: "Unlimited" },
  },
  {
    label: "Readiness dashboard",
    values: { free: "—", pro: "✓", interview_prep: "✓" },
  },
  {
    label: "AI mock interviews",
    values: { free: "—", pro: "—", interview_prep: "Unlimited" },
  },
  {
    label: "Per-firm readiness diagnostics",
    values: { free: "—", pro: "—", interview_prep: "✓" },
  },
];

export function Pricing() {
  const { user } = useAuth();
  const { progress } = useProgress();
  const currentPlan: EntitlementLevel = effectivePlan(
    progress as unknown as PlanProgressLike,
  );

  const [params] = useSearchParams();
  const checkoutState = params.get("checkout");

  const [interval, setBillingInterval] = useState<BillingInterval>("annual");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkout(target: CheckoutTarget) {
    setError(null);
    if (!user) {
      setError("Please sign in to upgrade.");
      return;
    }
    setPending(targetKey(target));
    const result =
      target.kind === "plan"
        ? await startCheckout({ plan: target.plan, interval })
        : await startCheckout({ sprintId: target.sprintId });
    if (!result.ok) {
      setError(result.error);
      setPending(null);
    }
    // On success the browser redirects to Stripe, so we leave `pending` set.
  }

  const annual = interval === "annual";
  const freePlan = PLANS.find((p) => p.id === "free");
  const paidPlans = PLANS.filter((p): p is Plan => p.id !== "free");

  return (
    <div className="mx-auto max-w-6xl px-1 pb-16">
      <header className="mx-auto max-w-2xl pt-2 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
          Train like the interview is tomorrow
        </h1>
        <p className="mt-3 text-secondary">
          Unlimited practice and unlimited AI mock interviews — instead of a single
          ~$200 human mock. Cancel anytime.
        </p>
        {currentPlan !== "free" && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-success-soft px-3 py-1 text-sm font-semibold text-success">
            You&apos;re on {PLAN_NAMES[currentPlan]}
          </p>
        )}
      </header>

      {checkoutState === "success" && (
        <Banner tone="success">
          Payment received. Your access updates within a few seconds — refresh if you
          don&apos;t see it yet.
        </Banner>
      )}
      {checkoutState === "cancel" && (
        <Banner tone="muted">Checkout canceled — no charge was made.</Banner>
      )}
      {error && <Banner tone="danger">{error}</Banner>}

      {/* Monthly / annual toggle */}
      <div className="mt-8 flex items-center justify-center gap-3">
        <span className={!annual ? "text-sm font-semibold text-primary" : "text-sm text-muted"}>
          Monthly
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={annual}
          aria-label="Toggle annual billing"
          onClick={() => setBillingInterval(annual ? "monthly" : "annual")}
          className={[
            "relative h-7 w-12 rounded-full transition-colors",
            annual ? "bg-accent" : "bg-surface-muted",
          ].join(" ")}
        >
          <span
            className={[
              "absolute top-0.5 h-6 w-6 rounded-full bg-surface shadow transition-transform",
              annual ? "translate-x-5" : "translate-x-0.5",
            ].join(" ")}
          />
        </button>
        <span className={annual ? "text-sm font-semibold text-primary" : "text-sm text-muted"}>
          Annual
          <span className="ml-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent">
            2 months free
          </span>
        </span>
      </div>

      {/* Tier cards */}
      <section className="mt-8 grid gap-5 lg:grid-cols-3">
        {/* Free */}
        {freePlan && (
          <PlanCard
            name={freePlan.name}
            tagline={freePlan.tagline}
            priceLabel={formatUsd(0)}
            priceSuffix=""
            subLabel="Always free"
            highlights={freePlan.features}
            isCurrent={currentPlan === "free"}
            cta={
              currentPlan === "free" ? (
                <span className="pp-btn-secondary w-full cursor-default">Current plan</span>
              ) : (
                <Link to="/" className="pp-btn-secondary w-full">
                  Keep exploring
                </Link>
              )
            }
          />
        )}

        {/* Pro & Interview Prep */}
        {paidPlans.map((plan) => {
          const planId = plan.id as PaidPlanId;
          const price = plan.price!;
          const isCurrent = currentPlan === planId;
          const amount = annual ? price.annualTotal : price.monthly;
          const subLabel = annual
            ? `${formatUsd(monthlyEquivalent(price))}/mo billed annually · save ${formatUsd(
                annualSavingsAmount(price),
              )}`
            : "billed monthly";
          return (
            <PlanCard
              key={planId}
              name={plan.name}
              tagline={plan.tagline}
              mostPopular={plan.highlight}
              priceLabel={formatUsd(amount)}
              priceSuffix={annual ? "/yr" : "/mo"}
              subLabel={subLabel}
              highlights={plan.features}
              isCurrent={isCurrent}
              cta={
                <button
                  type="button"
                  disabled={pending !== null || isCurrent}
                  onClick={() => checkout({ kind: "plan", plan: planId })}
                  className={
                    plan.highlight ? "pp-btn-primary w-full" : "pp-btn-secondary w-full"
                  }
                >
                  {isCurrent
                    ? "Current plan"
                    : pending === `plan:${planId}`
                      ? "Starting checkout…"
                      : `Choose ${plan.name}`}
                </button>
              }
            />
          );
        })}
      </section>

      {/* Comparison table */}
      <section className="mt-12">
        <h2 className="text-center text-xl font-extrabold text-primary">Compare every plan</h2>
        <div className="pp-card mt-5 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-subtle">
                <th className="px-4 py-3 font-semibold text-secondary">Feature</th>
                {(["free", "pro", "interview_prep"] as PlanId[]).map((planId) => (
                  <th key={planId} className="px-4 py-3 text-center font-extrabold text-primary">
                    {PLAN_NAMES[planId]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.label} className="border-b border-subtle/60 last:border-0">
                  <td className="px-4 py-3 text-secondary">{row.label}</td>
                  {(["free", "pro", "interview_prep"] as PlanId[]).map((planId) => (
                    <td key={planId} className="px-4 py-3 text-center font-medium text-primary">
                      {row.values[planId]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Sprints */}
      <section className="mt-14">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold text-primary">Interview Sprints</h2>
          <p className="mt-2 text-secondary">
            Got an interview on the calendar? These are structured cram programs — a day-by-day
            plan, scheduled AI mock interviews, and a final readiness report. Every sprint
            unlocks full Interview Prep for its window. One-time purchase, no auto-renew.
          </p>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SPRINTS.map((sprint) => {
            const isPending = pending === `sprint:${sprint.id}`;
            const popular = Boolean(sprint.badge);
            return (
              <div
                key={sprint.id}
                className={[
                  "pp-card relative flex flex-col p-6",
                  popular ? "ring-2 ring-accent" : "",
                ].join(" ")}
              >
                {sprint.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-contrast">
                    {sprint.badge}
                  </span>
                )}
                <h3 className="text-lg font-extrabold text-primary">{sprint.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-primary">
                    {formatUsd(sprint.priceOneTime)}
                  </span>
                  <span className="text-xs text-muted">
                    once · {sprint.durationDays}d
                  </span>
                </div>
                <p className="mt-3 text-sm text-secondary">{sprint.description}</p>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-primary">
                  {sprint.features.map((h) => (
                    <li key={h} className="flex gap-2">
                      <span className="text-accent" aria-hidden>
                        ✓
                      </span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={pending !== null}
                  onClick={() => checkout({ kind: "sprint", sprintId: sprint.id })}
                  className={[
                    "mt-5 w-full",
                    popular ? "pp-btn-primary" : "pp-btn-secondary",
                  ].join(" ")}
                >
                  {isPending ? "Starting checkout…" : "Start sprint"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-muted">
        Payments are processed securely by Stripe. Subscriptions renew automatically and can be
        cancelled anytime; sprints are one-time purchases that unlock full access for their
        window. Prices in USD.
      </p>
    </div>
  );
}

interface PlanCardProps {
  name: string;
  tagline: string;
  mostPopular?: boolean;
  priceLabel: string;
  priceSuffix: string;
  subLabel: string;
  highlights: string[];
  isCurrent: boolean;
  cta: ReactNode;
}

function PlanCard({
  name,
  tagline,
  mostPopular,
  priceLabel,
  priceSuffix,
  subLabel,
  highlights,
  isCurrent,
  cta,
}: PlanCardProps) {
  return (
    <div
      className={[
        "pp-card relative flex flex-col p-6",
        mostPopular ? "ring-2 ring-accent" : "",
      ].join(" ")}
    >
      {mostPopular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-contrast">
          Most Popular
        </span>
      )}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-extrabold text-primary">{name}</h3>
        {isCurrent && (
          <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-bold text-success">
            Active
          </span>
        )}
      </div>
      <p className="mt-1 min-h-[2.5rem] text-sm text-secondary">{tagline}</p>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-4xl font-extrabold text-primary">{priceLabel}</span>
        {priceSuffix && <span className="text-sm text-muted">{priceSuffix}</span>}
      </div>
      <p className="mt-1 text-xs font-medium text-accent">{subLabel}</p>
      <ul className="mt-5 flex-1 space-y-2 text-sm text-primary">
        {highlights.map((h) => (
          <li key={h} className="flex gap-2">
            <span className="text-accent" aria-hidden>
              ✓
            </span>
            <span>{h}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6">{cta}</div>
    </div>
  );
}

function Banner({
  tone,
  children,
}: {
  tone: "success" | "danger" | "muted";
  children: ReactNode;
}) {
  const styles: Record<typeof tone, string> = {
    success: "bg-success-soft text-success",
    danger: "bg-danger-soft text-danger",
    muted: "bg-surface-muted text-secondary",
  };
  return (
    <div
      className={[
        "mx-auto mt-6 max-w-2xl rounded-xl px-4 py-3 text-center text-sm font-medium",
        styles[tone],
      ].join(" ")}
      role="status"
    >
      {children}
    </div>
  );
}
