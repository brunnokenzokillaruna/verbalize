import { PRACTICE_EXERCISE_COUNT } from '@/lib/practiceExercises/constants';
import { isProductionExerciseType } from '@/lib/practiceExercises/productionTypes';
import type { Exercise, ExerciseType } from '@/types';

const TAG_EXCLUSIVE_TYPES: ExerciseType[] = [
  'grammar-trap',
  'minimal-pair',
  'conjugation-speed',
];

const MIN_DISTINCT_TYPES = 3;
const MAX_SAME_TYPE = 2;

function countByType(exercises: Exercise[]): Map<ExerciseType, number> {
  const counts = new Map<ExerciseType, number>();
  for (const ex of exercises) {
    counts.set(ex.type, (counts.get(ex.type) ?? 0) + 1);
  }
  return counts;
}

function hasValidVariety(exercises: Exercise[]): boolean {
  if (exercises.length === 0) return true;
  const counts = countByType(exercises);
  if (counts.size < Math.min(MIN_DISTINCT_TYPES, exercises.length)) return false;
  for (const count of counts.values()) {
    if (count > MAX_SAME_TYPE) return false;
  }
  return true;
}

/** Ensures the sole production exercise is not dropped during variety enforcement. */
export function protectProductionSlot(
  exercises: Exercise[],
  requiredType: ExerciseType | null,
): Exercise[] {
  if (!requiredType || exercises.length === 0) return exercises;

  const productionIndices = exercises
    .map((ex, i) => (ex.type === requiredType || isProductionExerciseType(ex.type) ? i : -1))
    .filter((i) => i >= 0);

  if (productionIndices.length !== 1) return exercises;

  return exercises;
}

/** Move production exercise to last slot (after receptive drills). */
export function pinProductionLast(
  exercises: Exercise[],
  productionType: ExerciseType | null,
): Exercise[] {
  if (!productionType || exercises.length <= 1) return exercises;

  const idx = exercises.findIndex((ex) => ex.type === productionType);
  if (idx <= 0 || idx === exercises.length - 1) return exercises;

  const result = [...exercises];
  const [production] = result.splice(idx, 1);
  result.push(production);
  return result;
}

/** Ensures tag-exclusive exercise stays at index 0. */
export function pinTagExclusiveFirst(
  exercises: Exercise[],
  tagExclusive: ExerciseType | null,
): Exercise[] {
  if (!tagExclusive) return exercises;
  const idx = exercises.findIndex((ex) => ex.type === tagExclusive);
  if (idx <= 0) return exercises;
  const result = [...exercises];
  const [exclusive] = result.splice(idx, 1);
  result.unshift(exclusive);
  return result;
}

/**
 * Drops excess duplicates (keeping first occurrences) until max 2 per type
 * and at least MIN_DISTINCT_TYPES distinct types when possible.
 */
export function enforceVariety(
  exercises: Exercise[],
  allowedTypes: ExerciseType[],
  tagExclusive: ExerciseType | null = null,
  minCount = PRACTICE_EXERCISE_COUNT,
  protectedProductionType: ExerciseType | null = null,
): Exercise[] {
  if (exercises.length === 0) return exercises;

  let result = pinTagExclusiveFirst(exercises, tagExclusive);

  if (result.length < minCount) {
    return result;
  }

  const typeCounts = new Map<ExerciseType, number>();
  result = result.filter((ex, i) => {
    const count = typeCounts.get(ex.type) ?? 0;
    if (count >= MAX_SAME_TYPE) {
      if (
        protectedProductionType &&
        ex.type === protectedProductionType &&
        result.filter((e) => e.type === protectedProductionType).length === 1
      ) {
        typeCounts.set(ex.type, count + 1);
        return true;
      }
      return false;
    }
    if (i === 0 && tagExclusive && ex.type === tagExclusive) {
      typeCounts.set(ex.type, count + 1);
      return true;
    }
    typeCounts.set(ex.type, count + 1);
    return true;
  });

  if (hasValidVariety(result)) return result;

  // Try swapping duplicate slots with unused allowed types (placeholder-free: drop dupes)
  const usedTypes = new Set(result.map((ex) => ex.type));
  const unusedTypes = allowedTypes.filter(
    (t) => !usedTypes.has(t) && !TAG_EXCLUSIVE_TYPES.includes(t),
  );

  const counts = countByType(result);
  for (let i = result.length - 1; i >= 0 && unusedTypes.length > 0; i--) {
    const ex = result[i];
    if (i === 0 && tagExclusive && ex.type === tagExclusive) continue;
    if ((counts.get(ex.type) ?? 0) > MAX_SAME_TYPE && result.length > minCount) {
      result.splice(i, 1);
      counts.set(ex.type, (counts.get(ex.type) ?? 1) - 1);
    }
  }

  return result;
}

export function varietyNeedsRegeneration(exercises: Exercise[]): boolean {
  return !hasValidVariety(exercises);
}
