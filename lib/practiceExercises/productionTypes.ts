import type { ProficiencyLevel } from '@/types';
import type { ExerciseTypeId } from './constants';

export type ProductionTier = 'scaffolded' | 'oral_guided' | 'free_written';

/** All exercise types that count as learner production (not recognition-only). */
export const PRODUCTION_EXERCISE_TYPES: readonly ExerciseTypeId[] = [
  'reverse-translation',
  'word-bank-translation',
  'speak-repeat',
  'audio-dictation',
] as const;

export function isProductionExerciseType(type: string): type is ExerciseTypeId {
  return (PRODUCTION_EXERCISE_TYPES as readonly string[]).includes(type);
}

export function sessionHasProduction(exercises: { type: string }[]): boolean {
  return exercises.some((ex) => isProductionExerciseType(ex.type));
}

export function getProductionTier(
  requiredType: ExerciseTypeId,
): ProductionTier {
  if (requiredType === 'reverse-translation') return 'free_written';
  if (requiredType === 'speak-repeat' || requiredType === 'audio-dictation') {
    return 'oral_guided';
  }
  return 'scaffolded';
}

const A2_PLUS: ProficiencyLevel[] = ['A2', 'B1', 'B2', 'C1', 'C2'];

/**
 * Returns the mandatory production exercise type for a lesson, scaled by vocab and level.
 * - vocab < 15 → word-bank-translation
 * - vocab 15–29 + mic → speak-repeat; without mic → word-bank fallback
 * - vocab >= 30 or A2+ → reverse-translation (when tier allows)
 */
export function getRequiredProductionType(
  level: ProficiencyLevel,
  vocabCount: number,
  hasMic = true,
): ExerciseTypeId {
  const isA2Plus = A2_PLUS.includes(level);

  if (vocabCount >= 30 || isA2Plus) {
    return 'reverse-translation';
  }

  if (vocabCount >= 15) {
    return hasMic ? 'speak-repeat' : 'word-bank-translation';
  }

  return 'word-bank-translation';
}

/** Whether the required production type is allowed at the learner's current tier. */
export function isRequiredProductionAllowed(
  requiredType: ExerciseTypeId,
  allowedTypes: ExerciseTypeId[],
): boolean {
  return allowedTypes.includes(requiredType);
}

/** Pick a fallback production type when reverse-translation is not yet tier-eligible. */
export function getFallbackProductionType(
  allowedTypes: ExerciseTypeId[],
  hasMic = true,
): ExerciseTypeId | null {
  const order: ExerciseTypeId[] = hasMic
    ? ['reverse-translation', 'speak-repeat', 'word-bank-translation', 'audio-dictation']
    : ['reverse-translation', 'word-bank-translation', 'speak-repeat', 'audio-dictation'];

  for (const t of order) {
    if (allowedTypes.includes(t)) return t;
  }
  return null;
}

export function resolveRequiredProductionType(
  level: ProficiencyLevel,
  vocabCount: number,
  allowedTypes: ExerciseTypeId[],
  hasMic = true,
): ExerciseTypeId | null {
  const ideal = getRequiredProductionType(level, vocabCount, hasMic);
  if (allowedTypes.includes(ideal)) return ideal;
  return getFallbackProductionType(allowedTypes, hasMic);
}
