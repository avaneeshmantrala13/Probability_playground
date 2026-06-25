/**
 * Firestore rejects `undefined` anywhere in a document (including nested objects).
 * Use before updateDoc/setDoc when writing client-built payloads.
 */
export function stripUndefined<T>(value: T): T {
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as T;
  }
  const out: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (nested !== undefined) {
      out[key] = stripUndefined(nested);
    }
  }
  return out as T;
}
