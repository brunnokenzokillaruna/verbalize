import type { SupportedLanguage, VerbDocument } from '@/types';

export type VerbTenseKey = keyof VerbDocument['conjugations'];

/** Map normalized (lowercase, no accents) tense labels → VerbDocument keys. */
const TENSE_KEY_ALIASES: Record<string, VerbTenseKey> = {
  present: 'present',
  presente: 'present',
  'present simple': 'present',
  past: 'past',
  passado: 'past',
  'passe compose': 'past',
  'simple past': 'past',
  'past simple': 'past',
  'present perfect': 'past',
  future: 'future',
  futuro: 'future',
  'futur simple': 'future',
  'will future': 'future',
  'simple future': 'future',
  conditional: 'conditional',
  condicional: 'conditional',
  conditionnel: 'conditional',
  'conditionnel present': 'conditional',
  imperfect: 'imperfect',
  imperfeito: 'imperfect',
  imparfait: 'imperfect',
  subjunctive: 'subjunctive',
  subjuntivo: 'subjunctive',
  subjonctif: 'subjunctive',
  'subjonctif present': 'subjunctive',
};

function normalizeTenseLabel(tense: string): string {
  return tense
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Resolve a free-form tense label (PT-BR UI, EN/FR pedagogy) to a VerbDocument key. */
export function resolveVerbTenseKey(tense: string): VerbTenseKey | null {
  const key = normalizeTenseLabel(tense);
  if (TENSE_KEY_ALIASES[key]) return TENSE_KEY_ALIASES[key];

  for (const [alias, mapped] of Object.entries(TENSE_KEY_ALIASES)) {
    if (key.includes(alias)) return mapped;
  }
  return null;
}

/**
 * Map Grammar Bridge preview tense (from resolveConjugationPreviewTense) → VerbDocument key.
 * Returns null for compound/periphrastic tenses we do not store as full tables yet.
 */
export function mapPreviewTenseToVerbKey(
  previewTense: string,
  _language: SupportedLanguage,
): VerbTenseKey | null {
  const f = normalizeTenseLabel(previewTense);

  if (f.includes('plus-que-parfait') || f.includes('plusqueparfait')) return null;
  if (f.includes('futur anterieur')) return null;
  if (f.includes('futur proche') || f.includes('aller +') || f.includes('going to')) return null;
  if (f.includes('conditionnel passe')) return null;
  if (
    f.includes('past continuous') ||
    f.includes('present continuous') ||
    f.includes('present progressive')
  ) {
    return null;
  }
  if (f.includes('present perfect continuous')) return null;

  return resolveVerbTenseKey(previewTense);
}

/** Prefer an exact tense when present; otherwise fall back to present → past → first available. */
export function pickAvailableTense(
  conjugations: VerbDocument['conjugations'],
  preferred: VerbTenseKey | null,
): VerbTenseKey | null {
  if (preferred && conjugations[preferred] && Object.keys(conjugations[preferred]!).length > 0) {
    return preferred;
  }
  const fallback: VerbTenseKey[] = [
    'present',
    'past',
    'future',
    'imperfect',
    'conditional',
    'subjunctive',
  ];
  for (const key of fallback) {
    if (conjugations[key] && Object.keys(conjugations[key]!).length > 0) return key;
  }
  const first = (Object.keys(conjugations) as VerbTenseKey[]).find(
    (k) => conjugations[k] && Object.keys(conjugations[k]!).length > 0,
  );
  return first ?? null;
}
