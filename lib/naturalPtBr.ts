/**
 * Keeps Brazilian-Portuguese output in the register learners actually speak.
 * Left alone, Gemini reaches for dictionary-accurate but unused words — it
 * translated "le terrain semble être en friche" as "o terreno pareça estar em
 * pousio", a farming term no Brazilian uses in conversation.
 */

/** Full rule block, for prompts where a few extra tokens do not matter. */
export const NATURAL_PT_BR_RULE = `- PORTUGUÊS DO DIA A DIA (OBRIGATÓRIO): use a palavra que um brasileiro fala numa conversa normal. Se o equivalente exato for raro, técnico, literário ou de Portugal, escreva uma expressão comum, mesmo que fique um pouco mais longa.
- Exemplos: "terrain en friche" → "terreno abandonado" (NUNCA "em pousio"); "gazon" → "gramado" (não "relvado"); "telemóvel" → "celular"; "autocarro" → "ônibus"; "outrora" → "antigamente".
- Teste antes de escrever: se um brasileiro teria que procurar a palavra no dicionário, ela está proibida.`;

/** Single-line version for the latency-sensitive fast-path prompt. */
export const NATURAL_PT_BR_RULE_COMPACT =
  'PT-BR do dia a dia: nunca use palavra rara, técnica, literária ou de Portugal ("em pousio", "relvado", "telemóvel"). Prefira o termo comum ("abandonado", "gramado", "celular"), mesmo que fique mais longo.';

/**
 * Correct Portuguese that is effectively absent from Brazilian everyday speech.
 *
 * Two invariants keep this from corrupting sentences it rewrites:
 *  1. The replacement must be a drop-in substitute for the WHOLE matched phrase.
 *     Prepositional uses are therefore listed with their preposition
 *     ("em pousio" → "abandonado"); "pousio" → "sem uso" alone would yield
 *     "estar em sem uso".
 *  2. The replacement must keep the gender and number of the phrase it replaces,
 *     because the surrounding article is not rewritten. This rules out
 *     "casa de banho" → "banheiro" ("a banheiro") and "ecrã" → "tela".
 *
 * Also excluded: words that mean something else in Brazil (comboio = convoy,
 * frigorífico = meat plant, miúdos = giblets). Rewriting those would introduce
 * errors instead of removing them. Whatever this table cannot handle safely is
 * left to the prompt rules above.
 */
const EVERYDAY_PT_BR_REPLACEMENTS: ReadonlyArray<readonly [string, string]> = [
  // Technical / literary register
  ['em pousio', 'abandonado'],
  ['pousio', 'terreno abandonado'],
  ['outrora', 'antigamente'],
  ['doravante', 'a partir de agora'],
  ['amiúde', 'com frequência'],
  ['supracitado', 'citado acima'],
  // European Portuguese
  ['telemóvel', 'celular'],
  ['telemóveis', 'celulares'],
  ['autocarro', 'ônibus'],
  ['autocarros', 'ônibus'],
  ['rapariga', 'garota'],
  ['raparigas', 'garotas'],
  ['talho', 'açougue'],
  ['boleia', 'carona'],
  ['pequeno-almoço', 'café da manhã'],
  ['pequeno almoço', 'café da manhã'],
  ['pastilha elástica', 'goma de mascar'],
  ['relvado', 'gramado'],
  ['relva', 'grama'],
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Longest phrases first so "em pousio" wins over "pousio". */
const COMPILED_REPLACEMENTS = [...EVERYDAY_PT_BR_REPLACEMENTS]
  .sort((a, b) => b[0].length - a[0].length)
  .map(([phrase, replacement]) => ({
    phrase,
    replacement,
    // Leading capture instead of a lookbehind keeps this usable in any runtime.
    pattern: new RegExp(
      `(^|[^\\p{L}\\p{N}])(${escapeRegExp(phrase)})(?![\\p{L}\\p{N}])`,
      'giu',
    ),
  }));

function matchLeadingCase(source: string, replacement: string): string {
  const first = source[0] ?? '';
  const isUpper = first === first.toUpperCase() && first !== first.toLowerCase();
  return isUpper ? `${replacement[0]?.toUpperCase() ?? ''}${replacement.slice(1)}` : replacement;
}

/**
 * Swaps known non-everyday words for their Brazilian equivalents. Prompts do
 * most of the work; this is the deterministic net for the cases that slip past.
 */
export function normalizeToEverydayPtBr(text: string): string {
  if (!text.trim()) return text;

  const replaced = new Set<string>();
  let result = text;
  for (const { phrase, replacement, pattern } of COMPILED_REPLACEMENTS) {
    result = result.replace(pattern, (_full, prefix: string, matched: string) => {
      replaced.add(phrase);
      return `${prefix}${matchLeadingCase(matched, replacement)}`;
    });
  }

  if (replaced.size > 0) {
    console.warn(
      `[naturalPtBr] Rewrote words Brazilians do not use: ${[...replaced].join(', ')}`,
    );
  }
  return result;
}

export function normalizeToEverydayPtBrOptional(
  text: string | undefined,
): string | undefined {
  return text === undefined ? undefined : normalizeToEverydayPtBr(text);
}

/** Learner-visible PT-BR fields of a generated hook. */
interface NormalizableHook {
  dialogueTranslations?: string[];
  curiosidade?: string;
  vocabTranslations?: Record<string, { translation?: string; explanation?: string }>;
  newChunks?: Array<{ translation: string }>;
  rolePlayConsequences?: Array<{ alternateTranslation?: string }>;
}

/**
 * Cleans a hook that was generated before these rules existed. Lessons are
 * pre-generated and cached, so fixing only the generation path would leave the
 * learner's next lesson still saying "em pousio".
 */
export function normalizeHookPtBr<T extends NormalizableHook>(hook: T): T {
  // Only present keys are rebuilt — adding `undefined` values would break a
  // later Firestore write of the same object.
  const patch: NormalizableHook = {};

  if (hook.dialogueTranslations) {
    patch.dialogueTranslations = hook.dialogueTranslations.map(normalizeToEverydayPtBr);
  }
  if (hook.curiosidade !== undefined) {
    patch.curiosidade = normalizeToEverydayPtBr(hook.curiosidade);
  }
  if (hook.vocabTranslations) {
    patch.vocabTranslations = Object.fromEntries(
      Object.entries(hook.vocabTranslations).map(([word, entry]) => [
        word,
        {
          ...entry,
          ...(entry.translation !== undefined && {
            translation: normalizeToEverydayPtBr(entry.translation),
          }),
          ...(entry.explanation !== undefined && {
            explanation: normalizeToEverydayPtBr(entry.explanation),
          }),
        },
      ]),
    );
  }
  if (hook.newChunks) {
    patch.newChunks = hook.newChunks.map((chunk) => ({
      ...chunk,
      translation: normalizeToEverydayPtBr(chunk.translation),
    }));
  }
  if (hook.rolePlayConsequences) {
    patch.rolePlayConsequences = hook.rolePlayConsequences.map((consequence) => ({
      ...consequence,
      ...(consequence.alternateTranslation !== undefined && {
        alternateTranslation: normalizeToEverydayPtBr(consequence.alternateTranslation),
      }),
    }));
  }

  return { ...hook, ...patch };
}
