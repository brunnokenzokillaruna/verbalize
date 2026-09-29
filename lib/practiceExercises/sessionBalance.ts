import type { Exercise } from '@/types';

/** Types we no longer generate. Cached sessions drop them on the way in. */
export function stripRetiredExercises(exercises: Exercise[]): Exercise[] {
  return exercises.filter((exercise) => exercise.type !== 'shadowing');
}

/**
 * When two exercises train the same skill, keep the stronger one.
 * Production slots that disappear are refilled by ensureMinimumProduction / ensureDualProduction.
 */
export function dropOverlappingExercises(exercises: Exercise[]): Exercise[] {
  const types = new Set(exercises.map((exercise) => exercise.type));
  const drop = new Set<string>();

  if (types.has('listen-and-respond')) {
    drop.add('speak-repeat');
    drop.add('social-roleplay');
    drop.add('free-roleplay');
  }

  if (types.has('free-roleplay') || types.has('micro-message')) {
    drop.add('social-roleplay');
  }

  if (types.has('grammar-trap')) drop.add('bridge-choice');
  if (types.has('fill-gap-production')) drop.add('context-choice');
  if (types.has('audio-dictation')) drop.add('listen-and-select');

  if (drop.size === 0) return exercises;
  return exercises.filter((exercise) => !drop.has(exercise.type));
}
