import { getVerbConjugation } from '@/app/actions/getVerbConjugation';
import { extractVerbOnlyForm, stripPronounPrefix } from '@/utils/conjugationHelper';
import { sanitizeConjugationOptions } from '@/utils/verbDrillGenerator';
import type { ConjugationSpeedData, SupportedLanguage, VerbDocument } from '@/types';

/** Map PT-BR / informal tense labels → VerbDocument keys. */
const TENSE_KEY_ALIASES: Record<string, keyof VerbDocument['conjugations']> = {
  present: 'present',
  presente: 'present',
  past: 'past',
  passado: 'past',
  'passe compose': 'past',
  'passé composé': 'past',
  future: 'future',
  futuro: 'future',
  conditional: 'conditional',
  condicional: 'conditional',
  imperfect: 'imperfect',
  imperfeito: 'imperfect',
  imparfait: 'imperfect',
  subjunctive: 'subjunctive',
  subjuntivo: 'subjunctive',
  subjonctif: 'subjunctive',
};

function resolveTenseKey(tense: string): keyof VerbDocument['conjugations'] | null {
  const key = tense
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  return TENSE_KEY_ALIASES[key] ?? null;
}

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

export async function fixConjugationSpeedExercise(
  data: ConjugationSpeedData,
  language: SupportedLanguage,
): Promise<ConjugationSpeedData | null> {
  let correctForm = stripPronounPrefix(data.correctForm, language, data.pronoun);
  let options = data.options.map((opt) => stripPronounPrefix(opt, language, data.pronoun));

  // Prefer authoritative table form when available — never teach a wrong conjugation.
  const verbDoc = await getVerbConjugation(data.verb, language);
  const tenseKey = resolveTenseKey(data.tense);
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
          options = [tableForm, ...options.filter((o) => o.toLowerCase() !== claimedNorm)].slice(0, 4);
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
