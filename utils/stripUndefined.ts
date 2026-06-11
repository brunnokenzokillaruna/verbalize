function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

/**
 * Removes `undefined` values recursively so objects are safe for Firestore writes.
 * Preserves `null`, arrays, Dates, Timestamps, and Firestore FieldValue sentinels.
 */
export function stripUndefinedDeep<T>(value: T): T {
  if (value === undefined || value === null) return value;
  if (typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => stripUndefinedDeep(item)) as T;
  }

  if (!isPlainObject(value)) return value;

  const result: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    if (nested !== undefined) {
      result[key] = stripUndefinedDeep(nested);
    }
  }
  return result as T;
}
