import type { SupportedLanguage, VerbDocument } from '@/types';

export type VerbTenseKey = keyof VerbDocument['conjugations'];

/** Bump when the stored tense set changes — invalidates Next `'use cache'` entries. */
export const VERB_TABLE_VERSION = 2;

/** Tenses we always try to keep on every cached verb (language-aware). */
export const CORE_TENSES_BY_LANG: Record<SupportedLanguage, readonly VerbTenseKey[]> = {
  fr: [
    'present',
    'past',
    'future',
    'imperfect',
    'conditional',
    'subjunctive',
    'pluperfect',
    'conditionalPast',
    'nearFuture',
  ],
  en: [
    'present',
    'past',
    'future',
    'conditional',
    'presentContinuous',
    'pastContinuous',
    'nearFuture',
  ],
};

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
  pluperfect: 'pluperfect',
  'plus-que-parfait': 'pluperfect',
  plusqueparfait: 'pluperfect',
  'mais-que-perfeito': 'pluperfect',
  'conditional past': 'conditionalPast',
  'conditionnel passe': 'conditionalPast',
  'condicional passado': 'conditionalPast',
  'near future': 'nearFuture',
  'futur proche': 'nearFuture',
  'futuro proximo': 'nearFuture',
  'going to': 'nearFuture',
  'going to future': 'nearFuture',
  'aller +': 'nearFuture',
  'present continuous': 'presentContinuous',
  'present progressive': 'presentContinuous',
  'presente continuo': 'presentContinuous',
  'past continuous': 'pastContinuous',
  'passado continuo': 'pastContinuous',
  'future perfect': 'futurePerfect',
  'futur anterieur': 'futurePerfect',
};

function normalizeTenseLabel(tense: string): string {
  return tense
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function hasVerbTense(
  conjugations: VerbDocument['conjugations'],
  key: VerbTenseKey,
): boolean {
  const forms = conjugations[key];
  return Boolean(forms && Object.keys(forms).length > 0);
}

/** Resolve a free-form tense label (PT-BR UI, EN/FR pedagogy) to a VerbDocument key. */
export function resolveVerbTenseKey(tense: string): VerbTenseKey | null {
  const key = normalizeTenseLabel(tense);
  if (TENSE_KEY_ALIASES[key]) return TENSE_KEY_ALIASES[key];

  // Longer aliases first so "conditionnel passe" wins over "conditionnel".
  const aliases = Object.entries(TENSE_KEY_ALIASES).sort((a, b) => b[0].length - a[0].length);
  for (const [alias, mapped] of aliases) {
    if (key.includes(alias)) return mapped;
  }
  return null;
}

/**
 * Map Grammar Bridge preview tense → VerbDocument key.
 * Returns null only for rare paradigms we still do not store (e.g. perfect continuous).
 */
export function mapPreviewTenseToVerbKey(
  previewTense: string,
  _language: SupportedLanguage,
): VerbTenseKey | null {
  const f = normalizeTenseLabel(previewTense);

  if (f.includes('present perfect continuous')) return null;
  if (f.includes('future continuous')) return null;

  return resolveVerbTenseKey(previewTense);
}

export function missingCoreTenses(
  conjugations: VerbDocument['conjugations'],
  language: SupportedLanguage,
  extra: readonly VerbTenseKey[] = [],
): VerbTenseKey[] {
  const wanted = new Set<VerbTenseKey>([...CORE_TENSES_BY_LANG[language], ...extra]);
  return [...wanted].filter((key) => !hasVerbTense(conjugations, key));
}

/**
 * Prefer an exact tense when present.
 * When allowFallback is false, never substitute another tense (avoids teaching présent in an imparfait lesson).
 */
export function pickAvailableTense(
  conjugations: VerbDocument['conjugations'],
  preferred: VerbTenseKey | null,
  opts: { allowFallback?: boolean } = {},
): VerbTenseKey | null {
  const allowFallback = opts.allowFallback ?? true;
  if (preferred && hasVerbTense(conjugations, preferred)) return preferred;
  if (!allowFallback) return null;

  const fallback: VerbTenseKey[] = [
    'present',
    'past',
    'future',
    'imperfect',
    'conditional',
    'subjunctive',
    'nearFuture',
    'presentContinuous',
    'pastContinuous',
    'pluperfect',
    'conditionalPast',
    'futurePerfect',
  ];
  for (const key of fallback) {
    if (hasVerbTense(conjugations, key)) return key;
  }
  const first = (Object.keys(conjugations) as VerbTenseKey[]).find((k) =>
    hasVerbTense(conjugations, k),
  );
  return first ?? null;
}
