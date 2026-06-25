import type { Exercise, LessonTag } from '@/types';
import {
  getTagExclusiveType,
  type ExerciseTypeId,
} from './constants';
import {
  sessionHasOralProduction,
  sessionHasWrittenProduction,
} from './productionTypes';
import {
  buildFallbackProductionExercise,
  findReplaceIndexForProduction,
  generateSingleProductionExercise,
  type EnsureProductionContext,
} from './ensureMinimumProduction';

const DUAL_PRODUCTION_TAGS: LessonTag[] = ['DIAL', 'MISS'];

export function tagRequiresDualProduction(tag: LessonTag): boolean {
  return DUAL_PRODUCTION_TAGS.includes(tag);
}

function pickOralType(allowed: ExerciseTypeId[]): ExerciseTypeId | null {
  const order: ExerciseTypeId[] = ['listen-and-respond', 'shadowing', 'speak-repeat'];
  for (const t of order) {
    if (allowed.includes(t)) return t;
  }
  return null;
}

function pickWrittenType(allowed: ExerciseTypeId[]): ExerciseTypeId | null {
  const order: ExerciseTypeId[] = [
    'reverse-translation',
    'paraphrase',
    'free-roleplay',
    'micro-message',
    'word-bank-translation',
    'fill-gap-production',
    'translation-with-constraint',
    'audio-dictation',
  ];
  for (const t of order) {
    if (allowed.includes(t)) return t;
  }
  return null;
}

async function injectProductionType(
  exercises: Exercise[],
  requiredType: ExerciseTypeId,
  ctx: EnsureProductionContext,
  allowedSet: Set<ExerciseTypeId>,
): Promise<Exercise[]> {
  if (exercises.some((ex) => ex.type === requiredType)) return exercises;

  let generated = buildFallbackProductionExercise(requiredType, ctx);
  if (!generated) {
    generated = await generateSingleProductionExercise(
      requiredType,
      allowedSet,
      ctx.language,
      ctx.grammarFocus,
      ctx.theme,
      ctx.dialogue,
      ctx.newVocabulary,
    );
  }
  if (!generated) return exercises;

  const result = [...exercises];
  const tagExclusive = getTagExclusiveType(ctx.tag, ctx.level);

  const replaceIdx = findReplaceIndexForProduction(result, tagExclusive as ExerciseTypeId | null);
  if (replaceIdx >= 0) {
    result[replaceIdx] = generated;
  } else {
    result[result.length - 1] = generated;
  }
  return result;
}

/**
 * DIAL/MISS sessions must include at least one oral and one written production exercise.
 */
export async function ensureDualProduction(
  exercises: Exercise[],
  ctx: EnsureProductionContext,
): Promise<Exercise[]> {
  if (!tagRequiresDualProduction(ctx.tag as LessonTag)) return exercises;

  const allowedSet = new Set(ctx.allowedTypes);
  let result = [...exercises];

  if (!sessionHasOralProduction(result)) {
    const oralType = pickOralType(ctx.allowedTypes);
    if (oralType) {
      result = await injectProductionType(result, oralType, ctx, allowedSet);
    }
  }

  if (!sessionHasWrittenProduction(result)) {
    const writtenType = pickWrittenType(ctx.allowedTypes);
    if (writtenType) {
      result = await injectProductionType(result, writtenType, ctx, allowedSet);
    }
  }

  return result;
}
