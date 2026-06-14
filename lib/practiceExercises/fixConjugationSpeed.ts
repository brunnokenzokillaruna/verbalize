import { getVerbConjugation } from '@/app/actions/getVerbConjugation';
import { extractVerbOnlyForm, stripPronounPrefix } from '@/utils/conjugationHelper';
import { sanitizeConjugationOptions } from '@/utils/verbDrillGenerator';
import type { ConjugationSpeedData, SupportedLanguage } from '@/types';

export async function fixConjugationSpeedExercise(
  data: ConjugationSpeedData,
  language: SupportedLanguage,
): Promise<ConjugationSpeedData | null> {
  const correctForm = stripPronounPrefix(data.correctForm, language, data.pronoun);
  const options = data.options.map((opt) => stripPronounPrefix(opt, language, data.pronoun));

  let sanitized = sanitizeConjugationOptions(correctForm, options);
  if (sanitized) {
    return { ...data, correctForm, options: sanitized };
  }

  const verbDoc = await getVerbConjugation(data.verb, language);
  const extraPool = verbDoc?.conjugations
    ? Object.values(verbDoc.conjugations).flatMap((c) =>
        Object.entries(c || {}).map(([p, f]) => extractVerbOnlyForm(p, f, language)),
      )
    : [];

  sanitized = sanitizeConjugationOptions(correctForm, options, extraPool);
  if (!sanitized) return null;
  return { ...data, correctForm, options: sanitized };
}
