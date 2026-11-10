import type { HookResult, LessonTag, ProficiencyLevel, SupportedLanguage } from '@/types';

/**
 * Spoken French “sound native” phrases — piggybacked into Hook / Practice / SRS chunks.
 * Not a daily checklist: learners meet 1–2 per lesson in context, then review via SRS.
 */

export type NativePhraseFunction =
  | 'greeting'
  | 'agreement'
  | 'reaction'
  | 'hedging'
  | 'connector'
  | 'courtesy'
  | 'state'
  | 'closing';

export type NativePhrase = {
  phrase: string;
  translationPt: string;
  fn: NativePhraseFunction;
  /** Earliest CEFR where the phrase is fair game in prompts. */
  minLevel: ProficiencyLevel;
};

const LEVEL_RANK: Record<ProficiencyLevel, number> = {
  A1: 0,
  A2: 1,
  B1: 2,
  B2: 3,
  C1: 4,
  C2: 5,
};

/** Curated from high-frequency spoken French (informal / everyday). */
export const NATIVE_FRENCH_PHRASES: readonly NativePhrase[] = [
  // Greeting / check-in
  { phrase: 'Ça va ?', translationPt: 'E aí? / Tudo bem?', fn: 'greeting', minLevel: 'A1' },
  { phrase: 'Quoi de neuf ?', translationPt: 'E aí, novidade?', fn: 'greeting', minLevel: 'A2' },
  { phrase: 'Ça fait longtemps !', translationPt: 'Faz tempo!', fn: 'greeting', minLevel: 'A2' },
  { phrase: 'Tu fais quoi ?', translationPt: 'Tá fazendo o quê?', fn: 'greeting', minLevel: 'A1' },

  // Agreement / go-ahead
  { phrase: 'Ça marche !', translationPt: 'Fechado! / Combinado!', fn: 'agreement', minLevel: 'A1' },
  { phrase: "D'accord.", translationPt: 'Beleza. / Ok.', fn: 'agreement', minLevel: 'A1' },
  { phrase: 'Pas de souci.', translationPt: 'Sem problema.', fn: 'agreement', minLevel: 'A1' },
  { phrase: "T'inquiète !", translationPt: 'Relaxa! / Sem drama!', fn: 'agreement', minLevel: 'A2' },
  { phrase: 'Avec plaisir !', translationPt: 'Com prazer!', fn: 'courtesy', minLevel: 'A1' },
  { phrase: "Vas-y !", translationPt: 'Manda ver! / Pode ir!', fn: 'agreement', minLevel: 'A1' },
  { phrase: 'Allez !', translationPt: 'Vamos! / Anda!', fn: 'agreement', minLevel: 'A1' },
  { phrase: 'Pourquoi pas ?', translationPt: 'Por que não?', fn: 'agreement', minLevel: 'A2' },
  { phrase: 'Ça me dit bien !', translationPt: 'Eu topo!', fn: 'agreement', minLevel: 'A2' },

  // Reactions
  { phrase: 'Ah bon ?', translationPt: 'Sério? / É mesmo?', fn: 'reaction', minLevel: 'A1' },
  { phrase: "C'est vrai ?", translationPt: 'É verdade?', fn: 'reaction', minLevel: 'A1' },
  { phrase: "Tu m'étonnes !", translationPt: 'Nem me fala! / Imagina!', fn: 'reaction', minLevel: 'A2' },
  { phrase: 'Carrément !', translationPt: 'Com certeza! / Demais!', fn: 'reaction', minLevel: 'A2' },
  { phrase: "C'est clair !", translationPt: 'Óbvio!', fn: 'reaction', minLevel: 'A2' },
  { phrase: 'Tout à fait.', translationPt: 'Exatamente.', fn: 'reaction', minLevel: 'A2' },
  { phrase: 'Pas du tout !', translationPt: 'De jeito nenhum!', fn: 'reaction', minLevel: 'A1' },
  { phrase: 'Bah oui !', translationPt: 'Ué, claro!', fn: 'reaction', minLevel: 'A2' },
  { phrase: 'Bah non !', translationPt: 'Ué, não!', fn: 'reaction', minLevel: 'A2' },
  { phrase: 'Ben voilà !', translationPt: 'Pronto! / Tá vendo?', fn: 'reaction', minLevel: 'A2' },
  { phrase: 'Je vois.', translationPt: 'Entendi.', fn: 'reaction', minLevel: 'A1' },
  { phrase: "C'est gentil !", translationPt: 'Que legal da sua parte!', fn: 'courtesy', minLevel: 'A1' },
  { phrase: "C'est nickel !", translationPt: 'Tá perfeito!', fn: 'reaction', minLevel: 'A2' },
  { phrase: "C'est top !", translationPt: 'Muito top!', fn: 'reaction', minLevel: 'A2' },
  { phrase: 'Dis donc !', translationPt: 'Nossa! / Olha só!', fn: 'reaction', minLevel: 'A2' },

  // Hedging / soft no
  { phrase: 'Je sais pas.', translationPt: 'Não sei.', fn: 'hedging', minLevel: 'A1' },
  { phrase: 'Aucune idée.', translationPt: 'Nenhuma ideia.', fn: 'hedging', minLevel: 'A2' },
  { phrase: 'Ça dépend.', translationPt: 'Depende.', fn: 'hedging', minLevel: 'A2' },
  { phrase: 'On verra.', translationPt: 'A gente vê.', fn: 'hedging', minLevel: 'A2' },
  { phrase: "C'est pas grave.", translationPt: 'Não tem problema.', fn: 'hedging', minLevel: 'A1' },
  { phrase: 'Tant pis !', translationPt: 'Que pena / paciência!', fn: 'hedging', minLevel: 'A2' },
  { phrase: 'Tant mieux !', translationPt: 'Ainda bem!', fn: 'reaction', minLevel: 'A2' },
  { phrase: "C'est dommage.", translationPt: 'Que pena.', fn: 'hedging', minLevel: 'A2' },
  { phrase: 'Laisse tomber.', translationPt: 'Deixa pra lá.', fn: 'hedging', minLevel: 'A2' },
  { phrase: "Ça m'est égal.", translationPt: 'Tanto faz.', fn: 'hedging', minLevel: 'A2' },

  // Connectors (spoken glue)
  { phrase: 'À mon avis...', translationPt: 'Na minha opinião...', fn: 'connector', minLevel: 'A2' },
  { phrase: 'En fait...', translationPt: 'Na verdade...', fn: 'connector', minLevel: 'A2' },
  { phrase: 'Du coup...', translationPt: 'Aí / então...', fn: 'connector', minLevel: 'A2' },
  { phrase: 'Bref...', translationPt: 'Enfim...', fn: 'connector', minLevel: 'A2' },

  // States
  { phrase: "J'en ai marre !", translationPt: 'Tô de saco cheio!', fn: 'state', minLevel: 'A2' },
  { phrase: "J'ai la flemme.", translationPt: 'Tô com preguiça.', fn: 'state', minLevel: 'A2' },
  { phrase: "J'ai un petit creux.", translationPt: 'Tô com uma fominha.', fn: 'state', minLevel: 'A2' },
  { phrase: 'Je suis crevé(e).', translationPt: 'Tô morto(a) de cansaço.', fn: 'state', minLevel: 'A2' },
  { phrase: 'Ça vaut le coup.', translationPt: 'Vale a pena.', fn: 'reaction', minLevel: 'A2' },

  // Closings
  { phrase: 'À tout à l\'heure !', translationPt: 'Até daqui a pouco!', fn: 'closing', minLevel: 'A1' },
  { phrase: 'À plus !', translationPt: 'Até mais!', fn: 'closing', minLevel: 'A1' },
  { phrase: "Je t'en prie.", translationPt: 'De nada. / Imagina.', fn: 'courtesy', minLevel: 'A2' },
] as const;

const CONVERSATIONAL_TAGS: ReadonlySet<LessonTag> = new Set([
  'DIAL',
  'EXPR',
  'MISS',
  'CULT',
]);

function normalizePhraseKey(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[…]/g, '...')
    .replace(/\s+/g, ' ');
}

const PHRASE_BY_KEY = new Map(
  NATIVE_FRENCH_PHRASES.map((p) => [normalizePhraseKey(p.phrase), p] as const),
);

export function isNativeFrenchPhrase(text: string | undefined | null): boolean {
  if (!text?.trim()) return false;
  return PHRASE_BY_KEY.has(normalizePhraseKey(text));
}

export function getNativeFrenchPhrase(text: string): NativePhrase | undefined {
  return PHRASE_BY_KEY.get(normalizePhraseKey(text));
}

function levelAllowed(phrase: NativePhrase, level: ProficiencyLevel): boolean {
  return LEVEL_RANK[level] >= LEVEL_RANK[phrase.minLevel];
}

function themeHints(theme: string, grammarFocus: string, uiTitle?: string): NativePhraseFunction[] {
  const blob = `${theme} ${grammarFocus} ${uiTitle ?? ''}`.toLowerCase();
  const fns: NativePhraseFunction[] = ['reaction', 'agreement'];

  if (/cumpriment|saudação|saudacao|ça va|comment ça|bonjour|meeting|rede|social/.test(blob)) {
    fns.unshift('greeting', 'courtesy');
  }
  if (/opini|avis|pense|trouve|persu|debate|conect/.test(blob)) {
    fns.unshift('connector', 'hedging');
  }
  if (/cansa|fome|flemme|estado|fim de semana|weekend|miss|miss[aã]o|urg/.test(blob)) {
    fns.unshift('state', 'hedging');
  }
  if (/despedi|à plus|tchau|até|close|partir/.test(blob)) {
    fns.unshift('closing');
  }
  if (/reação|reacao|nativ|informal|argot|express/.test(blob)) {
    fns.unshift('reaction', 'agreement', 'connector');
  }

  return [...new Set(fns)];
}

/** Stable-ish pick of phrases for a lesson prompt (max ~6). */
export function pickNativePhrasesForLesson(params: {
  language: SupportedLanguage;
  level: ProficiencyLevel;
  tag: LessonTag;
  theme?: string;
  grammarFocus?: string;
  uiTitle?: string;
  limit?: number;
}): NativePhrase[] {
  if (params.language !== 'fr' || !CONVERSATIONAL_TAGS.has(params.tag)) return [];

  const limit = params.limit ?? 6;
  const preferredFns = themeHints(
    params.theme ?? '',
    params.grammarFocus ?? '',
    params.uiTitle,
  );
  const pool = NATIVE_FRENCH_PHRASES.filter((p) => levelAllowed(p, params.level));

  const ranked = [...pool].sort((a, b) => {
    const aScore = preferredFns.indexOf(a.fn);
    const bScore = preferredFns.indexOf(b.fn);
    const aRank = aScore === -1 ? 99 : aScore;
    const bRank = bScore === -1 ? 99 : bScore;
    if (aRank !== bRank) return aRank - bRank;
    return a.phrase.localeCompare(b.phrase, 'fr');
  });

  const picked: NativePhrase[] = [];
  const seenFn = new Set<NativePhraseFunction>();

  // Prefer diversity of functions first
  for (const phrase of ranked) {
    if (picked.length >= limit) break;
    if (seenFn.has(phrase.fn) && picked.length < Math.min(4, limit)) continue;
    seenFn.add(phrase.fn);
    picked.push(phrase);
  }

  for (const phrase of ranked) {
    if (picked.length >= limit) break;
    if (picked.some((p) => p.phrase === phrase.phrase)) continue;
    picked.push(phrase);
  }

  return picked.slice(0, limit);
}

/** Find bank phrases that actually appear in dialogue text. */
export function findNativePhrasesInText(dialogue: string): NativePhrase[] {
  if (!dialogue.trim()) return [];
  const hay = normalizePhraseKey(dialogue);
  const hits: NativePhrase[] = [];

  // Longer phrases first so "Ça fait longtemps !" wins over fragments
  const ordered = [...NATIVE_FRENCH_PHRASES].sort(
    (a, b) => b.phrase.length - a.phrase.length,
  );

  for (const phrase of ordered) {
    const key = normalizePhraseKey(phrase.phrase);
    // Allow optional final punct differences already normalized
    const needle = key.replace(/\.\.\.$/, '');
    if (needle.length < 3) continue;
    if (hay.includes(needle)) {
      hits.push(phrase);
    }
  }

  return hits;
}

export function buildNativePhraseHookGuidance(params: {
  language: SupportedLanguage;
  level: ProficiencyLevel;
  tag: LessonTag;
  theme?: string;
  grammarFocus?: string;
  uiTitle?: string;
}): string {
  const picks = pickNativePhrasesForLesson({ ...params, limit: 6 });
  if (picks.length === 0) return '';

  const lines = picks.map((p) => `- "${p.phrase}" (${p.translationPt}) [${p.fn}]`).join('\n');

  return `
⚠️ FRASES NATIVAS (fala real — piggyback) ⚠️
Use 1–2 destas reações/conectores NO diálogo quando couber na cena (não force todas):
${lines}
- Pelo menos 1 turno deve ser SÓ a reação curta (1–4 palavras), como nativo responde.
- Inclua as frases usadas em newChunks (entryType "expression") com tradução PT-BR natural.
- NÃO abra o diálogo com ritual vazio "Ça va ?" a menos que o grammarFocus seja saudação.
`;
}

export function buildNativePhraseExerciseGuidance(params: {
  language: SupportedLanguage;
  level: ProficiencyLevel;
  tag: LessonTag;
  theme?: string;
  grammarFocus?: string;
  uiTitle?: string;
}): string {
  const picks = pickNativePhrasesForLesson({ ...params, limit: 5 });
  if (picks.length === 0) return '';

  const list = picks.map((p) => `"${p.phrase}"`).join(', ');

  return `
⚠️ FRASES NATIVAS — EXERCÍCIO DE FLUÊNCIA ⚠️
- Pelo menos 1 exercício DEVE testar a reação/frase certa no contexto (não tradução isolada).
- Prefira: "listen-and-respond", "social-roleplay", "bridge-choice" ou "context-choice".
- Opcões corretas e distratores devem ser frases faladas plausíveis; a certa encaixa no tom da cena.
- Priorize estas frases da lição/banco quando aparecerem no diálogo: ${list}.
- No feedback (explanation), diga em 1 linha quando o brasileiro usaria essa reação.
`;
}

/**
 * If the dialogue already used a bank phrase, ensure it lands in newChunks for SRS.
 */
export function enrichHookWithNativeChunks(hook: HookResult): HookResult {
  const hits = findNativePhrasesInText(hook.dialogue);
  if (hits.length === 0) return hook;

  const existing = hook.newChunks ?? [];
  const existingKeys = new Set(existing.map((c) => normalizePhraseKey(c.phrase)));
  const additions = hits
    .filter((h) => !existingKeys.has(normalizePhraseKey(h.phrase)))
    .slice(0, 2)
    .map((h) => ({
      phrase: h.phrase,
      translation: h.translationPt,
      entryType: 'expression' as const,
    }));

  if (additions.length === 0) return hook;

  return {
    ...hook,
    newChunks: [...existing, ...additions].slice(0, 4),
  };
}

/** Short reaction examples for spoken-dialogue few-shots. */
export function nativeReactionExamples(level: ProficiencyLevel, limit = 5): string[] {
  return NATIVE_FRENCH_PHRASES.filter(
    (p) =>
      levelAllowed(p, level) &&
      (p.fn === 'reaction' || p.fn === 'agreement' || p.fn === 'hedging'),
  )
    .slice(0, limit)
    .map((p) => p.phrase);
}
