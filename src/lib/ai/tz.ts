/**
 * The browser's timezone offset in minutes, using JS `getTimezoneOffset()`
 * semantics (positive for zones behind UTC, e.g. +300 for UTC-5). Sent with AI
 * requests so the server resets daily free-tier quotas at the user's LOCAL
 * midnight rather than UTC midnight.
 */
export function tzOffsetMinutes(): number {
  return new Date().getTimezoneOffset();
}
