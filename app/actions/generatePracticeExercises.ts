'use server';

import { callGeminiJSON } from '@/services/gemini';
import { enforceVariety, pinTagExclusiveFirst, varietyNeedsRegeneration } from '@/utils/exerciseVariety';
import type { Exercise } from '@/types';
import {
  getAllowedExerciseTypes,
  getTagExclusiveType,
  type ExerciseTypeId,
} from '@/lib/practiceExercises/constants';
import { buildPracticeExercisePrompt } from '@/lib/practiceExercises/promptBuilder';
import type { GeneratePracticeParams } from '@/lib/practiceExercises/types';
import { validateAndSanitizeExercises } from '@/lib/practiceExercises/validateGeneratedExercises';

export type { GeneratePracticeParams } from '@/lib/practiceExercises/types';

/**
 * Generates exactly 5 practice exercises via Gemini.
 * The types are chosen randomly and variedly from the available pool.
 *
 * IMPORTANT: Exercises create ORIGINAL sentences — never copying from the dialogue.
 * They use only vocabulary the user has already learned + the current lesson's new words.
 * Returns null on any error.
 */
export async function generatePracticeExercises(
  params: GeneratePracticeParams,
): Promise<Exercise[] | null> {
  const { tag, level, knownVocabulary, language } = params;

  const allowedTypes = getAllowedExerciseTypes(level, knownVocabulary.length);
  const allowedSet = new Set(allowedTypes);

  if (tag === 'GRAM') allowedSet.add('grammar-trap');
  if (tag === 'PRON') allowedSet.add('minimal-pair');
  if (tag === 'VERB') allowedSet.add('conjugation-speed');

  const tagExclusive = getTagExclusiveType(tag);

  try {
    const { systemPrompt, prompt } = buildPracticeExercisePrompt(params);
    const exercises = await callGeminiJSON<Exercise[]>(prompt, systemPrompt, 3072);

    if (!Array.isArray(exercises) || exercises.length < 3) {
      console.error('[generatePracticeExercises] Unexpected response shape or too few exercises');
      return null;
    }

    const dedupedValidated = await validateAndSanitizeExercises(exercises, allowedSet, language);

    let finalExercises = pinTagExclusiveFirst(dedupedValidated, tagExclusive);
    finalExercises = enforceVariety(
      finalExercises,
      [...allowedSet] as ExerciseTypeId[],
      tagExclusive,
    );

    if (varietyNeedsRegeneration(finalExercises) && finalExercises.length >= 3) {
      console.warn('[generatePracticeExercises] Variety insufficient after enforcement — returning best-effort set');
    }

    return finalExercises.length > 0 ? finalExercises : null;
  } catch (err) {
    console.error('[generatePracticeExercises] Error:', err);
    return null;
  }
}
