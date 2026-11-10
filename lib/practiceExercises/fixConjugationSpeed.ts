import { getVerbConjugation } from '@/app/actions/getVerbConjugation';
import { resolveVerbTenseKey } from '@/lib/verbs/tenseKeys';
import { extractVerbOnlyForm, stripPronounPrefix } from '@/utils/conjugationHelper';
import { sanitizeConjugationOptions } from '@/utils/verbDrillGenerator';
import type { ConjugationSpeedData, SupportedLanguage, VerbDocument } from '@/types';

function lookupTableForm(
  conjugations: VerbDocument['conjugations'],
  tenseKey: keyof VerbDocument['conjugations'],
  pronoun: string,
  language: SupportedLanguage,
): string | null {
  const forms = conjugations[tenseKey];
  if (!forms) return null;

  const pronounParts = pronoun.split(/[\/|]/).map((p) => p.trim().toLowerCase());
  for (const part of pronounParts) {
    for (const [p, form] of Object.entries(forms)) {
      if (p.toLowerCase().split(/[\/|]/).some((x) => x.trim() === part)) {
        return extractVerbOnlyForm(p, form, language);
      }
    }
  }
  return null;
}

/**
 * Surgical fix against the cached conjugation table.
 * Prefer ensureTableBackedConjugationSpeed for a full rebuild before validation.
 */
export async function fixConjugationSpeedExercise(
  data: ConjugationSpeedData,
  language: SupportedLanguage,
): Promise<ConjugationSpeedData | null> {
  let correctForm = stripPronounPrefix(data.correctForm, language, data.pronoun);
  let options = data.options.map((opt) => stripPronounPrefix(opt, language, data.pronoun));

  const verbDoc = await getVerbConjugation(data.verb, language);
  const tenseKey = resolveVerbTenseKey(data.tense);
  if (verbDoc?.conjugations && tenseKey) {
    const tableForm = lookupTableForm(verbDoc.conjugations, tenseKey, data.pronoun, language);
    if (tableForm) {
      const tableNorm = tableForm.toLowerCase();
      const claimedNorm = correctForm.toLowerCase();
      if (tableNorm !== claimedNorm) {
        console.warn(
          `[fixConjugationSpeed] Correcting ${data.verb}/${data.pronoun}: "${correctForm}" → "${tableForm}"`,
        );
        correctForm = tableForm;
        if (!options.some((o) => o.toLowerCase() === tableNorm)) {
          options = [tableForm, ...options.filter((o) => o.toLowerCase() !== claimedNorm)].slice(
            0,
            4,
          );
        } else {
          options = options.map((o) => (o.toLowerCase() === claimedNorm ? tableForm : o));
        }
      }
    }
  }

  let sanitized = sanitizeConjugationOptions(correctForm, options);
  if (sanitized) {
    return { ...data, correctForm, options: sanitized };
  }

  const extraPool = verbDoc?.conjugations
    ? Object.values(verbDoc.conjugations).flatMap((c) =>
        Object.entries(c || {}).map(([p, f]) => extractVerbOnlyForm(p, f, language)),
      )
    : [];

  sanitized = sanitizeConjugationOptions(correctForm, options, extraPool);
  if (!sanitized) return null;
  return { ...data, correctForm, options: sanitized };
}
