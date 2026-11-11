import type { SupportedLanguage, VerbDocument } from '@/types';
import type { VerbTenseKey } from './tenseKeys';
import { VERB_TABLE_VERSION } from './tenseKeys';

const LANG_LABEL: Record<SupportedLanguage, string> = {
  fr: 'French',
  en: 'English',
};

function pronounBlock(language: SupportedLanguage): string {
  return language === 'fr'
    ? `"je": "form", "tu": "form", "il": "form", "elle": "form", "on": "form", "nous": "form", "vous": "form", "ils": "form", "elles": "form"`
    : `"I": "form", "you": "form", "he": "form", "she": "form", "it": "form", "we": "form", "they": "form"`;
}

const TENSE_HINT: Record<VerbTenseKey, { fr: string; en: string }> = {
  present: { fr: 'présent', en: 'present simple' },
  past: { fr: 'passé composé (e.g. je suis allé / j\'ai parlé)', en: 'simple past' },
  future: { fr: 'futur simple', en: 'will future' },
  imperfect: { fr: 'imparfait', en: 'past habitual / used to (simple forms OK)' },
  conditional: { fr: 'conditionnel présent', en: 'would + verb' },
  subjunctive: { fr: 'subjonctif présent', en: 'omit unless essential' },
  pluperfect: { fr: 'plus-que-parfait', en: 'past perfect (had + PP)' },
  conditionalPast: { fr: 'conditionnel passé', en: 'would have + PP' },
  nearFuture: { fr: 'futur proche (aller + infinitif)', en: 'going to + infinitive' },
  presentContinuous: { fr: 'omit for French', en: 'present continuous (am/is/are + -ing)' },
  pastContinuous: { fr: 'omit for French', en: 'past continuous (was/were + -ing)' },
  futurePerfect: { fr: 'futur antérieur', en: 'will have + PP' },
};

function tenseExampleSchema(language: SupportedLanguage, keys: VerbTenseKey[]): string {
  return keys
    .map((key) => {
      const hint = TENSE_HINT[key][language];
      return `    "${key}": { "target": "One short ${LANG_LABEL[language]} sentence using ${hint}", "portuguese": "Tradução em português brasileiro" }`;
    })
    .join(',\n');
}

export function buildFullVerbTablePrompt(
  infinitive: string,
  language: SupportedLanguage,
): { systemPrompt: string; prompt: string } {
  const pronouns = pronounBlock(language);
  const systemPrompt = `You are a language expert creating verb conjugation data for Brazilian Portuguese speakers learning ${LANG_LABEL[language]}. Respond with ONLY valid JSON, no markdown, no explanation.`;

  const frKeys: VerbTenseKey[] = [
    'present',
    'past',
    'future',
    'imperfect',
    'conditional',
    'subjunctive',
    'pluperfect',
    'conditionalPast',
    'nearFuture',
    'futurePerfect',
  ];
  const enKeys: VerbTenseKey[] = [
    'present',
    'past',
    'future',
    'conditional',
    'presentContinuous',
    'pastContinuous',
    'nearFuture',
  ];
  const keys = language === 'fr' ? frKeys : enKeys;

  const tenseLines =
    language === 'fr'
      ? `    "present": { ${pronouns} },
    "past": { ${pronouns} },
    "future": { ${pronouns} },
    "imperfect": { ${pronouns} },
    "conditional": { ${pronouns} },
    "subjunctive": { ${pronouns} },
    "pluperfect": { ${pronouns} },
    "conditionalPast": { ${pronouns} },
    "nearFuture": { ${pronouns} },
    "futurePerfect": { ${pronouns} }`
      : `    "present": { ${pronouns} },
    "past": { ${pronouns} },
    "future": { ${pronouns} },
    "conditional": { ${pronouns} },
    "presentContinuous": { ${pronouns} },
    "pastContinuous": { ${pronouns} },
    "nearFuture": { ${pronouns} }`;

  const prompt = `Generate complete conjugation data for the ${LANG_LABEL[language]} verb "${infinitive}".

Output JSON in exactly this format:
{
  "infinitive": "${infinitive}",
  "language": "${language}",
  "translation": "Portuguese translation of the verb (infinitive form)",
  "tableVersion": ${VERB_TABLE_VERSION},
  "conjugations": {
${tenseLines}
  },
  "tenseExamples": {
${tenseExampleSchema(language, keys)}
  },
  "exampleSentences": [
    { "target": "Example sentence in ${LANG_LABEL[language]}", "portuguese": "Translation in Brazilian Portuguese" },
    { "target": "Another example", "portuguese": "Outra tradução" }
  ]
}

Rules:
${
  language === 'fr'
    ? `- Use exactly the separate pronouns je, tu, il, elle, on, nous, vous, ils, elles. Do NOT group them.
- past = passé composé; imperfect = imparfait; nearFuture = aller + infinitif; pluperfect = plus-que-parfait; conditionalPast = conditionnel passé; futurePerfect = futur antérieur.`
    : `- Use exactly the separate pronouns I, you, he, she, it, we, they. Do NOT group them.
- past = simple past; nearFuture = going to + verb; presentContinuous / pastContinuous = progressive forms.`
}
- Include every tense key shown above with ALL pronouns filled.
- tenseExamples: one sentence PER tense key. The sentence MUST clearly use that tense of "${infinitive}" (not another tense). Keep A1–B1 vocabulary.
- Keep exampleSentences simple (A1-B1 vocabulary) — general usage, any tense.
- "translation" must be the Brazilian Portuguese infinitive (e.g., "ser/estar" for "être").`;

  return { systemPrompt, prompt };
}

export function buildMissingTensesPrompt(
  infinitive: string,
  language: SupportedLanguage,
  missing: VerbTenseKey[],
): { systemPrompt: string; prompt: string } {
  const pronouns = pronounBlock(language);
  const systemPrompt = `You are a language expert filling missing verb conjugations for Brazilian Portuguese speakers learning ${LANG_LABEL[language]}. Respond with ONLY valid JSON, no markdown.`;

  const blocks = missing
    .map((key) => {
      const hint = TENSE_HINT[key][language];
      return `    "${key}": { ${pronouns} }  /* ${hint} */`;
    })
    .join(',\n');

  const prompt = `Fill ONLY these missing conjugation tenses for the ${LANG_LABEL[language]} verb "${infinitive}".

Output JSON:
{
  "conjugations": {
${blocks}
  },
  "tenseExamples": {
${tenseExampleSchema(language, missing)}
  }
}

Rules:
${
  language === 'fr'
    ? `- Pronouns must be exactly: je, tu, il, elle, on, nous, vous, ils, elles (never grouped).`
    : `- Pronouns must be exactly: I, you, he, she, it, we, they (never grouped).`
}
- Every listed tense key must include ALL pronouns with correct forms.
- tenseExamples: one sentence per listed tense; must use that tense of "${infinitive}".
- Do not invent extra tense keys.`;

  return { systemPrompt, prompt };
}

/** Fill only missing per-tense example sentences (no conjugations). */
export function buildMissingTenseExamplesPrompt(
  infinitive: string,
  language: SupportedLanguage,
  missing: VerbTenseKey[],
): { systemPrompt: string; prompt: string } {
  const systemPrompt = `You are a language expert writing short contextual examples for Brazilian Portuguese speakers learning ${LANG_LABEL[language]}. Respond with ONLY valid JSON, no markdown.`;

  const prompt = `For the ${LANG_LABEL[language]} verb "${infinitive}", write ONE short example sentence for each tense below.

Output JSON:
{
  "tenseExamples": {
${tenseExampleSchema(language, missing)}
  }
}

Rules:
- Each sentence MUST use the named tense of "${infinitive}" (not another tense).
- A1–B1 vocabulary; one clause is enough.
- portuguese = natural Brazilian Portuguese translation.
- Do not invent extra tense keys.`;

  return { systemPrompt, prompt };
}

export function mergeVerbConjugations(
  base: VerbDocument['conjugations'],
  patch: Partial<VerbDocument['conjugations']> | undefined,
): VerbDocument['conjugations'] {
  if (!patch) return base;
  const next: VerbDocument['conjugations'] = { ...base };
  for (const [rawKey, forms] of Object.entries(patch)) {
    const key = rawKey as VerbTenseKey;
    if (!forms || Object.keys(forms).length === 0) continue;
    next[key] = forms;
  }
  return next;
}

export type TenseExamplesPayload = Partial<
  Record<VerbTenseKey, { target: string; portuguese: string }>
>;

export function extractTenseExamples(
  payload: { tenseExamples?: TenseExamplesPayload; tenseGuides?: VerbDocument['tenseGuides'] } | null | undefined,
): TenseExamplesPayload | undefined {
  if (!payload) return undefined;
  if (payload.tenseExamples && Object.keys(payload.tenseExamples).length > 0) {
    return payload.tenseExamples;
  }
  if (!payload.tenseGuides) return undefined;
  const fromGuides: TenseExamplesPayload = {};
  for (const [key, guide] of Object.entries(payload.tenseGuides)) {
    if (guide?.example?.target && guide.example.portuguese) {
      fromGuides[key as VerbTenseKey] = guide.example;
    }
  }
  return Object.keys(fromGuides).length > 0 ? fromGuides : undefined;
}
