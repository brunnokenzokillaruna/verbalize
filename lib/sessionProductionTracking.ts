import { countsAsSpontaneousSessionAcceptance } from '@/lib/practiceExercises/productionTypes';
import type { ProductionStatKind } from '@/lib/practiceExercises/productionTypes';
import { useLessonStore } from '@/store/lessonStore';

/** Marks the current lesson session as having accepted spontaneous production. */
export function markSpontaneousProductionAccepted(
  statKind: ProductionStatKind,
  exerciseType?: string,
): void {
  if (!countsAsSpontaneousSessionAcceptance(statKind, exerciseType)) return;
  useLessonStore.getState().markSpontaneousProductionAccepted();
}
