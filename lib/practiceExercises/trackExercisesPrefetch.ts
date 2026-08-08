import { useLessonStore, type ExercisesPrefetchStatus } from '@/store/lessonStore';
import type { Exercise } from '@/types';

function statusFromResult(result: Exercise[] | null | undefined): ExercisesPrefetchStatus {
  return result && result.length > 0 ? 'ready' : 'empty';
}

/**
 * Marks exercises prefetch as pending, then ready/empty/error when the promise settles.
 * Always resolves (never rejects) so advanceFromGrammar can await safely.
 */
export function trackExercisesPrefetch(
  promise: Promise<Exercise[] | null>,
): Promise<Exercise[] | null> {
  useLessonStore.getState().setExercisesPrefetchStatus('pending');
  return promise.then(
    (result) => {
      useLessonStore.getState().setExercisesPrefetchStatus(statusFromResult(result));
      return result;
    },
    (err) => {
      console.error('[Prefetch] exercises error:', err);
      useLessonStore.getState().setExercisesPrefetchStatus('error');
      return null;
    },
  );
}

export function markExercisesPrefetchReady(exercises: Exercise[]): void {
  useLessonStore.getState().setExercisesPrefetchStatus(statusFromResult(exercises));
}
