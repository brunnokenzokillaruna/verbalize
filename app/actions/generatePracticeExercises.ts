'use server';

import { callGeminiJSON } from '@/services/gemini';
import { varietyNeedsRegeneration } from '@/utils/exerciseVariety';
import type { Exercise } from '@/types';
import {
  getAllowedExerciseTypes,
  getTagExclusiveType,
  PRACTICE_EXERCISE_COUNT,
  type ExerciseTypeId,
} from '@/lib/practiceExercises/constants';
import { buildPracticeExercisePrompt } from '@/lib/practiceExercises/promptBuilder';
import type { GeneratePracticeParams } from '@/lib/practiceExercises/types';
import { buildProductionRetrySuffix } from '@/lib/practiceExercises/ensureMinimumProduction';
import { resolveRequiredProductionType } from '@/lib/practiceExercises/productionTypes';
import { composePracticeSession } from '@/lib/practiceExercises/sessionComposition';

const MAX_GENERATION_ATTEMPTS_LIVE = 2;

function buildRetrySuffix(attempt: number, allowedTypes: ExerciseTypeId[]): string {
  return `

RETRY NOTICE (attempt ${attempt}): Your previous response did not yield ${PRACTICE_EXERCISE_COUNT} valid exercises.
Generate EXACTLY ${PRACTICE_EXERCISE_COUNT} exercises. Use ONLY these types: ${allowedTypes.map((t) => `'${t}'`).join(', ')}.
Each exercise must be fully valid — incomplete or disallowed types will be discarded.`;
}

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
  const { tag, level, knownVocabulary, maxAttempts } = params;
  const attemptLimit = maxAttempts ?? MAX_GENERATION_ATTEMPTS_LIVE;

  const allowedTypes = getAllowedExerciseTypes(level, knownVocabulary.length, tag);
  const allowedSet = new Set(allowedTypes);

  if (tag === 'GRAM') allowedSet.add('grammar-trap');
  if (tag === 'PRON') {
    allowedSet.add('minimal-pair');
    if (['A2', 'B1', 'B2', 'C1', 'C2'].includes(level)) {
      allowedSet.add('minimal-pair-production');
    }
  }
  if (tag === 'VERB') allowedSet.add('conjugation-speed');

  const tagExclusive = getTagExclusiveType(tag, level);
  const requiredProduction = resolveRequiredProductionType(
    level,
    knownVocabulary.length,
    [...allowedSet],
  );
  const { systemPrompt, prompt: basePrompt } = buildPracticeExercisePrompt(params);

  try {
    let bestEffort: Exercise[] = [];

    for (let attempt = 1; attempt <= attemptLimit; attempt++) {
      let prompt = attempt === 1
        ? basePrompt
        : basePrompt + buildRetrySuffix(attempt, [...allowedSet] as ExerciseTypeId[]);

      if (attempt >= 2 && requiredProduction) {
        prompt += buildProductionRetrySuffix(requiredProduction);
      }

      const exercises = await callGeminiJSON<Exercise[]>(prompt, systemPrompt, 3072, undefined, 'standard');

      if (!Array.isArray(exercises) || exercises.length < PRACTICE_EXERCISE_COUNT) {
        console.warn(
          `[generatePracticeExercises] Attempt ${attempt}: expected ${PRACTICE_EXERCISE_COUNT} exercises, got ${Array.isArray(exercises) ? exercises.length : 'invalid'}`,
        );
        continue;
      }

      const finalExercises = await composePracticeSession(
        exercises,
        allowedSet,
        params,
        tagExclusive,
      );

      if (finalExercises.length > bestEffort.length) {
        bestEffort = finalExercises;
      }

      if (finalExercises.length >= PRACTICE_EXERCISE_COUNT) {
        if (varietyNeedsRegeneration(finalExercises)) {
          console.warn('[generatePracticeExercises] Variety insufficient after enforcement — returning set anyway');
        }
        return finalExercises;
      }

      console.warn(
        `[generatePracticeExercises] Attempt ${attempt}: only ${finalExercises.length} exercises passed validation`,
      );
    }

    if (bestEffort.length >= PRACTICE_EXERCISE_COUNT) {
      return bestEffort;
    }

    console.error(
      `[generatePracticeExercises] Failed to produce ${PRACTICE_EXERCISE_COUNT} exercises after ${attemptLimit} attempts (best: ${bestEffort.length})`,
    );
    return null;
  } catch (err) {
    console.error('[generatePracticeExercises] Error:', err);
    return null;
  }
}
