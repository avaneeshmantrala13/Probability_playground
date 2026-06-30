/**
 * Complimentary (comped) accounts: specific emails that always get the highest
 * entitlement tier regardless of billing. Used so the owner can review every
 * paid page/feature at full quality without paying.
 *
 * Keep this list tiny and intentional — it bypasses all plan gating.
 */
const COMP_EMAILS = new Set<string>([
  "avaneesh.mantrala@alphaaiengineering.com",
]);

/** True when the email is granted full complimentary access. */
export function isCompAccessEmail(email: string | null | undefined): boolean {
  return typeof email === "string" && COMP_EMAILS.has(email.trim().toLowerCase());
}
