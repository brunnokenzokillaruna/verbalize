import type { GrammarBridgeResult, SupportedLanguage, TranslateWordResult } from '@/types';

/** Strip diacritics so e.g. "achète" and "achete" compare equal. */
export function normalizeWord(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function cleanWordToken(word: string): string {
  return word.replace(/[.,!?;:»«"'()[\]{}]/g, '').trim();
}

export function tooltipCacheKey(
  word: string,
  language: SupportedLanguage,
  isNewVerb?: boolean,
): string {
  return `${language}:${normalizeWord(cleanWordToken(word))}:${isNewVerb ? 'v' : 'w'}`;
}

/**
 * Stem-based match for verb conjugations and noun plurals.
 * E.g. vocab "manger" matches dialogue token "mange".
 */
export function matchesVocab(token: string, vocabWords: string[]): boolean {
  const normToken = normalizeWord(cleanWordToken(token));
  for (const vocab of vocabWords) {
    const normVocab = normalizeWord(vocab);
    if (normToken === normVocab) return true;
    const stemLen = Math.max(3, normVocab.length - 2);
    const stem = normVocab.slice(0, stemLen);
    if (stem.length >= 3 && normToken.length >= stem.length && normToken.startsWith(stem)) {
      return true;
    }
  }
  return false;
}

export function lookupVocabTranslation(
  word: string,
  vocabTranslations: Record<string, TranslateWordResult> | undefined,
): TranslateWordResult | undefined {
  if (!vocabTranslations) return undefined;
  const clean = normalizeWord(cleanWordToken(word));
  for (const [key, value] of Object.entries(vocabTranslations)) {
    if (normalizeWord(key) === clean) return value;
  }
  return undefined;
}

function stripHighlights(text: string): string {
  return text.replace(/\^\^/g, '');
}

function collectTargetSentences(bridge: GrammarBridgeResult): string[] {
  const sentences: string[] = [];
  const push = (value?: string) => {
    if (value?.trim()) sentences.push(stripHighlights(value));
  };

  push(bridge.bridge?.target);
  push(bridge.dialogueExample?.target);
  push(bridge.targetExample);
  push(bridge.formulaExample?.target);
  bridge.additionalExamples?.forEach((ex) => push(ex.target));
  bridge.patterns?.forEach((p) => push(p.target));
  bridge.items?.forEach((item) => push(item.target));
  bridge.structureFormulas?.forEach((sf) => push(sf.example?.target));
  bridge.verbSpotlight?.idiomaticExpressions?.forEach((ex) => push(ex.target));
  bridge.verbSpotlight?.conjugationPreview?.forEach((row) => push(row.form));

  return sentences;
}

function tokenizeSentence(text: string): string[] {
  return text
    .split(/\s+/)
    .map(cleanWordToken)
    .filter(Boolean);
}

/** Words in grammar-bridge target sentences that match lesson vocab or verbs. */
export function extractHighlightedWordsFromBridge(
  bridge: GrammarBridgeResult,
  newVocabulary: string[],
  newVerbs: string[],
): Array<{ word: string; isNewVerb: boolean }> {
  const seen = new Set<string>();
  const results: Array<{ word: string; isNewVerb: boolean }> = [];

  for (const sentence of collectTargetSentences(bridge)) {
    for (const token of tokenizeSentence(sentence)) {
      const key = normalizeWord(token);
      if (seen.has(key)) continue;

      const isNewVerb = matchesVocab(token, newVerbs);
      const isNewVocabulary = matchesVocab(token, newVocabulary);
      if (!isNewVerb && !isNewVocabulary) continue;

      seen.add(key);
      results.push({ word: token, isNewVerb });
    }
  }

  return results;
}

/** Conjugated verb tokens from a dialogue that match known verb infinitives. */
export function extractVerbFormsFromText(
  text: string,
  verbInfinitives: string[],
): Array<{ word: string; isNewVerb: true }> {
  const seen = new Set<string>();
  const results: Array<{ word: string; isNewVerb: true }> = [];

  for (const token of tokenizeSentence(text)) {
    const key = normalizeWord(token);
    if (seen.has(key)) continue;
    if (!matchesVocab(token, verbInfinitives)) continue;
    seen.add(key);
    results.push({ word: token, isNewVerb: true });
  }

  return results;
}
