import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useProgress } from "../../context/ProgressContext";
import { useAuth } from "../../context/AuthContext";
import {
  effectivePlan,
  hasEntitlement,
  minimumPlanFor,
  planSatisfies,
  type PlanProgressLike,
} from "./entitlements";
import {
  FEATURE_UPSELL,
  PLAN_NAMES,
  formatUsd,
  getPlan,
  type EntitlementLevel,
  type Feature,
  type PlanId,
} from "./plans";
import { isCompAccessEmail } from "./compAccess";

/**
 * Reads the user's effective plan from ProgressContext. The `plan` /
 * `planExpiresAt` fields are written only by the Stripe webhook (server side);
 * the client treats them as read-only. We read them defensively so this works
 * whether or not the orchestrator has added the fields to CourseProgress yet.
 */
export function useEntitlement() {
  const { progress } = useProgress();
  const { user } = useAuth();
  const planLike = progress as unknown as PlanProgressLike;
  // Comped owner accounts always resolve to the top tier so every paid page is
  // viewable without billing. All other users go through the normal plan logic.
  const plan: EntitlementLevel = isCompAccessEmail(user?.email)
    ? "interview_prep"
    : effectivePlan(planLike);
  return {
    /** The plan currently in effect (expiry-aware). */
    plan,
    /** Raw expiry timestamp (epoch ms) if any. */
    expiresAt: planLike.planExpiresAt ?? null,
    /** Whether the user can use a specific feature. */
    has: (feature: Feature) => hasEntitlement(plan, feature),
    /** Whether the user is at least on a given tier. */
    isAtLeast: (required: PlanId) => planSatisfies(plan, required),
  };
}

interface UpsellCardProps {
  /** What's being unlocked (drives the rich benefit copy). */
  feature?: Feature;
  /** Plan we suggest upgrading to. */
  suggestedPlan?: PlanId | null;
  /** Optional overrides. */
  title?: string;
  description?: string;
}

/** Tasteful inline upsell shown when a user lacks access. */
export function UpsellCard({ feature, suggestedPlan, title, description }: UpsellCardProps) {
  const planName = suggestedPlan && suggestedPlan !== "free" ? PLAN_NAMES[suggestedPlan] : null;
  const upsell = feature ? FEATURE_UPSELL[feature] : undefined;
  const plan = suggestedPlan && suggestedPlan !== "free" ? getPlan(suggestedPlan) : undefined;
  const monthly = plan?.price?.monthly;

  const headline =
    title ?? upsell?.headline ?? (planName ? `Unlock with ${planName}` : "Upgrade to unlock this");
  const blurb =
    description ??
    upsell?.blurb ??
    (planName ? `This is part of ${planName}.` : "This feature is part of a paid plan.");

  return (
    <div className="pp-card mx-auto max-w-md p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-2xl">
        <span aria-hidden>🔒</span>
      </div>
      {planName && (
        <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-accent">
          {planName}
        </span>
      )}
      <h2 className="mt-3 text-lg font-extrabold text-primary">{headline}</h2>
      <p className="mt-2 text-sm text-secondary">{blurb}</p>

      {upsell && (
        <ul className="mx-auto mt-4 max-w-xs space-y-2 text-left text-sm text-primary">
          {upsell.bullets.map((b) => (
            <li key={b} className="flex gap-2">
              <span className="mt-0.5 text-accent" aria-hidden>
                ✓
              </span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}

      <Link to="/pricing" className="pp-btn-primary mt-6 w-full">
        {planName
          ? monthly != null
            ? `Upgrade to ${planName} — from ${formatUsd(monthly)}/mo`
            : `Upgrade to ${planName}`
          : "See plans"}
      </Link>
      <p className="mt-2 text-xs text-muted">Cancel anytime.</p>
    </div>
  );
}

interface RequirePlanProps {
  /** Gate by a specific feature (preferred). */
  feature?: Feature;
  /** Or gate by a minimum plan tier directly. */
  plan?: PlanId;
  /** Rendered when the user has access. */
  children: ReactNode;
  /** Optional custom fallback; defaults to <UpsellCard />. */
  fallback?: ReactNode;
  /** Optional override for the upsell copy. */
  upsellTitle?: string;
  upsellDescription?: string;
}

/**
 * Wrapper that renders `children` only when the user is entitled, otherwise an
 * upsell. Importable by the orchestrator to gate routes/sections — e.g.
 *
 *   <RequirePlan feature="mock_interview"><Session /></RequirePlan>
 *   <RequirePlan plan="pro"><Arena /></RequirePlan>
 */
export function RequirePlan({
  feature,
  plan,
  children,
  fallback,
  upsellTitle,
  upsellDescription,
}: RequirePlanProps) {
  const { has, isAtLeast } = useEntitlement();

  const allowed = feature ? has(feature) : plan ? isAtLeast(plan) : true;
  if (allowed) return <>{children}</>;
  if (fallback !== undefined) return <>{fallback}</>;

  const suggestedPlan = feature ? minimumPlanFor(feature) : plan ?? null;

  return (
    <UpsellCard
      feature={feature}
      title={upsellTitle}
      description={upsellDescription}
      suggestedPlan={suggestedPlan}
    />
  );
}
