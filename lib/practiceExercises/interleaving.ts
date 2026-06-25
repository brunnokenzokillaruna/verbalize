/**
 * Pick words from earlier lessons to reinforce via interleaving in new exercises.
 */
export function pickInterleavingWords(
  knownVocabulary: string[],
  newVocabulary: string[],
  count = 3,
): string[] {
  const newSet = new Set(newVocabulary.map((w) => w.toLowerCase()));
  const candidates = knownVocabulary
    .map((w) => w.toLowerCase().trim())
    .filter((w) => w.length > 2 && !newSet.has(w));

  if (candidates.length === 0) return [];

  const unique = [...new Set(candidates)];
  const shuffled = [...unique].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function buildInterleavingPromptBlock(words: string[]): string {
  if (words.length === 0) return '';
  return `
INTERLEAVING (retention): Reuse at least 2 of these words from earlier lessons in different exercises (not all in one sentence): ${words.join(', ')}.`;
}
