import type { Exercise } from '@/types';
import { PRACTICE_EXERCISE_COUNT } from './constants';

/** Image-match is appended later as its own block and must not count as an AI exercise. */
export function withoutImageMatch(exercises: Exercise[]): Exercise[] {
  return exercises.filter((ex) => ex.type !== 'image-match');
}

/** Prefer a full live set; otherwise keep whichever source has more exercises. */
export function preferRicherExerciseSet(
  primary: Exercise[] | null | undefined,
  fallback: Exercise[] | null | undefined,
): Exercise[] | null {
  const primaryCount = primary?.length ?? 0;
  const fallbackCount = fallback?.length ?? 0;
  if (primaryCount >= PRACTICE_EXERCISE_COUNT) return primary ?? null;
  if (fallbackCount > primaryCount) return fallback ?? null;
  return primary ?? null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Returns the AI practice block (target: 5).
 * A null, empty, or short first result is refetched so the session is not
 * assembled from visual drills alone.
 */
export async function resolveAiPracticeExercises(
  initial: Exercise[] | null | undefined,
  refetch: () => Promise<Exercise[] | null>,
  options?: { maxRefetches?: number; retryDelayMs?: number },
): Promise<Exercise[]> {
  const maxRefetches = options?.maxRefetches ?? 2;
  const retryDelayMs = options?.retryDelayMs ?? 800;

  let best = withoutImageMatch(initial ?? []).slice(0, PRACTICE_EXERCISE_COUNT);

  for (let attempt = 0; best.length < PRACTICE_EXERCISE_COUNT && attempt < maxRefetches; attempt++) {
    if (retryDelayMs > 0) await sleep(retryDelayMs);
    try {
      const next = withoutImageMatch((await refetch()) ?? []);
      if (next.length > best.length) {
        best = next.slice(0, PRACTICE_EXERCISE_COUNT);
      }
    } catch (err) {
      console.warn('[resolveAiPracticeExercises] refetch failed:', err);
    }
  }

  return best;
}
