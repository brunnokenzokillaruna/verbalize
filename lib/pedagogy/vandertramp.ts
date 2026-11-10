import type { GrammarBridgeResult, SupportedLanguage } from '@/types';

/**
 * DR MRS VANDERTRAMP — 16 French verbs that take être (not avoir) in compound tenses.
 * Curated pedagogy for piggybacking on lesson / verb explorer flows (no separate daily habit).
 */

export const VANDERTRAMP_ACRONYM = 'DR MRS VANDERTRAMP';

export type VandertrampVerb = {
  letter: string;
  infinitive: string;
  meaningPt: string;
};

export const VANDERTRAMP_VERBS: readonly VandertrampVerb[] = [
  { letter: 'D', infinitive: 'devenir', meaningPt: 'tornar-se' },
  { letter: 'R', infinitive: 'revenir', meaningPt: 'voltar' },
  { letter: 'M', infinitive: 'monter', meaningPt: 'subir' },
  { letter: 'R', infinitive: 'rester', meaningPt: 'ficar / permanecer' },
  { letter: 'S', infinitive: 'sortir', meaningPt: 'sair' },
  { letter: 'V', infinitive: 'venir', meaningPt: 'vir' },
  { letter: 'A', infinitive: 'aller', meaningPt: 'ir' },
  { letter: 'N', infinitive: 'naître', meaningPt: 'nascer' },
  { letter: 'D', infinitive: 'descendre', meaningPt: 'descer' },
  { letter: 'E', infinitive: 'entrer', meaningPt: 'entrar' },
  { letter: 'R', infinitive: 'rentrer', meaningPt: 'voltar para casa' },
  { letter: 'T', infinitive: 'tomber', meaningPt: 'cair' },
  { letter: 'R', infinitive: 'retourner', meaningPt: 'retornar' },
  { letter: 'A', infinitive: 'arriver', meaningPt: 'chegar' },
  { letter: 'M', infinitive: 'mourir', meaningPt: 'morrer' },
  { letter: 'P', infinitive: 'partir', meaningPt: 'partir / ir embora' },
] as const;

const VANDERTRAMP_INFINITIVES = new Set(
  VANDERTRAMP_VERBS.map((v) => normalizeInfinitive(v.infinitive)),
);

/** Short mnemonic for Grammar Bridge analogy (≤20 words). */
export const VANDERTRAMP_ANALOGY =
  'Lembre DR MRS VANDERTRAMP: esses 16 verbos de movimento usam être.';

/** Survival tip / synthesis anchor (≤12 words). */
export const VANDERTRAMP_SURVIVAL_TIP = 'DR MRS VANDERTRAMP → movimento com être.';

/** One-liner for Radar de Erro when avoir is used wrongly. */
export const VANDERTRAMP_TRAP_HINT =
  'DR MRS VANDERTRAMP: este verbo de movimento vai com être, não avoir.';

export function normalizeInfinitive(word: string): string {
  return word
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/^(se |s')/, '');
}

export function isVandertrampFocus(grammarFocus: string | undefined | null): boolean {
  const f = (grammarFocus ?? '').toLowerCase();
  if (!f) return false;
  return (
    f.includes('vandertramp') ||
    (f.includes('auxiliar') && f.includes('être')) ||
    (f.includes('auxiliar') && f.includes('etre')) ||
    (f.includes('être') && f.includes('passado') && !f.includes('avoir')) ||
    (f.includes('etre') && f.includes('passado') && !f.includes('avoir'))
  );
}

export function isVandertrampVerb(infinitive: string | undefined | null): boolean {
  if (!infinitive?.trim()) return false;
  return VANDERTRAMP_INFINITIVES.has(normalizeInfinitive(infinitive));
}

export function getVandertrampVerb(infinitive: string): VandertrampVerb | undefined {
  const key = normalizeInfinitive(infinitive);
  return VANDERTRAMP_VERBS.find((v) => normalizeInfinitive(v.infinitive) === key);
}

/** Prefer verbs that appear in the lesson dialogue / vocab; fall back to common trio. */
export function pickLessonSpotlightVerbs(
  candidates: string[] | undefined,
  limit = 3,
): VandertrampVerb[] {
  const matched: VandertrampVerb[] = [];
  const seen = new Set<string>();

  for (const raw of candidates ?? []) {
    const hit = getVandertrampVerb(raw);
    if (!hit) continue;
    const key = normalizeInfinitive(hit.infinitive);
    if (seen.has(key)) continue;
    seen.add(key);
    matched.push(hit);
    if (matched.length >= limit) return matched;
  }

  if (matched.length >= limit) return matched;

  const fallbacks = ['aller', 'venir', 'arriver', 'partir', 'rester'] as const;
  for (const inf of fallbacks) {
    const hit = getVandertrampVerb(inf);
    if (!hit) continue;
    const key = normalizeInfinitive(hit.infinitive);
    if (seen.has(key)) continue;
    seen.add(key);
    matched.push(hit);
    if (matched.length >= limit) break;
  }

  return matched;
}

function mentionsMnemonic(text: string | undefined): boolean {
  const t = (text ?? '').toLowerCase();
  return t.includes('vandertramp') || t.includes('dr mrs');
}

/**
 * Deterministic piggyback: ensure analogy / tip / trap mention the mnemonic
 * so cached or incomplete AI bridges still teach it in <15s.
 */
export function enrichBridgeWithVandertramp(
  bridge: GrammarBridgeResult,
  grammarFocus: string,
  language: SupportedLanguage,
  dialogueHints?: string[],
): GrammarBridgeResult {
  if (language !== 'fr' || !isVandertrampFocus(grammarFocus)) return bridge;

  const next: GrammarBridgeResult = { ...bridge };
  const spotlight = pickLessonSpotlightVerbs(dialogueHints);
  const spotlightLine = spotlight.map((v) => v.infinitive).join(', ');

  if (!mentionsMnemonic(next.analogy)) {
    next.analogy = VANDERTRAMP_ANALOGY;
  }

  if (!mentionsMnemonic(next.survivalTip)) {
    next.survivalTip = VANDERTRAMP_SURVIVAL_TIP;
  }

  if (!next.insight?.trim()) {
    next.insight =
      'No passé composé, verbos de movimento e mudança de estado usam être — não avoir.';
  }

  const explanation = Array.isArray(next.explanation)
    ? [...next.explanation]
    : next.explanation
      ? [next.explanation]
      : [];

  const hasListCue = explanation.some(
    (e) => mentionsMnemonic(e) || e.toLowerCase().includes('movimento'),
  );
  if (!hasListCue && spotlightLine) {
    explanation.unshift(
      `Comece com estes da lição: ${spotlightLine}. A lista completa é ${VANDERTRAMP_ACRONYM}.`,
    );
    next.explanation = explanation.slice(0, 2);
  }

  const trap = next.brazilianTrap;
  if (typeof trap === 'string') {
    if (!mentionsMnemonic(trap)) {
      next.brazilianTrap = {
        wrong: "J'ai allé au café.",
        right: 'Je suis allé au café.',
        explanation: VANDERTRAMP_TRAP_HINT,
        wrongPortuguese: 'Eu fui ao café. (com avoir — errado)',
        rightPortuguese: 'Eu fui ao café.',
        subtitle: 'Avoir ou être?',
      };
    }
  } else if (trap && typeof trap === 'object') {
    if (!mentionsMnemonic(trap.explanation)) {
      next.brazilianTrap = {
        ...trap,
        explanation: VANDERTRAMP_TRAP_HINT,
        subtitle: trap.subtitle ?? 'Avoir ou être?',
      };
    }
  } else {
    next.brazilianTrap = {
      wrong: "J'ai allé au café.",
      right: 'Je suis allé au café.',
      explanation: VANDERTRAMP_TRAP_HINT,
      wrongPortuguese: 'Eu fui ao café. (com avoir — errado)',
      rightPortuguese: 'Eu fui ao café.',
      subtitle: 'Avoir ou être?',
    };
  }

  return next;
}
