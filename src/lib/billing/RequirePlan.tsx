import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useProgress } from "../../context/ProgressContext";
import {
  effectivePlan,
  hasEntitlement,
  minimumPlanFor,
  planSatisfies,
  type PlanProgressLike,
} from "./entitlements";
import {
  FEATURE_LABELS,
  PLAN_NAMES,
  type Feature,
  type PlanId,
} from "./plans";

/**
 * Reads the user's effective plan from ProgressContext. The `plan` /
 * `planExpiresAt` fields are written only by the Stripe webhook (server side);
 * the client treats them as read-only. We read them defensively so this works
 * whether or not the orchestrator has added the fields to CourseProgress yet.
 */
export function useEntitlement() {
  const { progress } = useProgress();
  const planLike = progress as unknown as PlanProgressLike;
  const plan = effectivePlan(planLike);
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
  /** What's being unlocked (drives the headline). */
  title?: string;
  description?: string;
  /** Plan we suggest upgrading to. */
  suggestedPlan?: PlanId | null;
}

/** Tasteful inline upsell shown when a user lacks access. */
export function UpsellCard({ title, description, suggestedPlan }: UpsellCardProps) {
  const planName = suggestedPlan && suggestedPlan !== "free" ? PLAN_NAMES[suggestedPlan] : null;
  return (
    <div className="pp-card mx-auto max-w-md p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-2xl">
        <span aria-hidden>🔒</span>
      </div>
      <h2 className="text-lg font-extrabold text-primary">
        {title ?? "Upgrade to unlock this"}
      </h2>
      <p className="mt-2 text-sm text-secondary">
        {description ??
          (planName
            ? `This is part of ${planName}. Upgrade to keep going.`
            : "This feature is part of a paid plan.")}
      </p>
      <Link to="/pricing" className="pp-btn-primary mt-5 w-full">
        {planName ? `Upgrade to ${planName}` : "See plans"}
      </Link>
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
  const featureLabel = feature ? FEATURE_LABELS[feature] : undefined;

  return (
    <UpsellCard
      title={
        upsellTitle ??
        (featureLabel ? `Upgrade to unlock ${featureLabel.toLowerCase()}` : undefined)
      }
      description={upsellDescription}
      suggestedPlan={suggestedPlan}
    />
  );
}
