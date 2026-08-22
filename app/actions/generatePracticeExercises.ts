'use server';

import { callGeminiJSON } from '@/services/gemini';
import { varietyNeedsRegeneration } from '@/utils/exerciseVariety';
import type { Exercise } from '@/types';
import {
  getAllowedExerciseTypes,
  getTagExclusiveType,
  LANG_LABEL,
  PRACTICE_EXERCISE_COUNT,
  type ExerciseTypeId,
} from '@/lib/practiceExercises/constants';
import { buildPracticeExercisePrompt } from '@/lib/practiceExercises/promptBuilder';
import type { GeneratePracticeParams } from '@/lib/practiceExercises/types';
import { buildProductionRetrySuffix } from '@/lib/practiceExercises/ensureMinimumProduction';
import { resolveRequiredProductionType } from '@/lib/practiceExercises/productionTypes';
import { composePracticeSession } from '@/lib/practiceExercises/sessionComposition';
import { normalizeExerciseArray } from '@/lib/practiceExercises/normalizeExerciseArray';
import { validateAndSanitizeExercises } from '@/lib/practiceExercises/validateGeneratedExercises';
import { gateExerciseAnswerKeys } from '@/lib/practiceExercises/verifyAnswerKeys';
import { buildTypeDescriptions } from '@/lib/practiceExercises/exerciseTypeDescriptions';

const MAX_GENERATION_ATTEMPTS_LIVE = 2;

function buildRetrySuffix(attempt: number, allowedTypes: ExerciseTypeId[]): string {
  return `

RETRY NOTICE (attempt ${attempt}): Your previous response did not yield ${PRACTICE_EXERCISE_COUNT} valid exercises.
Generate EXACTLY ${PRACTICE_EXERCISE_COUNT} exercises. Use ONLY these types: ${allowedTypes.map((t) => `'${t}'`).join(', ')}.
Each exercise must be fully valid — incomplete or disallowed types will be discarded.`;
}

function buildTopUpPrompt(
  params: GeneratePracticeParams,
  missing: number,
  existing: Exercise[],
  preferredTypes: ExerciseTypeId[],
): string {
  const usedTypes = existing.map((ex) => ex.type);
  const typeDescriptions = buildTypeDescriptions(LANG_LABEL[params.language]);
  const typeBlock = preferredTypes
    .map((t) => `- ${typeDescriptions[t] ?? `type "${t}"`}`)
    .join('\n');

  return `Generate EXACTLY ${missing} additional ${LANG_LABEL[params.language]} practice exercise(s) as a JSON array.

LESSON THEME: ${params.theme ?? params.uiTitle ?? params.grammarFocus}
GRAMMAR FOCUS: ${params.grammarFocus}
DIALOGUE (reference only — do NOT copy sentences):
"${params.dialogue.slice(0, 500)}"
Key vocabulary: ${params.newVocabulary.join(', ')}

Already included types (do NOT repeat these): ${usedTypes.join(', ') || '(none)'}
Prefer these unused types:
${typeBlock}

Return ONLY a JSON array of ${missing} object(s), each with "type" and "data".`;
}

/**
 * Fills missing slots after validation dropped some of the main batch.
 * Failure is soft — callers keep the partial set.
 */
async function topUpPracticeExercises(
  existing: Exercise[],
  params: GeneratePracticeParams,
  allowedSet: Set<ExerciseTypeId>,
): Promise<Exercise[]> {
  const missing = PRACTICE_EXERCISE_COUNT - existing.length;
  if (missing <= 0) return existing;

  const used = new Set(existing.map((ex) => ex.type));
  const preferred = ([...allowedSet] as ExerciseTypeId[]).filter((t) => !used.has(t));
  const pool = preferred.length > 0 ? preferred : ([...allowedSet] as ExerciseTypeId[]);
  if (pool.length === 0) return existing;

  const systemPrompt = `You are a language exercise generator for Brazilian Portuguese speakers learning ${LANG_LABEL[params.language]}. Respond with ONLY a valid JSON array, no markdown.`;
  const prompt = buildTopUpPrompt(params, missing, existing, pool.slice(0, Math.max(missing + 3, 4)));

  try {
    const raw = await callGeminiJSON<unknown>(prompt, systemPrompt, 2048, undefined, 'standard');
    const candidates = normalizeExerciseArray(raw);
    if (!candidates) {
      console.warn('[generatePracticeExercises] Top-up returned no usable exercises');
      return existing;
    }

    let extras = await validateAndSanitizeExercises(candidates, allowedSet, params.language, {
      lessonVocabulary: params.newVocabulary,
      lessonDialogue: params.dialogue,
    });
    extras = await gateExerciseAnswerKeys(extras, params.language);

    if (extras.length === 0) {
      console.warn('[generatePracticeExercises] Top-up exercises failed validation');
      return existing;
    }

    const merged = [...existing];
    for (const ex of extras) {
      if (merged.length >= PRACTICE_EXERCISE_COUNT) break;
      merged.push(ex);
    }

    console.warn(
      `[generatePracticeExercises] Top-up added ${merged.length - existing.length}/${missing} exercise(s) (now ${merged.length}/${PRACTICE_EXERCISE_COUNT})`,
    );
    return merged;
  } catch (err) {
    console.warn('[generatePracticeExercises] Top-up failed — keeping partial set:', err);
    return existing;
  }
}

/**
 * Generates practice exercises via Gemini (target: 5).
 * The types are chosen randomly and variedly from the available pool.
 *
 * IMPORTANT: Exercises create ORIGINAL sentences — never copying from the dialogue.
 * They use only vocabulary the user has already learned + the current lesson's new words.
 *
 * Returns a partial valid set when Gemini/validation cannot reach 5 (still better than
 * falling back to visual-only drills). Returns null only when nothing usable survived.
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

      const raw = await callGeminiJSON<unknown>(prompt, systemPrompt, 3072, undefined, 'standard');
      const exercises = normalizeExerciseArray(raw);

      if (!exercises) {
        console.warn(
          `[generatePracticeExercises] Attempt ${attempt}: expected an exercise array, got ${Array.isArray(raw) ? `array(${raw.length})` : typeof raw}`,
        );
        continue;
      }

      if (exercises.length < PRACTICE_EXERCISE_COUNT) {
        console.warn(
          `[generatePracticeExercises] Attempt ${attempt}: got ${exercises.length}/${PRACTICE_EXERCISE_COUNT} raw exercises — composing what we have`,
        );
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

    if (bestEffort.length === 0) {
      console.error(
        `[generatePracticeExercises] Failed to produce any exercises after ${attemptLimit} attempts`,
      );
      return null;
    }

    if (bestEffort.length < PRACTICE_EXERCISE_COUNT) {
      bestEffort = await topUpPracticeExercises(bestEffort, params, allowedSet);
    }

    if (bestEffort.length < PRACTICE_EXERCISE_COUNT) {
      console.warn(
        `[generatePracticeExercises] Returning partial set of ${bestEffort.length}/${PRACTICE_EXERCISE_COUNT} after ${attemptLimit} attempts`,
      );
    }

    return bestEffort;
  } catch (err) {
    console.error('[generatePracticeExercises] Error:', err);
    return null;
  }
}
