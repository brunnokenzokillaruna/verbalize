import type { ProficiencyLevel } from '@/types';
import type { ExerciseTypeId } from './constants';

/** Pedagogical production tier for an exercise type. */
export type ProductionTier =
  | 'scaffolded'
  | 'oral_echo'
  | 'oral_guided'
  | 'oral_spontaneous'
  | 'free_written'
  | 'free_pragmatic';

/** Firestore production stat bucket. */
export type ProductionStatKind = 'oral' | 'oralSpontaneous' | 'freeWrite';

export const SCAFFOLDED_PRODUCTION_TYPES = ['word-bank-translation'] as const satisfies readonly ExerciseTypeId[];

export const ORAL_ECHO_TYPES = ['speak-repeat', 'minimal-pair-production', 'shadowing'] as const satisfies readonly ExerciseTypeId[];

export const ORAL_PRODUCTION_TYPES = ['listen-and-respond', 'prompted-monologue', 'speak-repeat', 'minimal-pair-production', 'shadowing'] as const satisfies readonly ExerciseTypeId[];

export const ORAL_SPONTANEOUS_TYPES = ['listen-and-respond', 'prompted-monologue'] as const satisfies readonly ExerciseTypeId[];

export const WRITTEN_PRODUCTION_TYPES = [
  'reverse-translation',
  'free-roleplay',
  'micro-message',
  'word-bank-translation',
  'audio-dictation',
  'paraphrase',
  'fill-gap-production',
  'translation-with-constraint',
  'voicemail-dictation',
  'connected-speech',
  'story-continuation',
  'spot-the-register',
] as const satisfies readonly ExerciseTypeId[];

export const FREE_WRITTEN_PRODUCTION_TYPES = [
  'reverse-translation',
  'audio-dictation',
  'paraphrase',
  'fill-gap-production',
  'translation-with-constraint',
  'voicemail-dictation',
  'connected-speech',
  'story-continuation',
  'spot-the-register',
] as const satisfies readonly ExerciseTypeId[];

export const FREE_PRAGMATIC_PRODUCTION_TYPES = [
  'free-roleplay',
  'micro-message',
] as const satisfies readonly ExerciseTypeId[];

/** All exercise types that count as learner production (not recognition-only). */
export const PRODUCTION_EXERCISE_TYPES: readonly ExerciseTypeId[] = [
  ...SCAFFOLDED_PRODUCTION_TYPES,
  ...ORAL_ECHO_TYPES,
  ...ORAL_SPONTANEOUS_TYPES,
  ...FREE_WRITTEN_PRODUCTION_TYPES,
  ...FREE_PRAGMATIC_PRODUCTION_TYPES,
] as const;

/** Types registered in schema; all are now in tier pools when eligible. */
export const PLANNED_PRODUCTION_TYPES: readonly ExerciseTypeId[] = [];

export function isProductionExerciseType(type: string): type is ExerciseTypeId {
  return (PRODUCTION_EXERCISE_TYPES as readonly string[]).includes(type);
}

export function isOralEchoExerciseType(type: string): boolean {
  return (ORAL_ECHO_TYPES as readonly string[]).includes(type);
}

export function isOralSpontaneousExerciseType(type: string): boolean {
  return (ORAL_SPONTANEOUS_TYPES as readonly string[]).includes(type);
}

export function sessionHasProduction(exercises: { type: string }[]): boolean {
  return exercises.some((ex) => isProductionExerciseType(ex.type));
}

export function sessionHasOralProduction(exercises: { type: string }[]): boolean {
  return exercises.some((ex) =>
    (ORAL_PRODUCTION_TYPES as readonly string[]).includes(ex.type),
  );
}

export function sessionHasWrittenProduction(exercises: { type: string }[]): boolean {
  return exercises.some((ex) =>
    (WRITTEN_PRODUCTION_TYPES as readonly string[]).includes(ex.type),
  );
}

export function sessionHasSpontaneousProduction(exercises: { type: string }[]): boolean {
  return exercises.some(
    (ex) =>
      isOralSpontaneousExerciseType(ex.type) ||
      (FREE_PRAGMATIC_PRODUCTION_TYPES as readonly string[]).includes(ex.type) ||
      ex.type === 'reverse-translation',
  );
}

/** Whether an accepted production attempt counts toward the spontaneous-session metric. */
export function countsAsSpontaneousSessionAcceptance(
  statKind: ProductionStatKind,
  exerciseType?: string,
): boolean {
  if (statKind === 'oralSpontaneous') return true;
  if (!exerciseType || statKind !== 'freeWrite') return false;
  return (
    (FREE_PRAGMATIC_PRODUCTION_TYPES as readonly string[]).includes(exerciseType) ||
    exerciseType === 'story-continuation' ||
    exerciseType === 'spot-the-register'
  );
}

export function getProductionTier(requiredType: ExerciseTypeId): ProductionTier {
  if (requiredType === 'reverse-translation' || requiredType === 'audio-dictation') {
    return requiredType === 'reverse-translation' ? 'free_written' : 'oral_guided';
  }
  if (requiredType === 'paraphrase' || requiredType === 'fill-gap-production' || requiredType === 'translation-with-constraint' || requiredType === 'voicemail-dictation' || requiredType === 'connected-speech' || requiredType === 'story-continuation' || requiredType === 'spot-the-register') {
    return 'free_written';
  }
  if (requiredType === 'micro-message') return 'free_pragmatic';
  if (requiredType === 'free-roleplay') return 'free_pragmatic';
  if (requiredType === 'listen-and-respond' || requiredType === 'prompted-monologue') return 'oral_spontaneous';
  if (requiredType === 'speak-repeat' || requiredType === 'minimal-pair-production' || requiredType === 'shadowing') return 'oral_echo';
  return 'scaffolded';
}

export function getProductionStatKind(exerciseType: ExerciseTypeId): ProductionStatKind {
  if (isOralSpontaneousExerciseType(exerciseType)) {
    return 'oralSpontaneous';
  }
  if (
    exerciseType === 'reverse-translation' ||
    exerciseType === 'micro-message' ||
    exerciseType === 'free-roleplay' ||
    exerciseType === 'word-bank-translation' ||
    exerciseType === 'paraphrase' ||
    exerciseType === 'fill-gap-production' ||
    exerciseType === 'translation-with-constraint' ||
    exerciseType === 'voicemail-dictation' ||
    exerciseType === 'connected-speech' ||
    exerciseType === 'story-continuation' ||
    exerciseType === 'spot-the-register'
  ) {
    return 'freeWrite';
  }
  return 'oral';
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

  if (level === 'A2' && vocabCount >= 20) {
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
