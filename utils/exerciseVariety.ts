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
): Exercise[] {
  if (exercises.length === 0) return exercises;

  let result = pinTagExclusiveFirst(exercises, tagExclusive);

  // Drop duplicates beyond MAX_SAME_TYPE (never drop index 0 if tag-exclusive)
  const typeCounts = new Map<ExerciseType, number>();
  result = result.filter((ex, i) => {
    const count = typeCounts.get(ex.type) ?? 0;
    if (count >= MAX_SAME_TYPE) return false;
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
    if ((counts.get(ex.type) ?? 0) > MAX_SAME_TYPE) {
      result.splice(i, 1);
      counts.set(ex.type, (counts.get(ex.type) ?? 1) - 1);
    }
  }

  return result;
}

export function varietyNeedsRegeneration(exercises: Exercise[]): boolean {
  return !hasValidVariety(exercises);
}
