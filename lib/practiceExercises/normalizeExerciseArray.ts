import type { Exercise } from '@/types';

/**
 * Gemini sometimes wraps the array in an object despite "JSON array only" instructions.
 * Accept common shapes so we don't throw away an otherwise usable response.
 */
export function normalizeExerciseArray(raw: unknown): Exercise[] | null {
  if (Array.isArray(raw)) {
    return raw.length > 0 ? (raw as Exercise[]) : null;
  }

  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    for (const key of ['exercises', 'data', 'items', 'practice'] as const) {
      const value = obj[key];
      if (Array.isArray(value) && value.length > 0) {
        return value as Exercise[];
      }
    }
  }

  return null;
}
