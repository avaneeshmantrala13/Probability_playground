/**
 * Server mirror of src/lib/billing/compAccess.ts — emails granted full,
 * unlimited access regardless of billing (owner/admin comps). Keep in sync.
 */
const COMP_EMAILS = new Set<string>([
  "avaneesh.mantrala@alphaaiengineering.com",
]);

export function isCompAccessEmail(email: unknown): boolean {
  return typeof email === "string" && COMP_EMAILS.has(email.trim().toLowerCase());
}
