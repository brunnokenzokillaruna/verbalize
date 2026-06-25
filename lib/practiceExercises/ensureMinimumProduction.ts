import { callGeminiJSON } from '@/services/gemini';
import type { Exercise, SupportedLanguage } from '@/types';
import {
  ENFORCE_PRODUCTION_PER_LESSON,
  getTagExclusiveType,
  LANG_LABEL,
  PRACTICE_EXERCISE_COUNT,
  type ExerciseTypeId,
} from './constants';
import { buildTypeDescriptions } from './exerciseTypeDescriptions';
import {
  isProductionExerciseType,
  resolveRequiredProductionType,
  sessionHasProduction,
} from './productionTypes';
import { validateAndSanitizeExercises } from './validateGeneratedExercises';

export function findReplaceIndexForProduction(
  exercises: Exercise[],
  tagExclusive: ExerciseTypeId | null,
): number {
  const counts = new Map<string, number>();
  for (const ex of exercises) {
    counts.set(ex.type, (counts.get(ex.type) ?? 0) + 1);
  }

  let bestIdx = -1;
  let bestCount = 0;

  for (let i = 0; i < exercises.length; i++) {
    if (i === 0 && tagExclusive && exercises[i]?.type === tagExclusive) continue;
    if (isProductionExerciseType(exercises[i]!.type)) continue;

    const count = counts.get(exercises[i]!.type) ?? 0;
    if (count >= 2 && count > bestCount) {
      bestCount = count;
      bestIdx = i;
    }
  }

  if (bestIdx >= 0) return bestIdx;

  for (let i = exercises.length - 1; i >= 0; i--) {
    if (i === 0 && tagExclusive && exercises[i]?.type === tagExclusive) continue;
    if (!isProductionExerciseType(exercises[i]!.type)) return i;
  }

  return -1;
}

function buildSingleProductionPrompt(
  requiredType: ExerciseTypeId,
  language: SupportedLanguage,
  grammarFocus: string,
  theme: string,
  dialogue: string,
  newVocabulary: string[],
): string {
  const typeDesc = buildTypeDescriptions(LANG_LABEL[language])[requiredType];
  return `Generate EXACTLY ONE ${LANG_LABEL[language]} practice exercise as a JSON array with ONE object.

GRAMMAR FOCUS: ${grammarFocus}
THEME: ${theme}
DIALOGUE (reference only — do NOT copy sentences): "${dialogue.slice(0, 400)}"
Key vocabulary: ${newVocabulary.join(', ')}

The exercise MUST be type "${requiredType}".
${typeDesc}

Return ONLY a JSON array with one object: { "type": "${requiredType}", "data": { ... } }`;
}

function firstDialogueLine(dialogue: string): string {
  const line = dialogue.split('\n').find((l) => l.includes(':'));
  if (!line) return dialogue.slice(0, 80);
  return line.replace(/^[^:]+:\s*/, '').trim();
}

export function buildFallbackProductionExercise(
  requiredType: ExerciseTypeId,
  ctx: EnsureProductionContext,
): Exercise | null {
  const vocab = ctx.newVocabulary[0] ?? 'mot';
  const theme = ctx.theme || ctx.grammarFocus || 'lição';
  const line = firstDialogueLine(ctx.dialogue);

  switch (requiredType) {
    case 'word-bank-translation':
      return {
        type: 'word-bank-translation',
        data: {
          portuguese_sentence: `Traduza: ${theme}.`,
          words: [vocab, 'c\'est', 'un', 'le'],
          correctOrder: ['c\'est', 'un', vocab],
          hint: vocab,
        },
      };
    case 'reverse-translation':
      return {
        type: 'reverse-translation',
        data: {
          portuguese_sentence: `Diga em ${LANG_LABEL[ctx.language]} algo sobre: ${theme}.`,
          target_translation: line || vocab,
          acceptable_variants: [vocab],
        },
      };
    case 'speak-repeat':
      return {
        type: 'speak-repeat',
        data: {
          text: line || vocab,
          translation: theme,
        },
      };
    case 'audio-dictation':
      return {
        type: 'audio-dictation',
        data: {
          text: line || vocab,
          translation: theme,
        },
      };
    default:
      return null;
  }
}

export async function generateSingleProductionExercise(
  requiredType: ExerciseTypeId,
  allowedSet: Set<ExerciseTypeId>,
  language: SupportedLanguage,
  grammarFocus: string,
  theme: string,
  dialogue: string,
  newVocabulary: string[],
): Promise<Exercise | null> {
  const systemPrompt = `You are a language exercise generator. Respond with ONLY a valid JSON array of one exercise object.`;

  try {
    const prompt = buildSingleProductionPrompt(
      requiredType,
      language,
      grammarFocus,
      theme,
      dialogue,
      newVocabulary,
    );
    const result = await callGeminiJSON<Exercise[]>(prompt, systemPrompt, 2048, undefined, 'standard');
    if (!Array.isArray(result) || result.length === 0) return null;

    const validated = await validateAndSanitizeExercises(result, allowedSet, language);
    const match = validated.find((ex) => ex.type === requiredType);
    return match ?? validated[0] ?? null;
  } catch (err) {
    console.error('[ensureMinimumProduction] single-exercise generation failed:', err);
    return null;
  }
}

export interface EnsureProductionContext {
  level: import('@/types').ProficiencyLevel;
  vocabCount: number;
  tag: string;
  language: SupportedLanguage;
  grammarFocus: string;
  theme: string;
  dialogue: string;
  newVocabulary: string[];
  allowedTypes: ExerciseTypeId[];
  hasMic?: boolean;
}

export async function ensureMinimumProduction(
  exercises: Exercise[],
  ctx: EnsureProductionContext,
): Promise<Exercise[]> {
  if (!ENFORCE_PRODUCTION_PER_LESSON) return exercises;

  const allowedSet = new Set(ctx.allowedTypes);
  const requiredType = resolveRequiredProductionType(
    ctx.level,
    ctx.vocabCount,
    ctx.allowedTypes,
    ctx.hasMic ?? true,
  );

  if (!requiredType) return exercises;

  const hasRequired = exercises.some((ex) => ex.type === requiredType);
  if (hasRequired) return exercises;

  const tagExclusive = getTagExclusiveType(ctx.tag, ctx.level);
  const result = [...exercises];

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

  if (generated) {
    const replaceIdx = findReplaceIndexForProduction(result, tagExclusive);
    if (replaceIdx >= 0) {
      result[replaceIdx] = generated;
    } else if (result.length < PRACTICE_EXERCISE_COUNT) {
      result.push(generated);
    } else {
      result[result.length - 1] = generated;
    }
    return result;
  }

  console.warn(
    `[ensureMinimumProduction] Could not add required production type "${requiredType}" for tag ${ctx.tag}`,
  );
  return result;
}

export function buildProductionRetrySuffix(requiredType: ExerciseTypeId): string {
  return `

MANDATORY PRODUCTION RETRY: Your previous response did NOT include a "${requiredType}" exercise.
You MUST include EXACTLY ONE exercise of type "${requiredType}" in the array. This is non-negotiable.`;
}

export { sessionHasProduction, isProductionExerciseType };
