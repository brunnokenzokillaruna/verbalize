import { sanitizeVocabularyToken } from '@/lib/hookSanitize';
import { canonicalVocabKey } from '@/lib/vocabCanonical';

const DIALOGUE_STOP_WORDS = new Set([
  'mais', 'avec', 'pour', 'dans', 'cette', 'cest', 'comme', 'très', 'tres',
  'week', 'weekend', 'dimanche', 'matin', 'lyon', 'victor', 'camille', 'thomas',
  'marie', 'the', 'this', 'that', 'with', 'from', 'have', 'been', 'were', 'your',
]);

/**
 * Removes already-learned words from newVocabulary and backfills from the
 * dialogue when the model repeats known items.
 */
export function filterKnownFromNewVocabulary(
  newVocabulary: string[],
  dialogue: string,
  knownVocabulary: string[],
): string[] {
  const knownSet = new Set(knownVocabulary.map(canonicalVocabKey));
  const filtered = newVocabulary
    .map(sanitizeVocabularyToken)
    .filter((word) => word.length > 0 && !knownSet.has(canonicalVocabKey(word)));

  const unique = [...new Set(filtered)];
  if (unique.length >= 2) return unique.slice(0, 2);

  const needed = 2 - unique.length;
  const extras = extractFreshWordsFromDialogue(dialogue, knownSet, needed, unique);
  const merged = [...unique, ...extras];

  if (merged.length < 2) {
    console.warn('[filterKnownFromNewVocabulary] Could not find 2 fresh words — keeping model output');
    return newVocabulary.map(sanitizeVocabularyToken).slice(0, 2);
  }

  return merged.slice(0, 2);
}

function extractFreshWordsFromDialogue(
  dialogue: string,
  knownSet: Set<string>,
  need: number,
  exclude: string[],
): string[] {
  if (need <= 0) return [];

  const excludeSet = new Set(exclude.map(canonicalVocabKey));
  const tokens = dialogue
    .split(/[\s,.!?;:«»"'()[\]-]+/)
    .map(sanitizeVocabularyToken)
    .filter(
      (word) =>
        word.length >= 4 &&
        !knownSet.has(canonicalVocabKey(word)) &&
        !excludeSet.has(canonicalVocabKey(word)) &&
        !DIALOGUE_STOP_WORDS.has(word),
    );

  const result: string[] = [];
  for (const token of tokens) {
    if (result.includes(token)) continue;
    result.push(token);
    if (result.length >= need) break;
  }
  return result;
}

export function filterHookVocabularyForKnownWords<T extends { newVocabulary: string[]; dialogue: string }>(
  hook: T,
  knownVocabulary: string[],
): T {
  if (knownVocabulary.length === 0) return hook;
  return {
    ...hook,
    newVocabulary: filterKnownFromNewVocabulary(hook.newVocabulary, hook.dialogue, knownVocabulary),
  };
}
