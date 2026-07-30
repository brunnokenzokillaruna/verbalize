import type { Exercise } from '@/types';
import {
  enforceVariety,
  pinProductionOrder,
  pinTagExclusiveFirst,
} from '@/utils/exerciseVariety';
import { applyAdaptiveTier } from './adaptiveTier';
import { applyExerciseChains } from './chainExercises';
import { PRACTICE_EXERCISE_COUNT, type ExerciseTypeId } from './constants';
import { ensureDualProduction } from './dualProduction';
import {
  ensureMinimumProduction,
  type EnsureProductionContext,
} from './ensureMinimumProduction';
import { resolveRequiredProductionType, sessionHasProduction } from './productionTypes';
import type { GeneratePracticeParams } from './types';
import { validateAndSanitizeExercises } from './validateGeneratedExercises';

/**
 * Post-processes Gemini output: validate → adaptive tier → variety → production → chains → order.
 */
export async function composePracticeSession(
  exercises: Exercise[],
  allowedSet: Set<ExerciseTypeId>,
  params: GeneratePracticeParams,
  tagExclusive: ExerciseTypeId | null,
): Promise<Exercise[]> {
  let result = await validateAndSanitizeExercises(exercises, allowedSet, params.language, {
    lessonVocabulary: params.newVocabulary,
    lessonDialogue: params.dialogue,
  });

  result = applyAdaptiveTier(result, params.masteredVocabulary ?? []);

  const requiredProduction = resolveRequiredProductionType(
    params.level,
    params.knownVocabulary.length,
    [...allowedSet],
  );

  result = pinTagExclusiveFirst(result, tagExclusive);
  result = enforceVariety(
    result,
    [...allowedSet] as ExerciseTypeId[],
    tagExclusive,
    PRACTICE_EXERCISE_COUNT,
    requiredProduction,
  );

  const ctx: EnsureProductionContext = {
    level: params.level,
    vocabCount: params.knownVocabulary.length,
    tag: params.tag,
    language: params.language,
    grammarFocus: params.grammarFocus,
    theme: params.theme ?? '',
    dialogue: params.dialogue,
    newVocabulary: params.newVocabulary,
    allowedTypes: [...allowedSet],
  };

  result = await ensureMinimumProduction(result, ctx);
  result = await ensureDualProduction(result, ctx);
  result = applyExerciseChains(result);

  if (requiredProduction) {
    result = pinProductionOrder(result, requiredProduction);
  }

  if (!sessionHasProduction(result)) {
    console.warn(
      `[composePracticeSession] Session lacks production exercise (tag=${params.tag}, level=${params.level})`,
    );
  }

  return result.slice(0, PRACTICE_EXERCISE_COUNT);
}
