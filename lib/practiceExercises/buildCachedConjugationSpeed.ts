import { getVerbConjugation } from '@/app/actions/getVerbConjugation';
import { resolveConjugationPreviewTense } from '@/lib/grammarBridge/usagePedagogy';
import { mapPreviewTenseToVerbKey, pickAvailableTense } from '@/lib/verbs/tenseKeys';
import { generateLocalDrill, SPRINT_TENSE_KEYS } from '@/utils/verbDrillGenerator';
import type {
  ConjugationSpeedData,
  Exercise,
  SupportedLanguage,
} from '@/types';
import type { GeneratePracticeParams } from './types';

/**
 * Build a conjugation-speed item entirely from the cached VerbDocument table.
 */
export async function buildLessonConjugationSpeed(
  verb: string,
  language: SupportedLanguage,
  grammarFocus?: string,
): Promise<ConjugationSpeedData | null> {
  const clean = verb.trim();
  if (!clean) return null;

  const verbDoc = await getVerbConjugation(clean, language);
  if (!verbDoc?.conjugations) return null;

  const preferred = grammarFocus
    ? mapPreviewTenseToVerbKey(resolveConjugationPreviewTense(grammarFocus, language))
    : null;
  // Prefer the lesson tense; if still missing after cache upgrade, fall back for the drill.
  const tenseKey =
    pickAvailableTense(verbDoc.conjugations, preferred, { allowFallback: false }) ??
    pickAvailableTense(verbDoc.conjugations, null);

  try {
    return generateLocalDrill(verbDoc, {
      preferredTense: tenseKey ?? undefined,
      allowedTenses: tenseKey ? [tenseKey] : SPRINT_TENSE_KEYS,
    });
  } catch (err) {
    console.warn('[buildLessonConjugationSpeed] Failed to build drill:', err);
    return null;
  }
}

/**
 * Replace (or inject) conjugation-speed with a table-backed drill so lesson practice
 * never teaches Gemini-invented conjugations when the cache is available.
 */
export async function ensureTableBackedConjugationSpeed(
  exercises: Exercise[],
  params: GeneratePracticeParams,
): Promise<Exercise[]> {
  const hasSpeed = exercises.some((e) => e.type === 'conjugation-speed');
  const needs = params.tag === 'VERB' || hasSpeed;
  if (!needs) return exercises;

  const fromGemini = exercises.find((e) => e.type === 'conjugation-speed');
  const geminiVerb =
    fromGemini && fromGemini.type === 'conjugation-speed'
      ? (fromGemini.data as ConjugationSpeedData).verb
      : '';
  const verb = params.verbWord?.trim() || geminiVerb;
  if (!verb) return exercises;

  const built = await buildLessonConjugationSpeed(verb, params.language, params.grammarFocus);
  if (!built) return exercises;

  const without = exercises.filter((e) => e.type !== 'conjugation-speed');
  return [{ type: 'conjugation-speed', data: built }, ...without];
}
