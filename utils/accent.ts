/**
 * Strips Unicode combining diacritical marks (accents) from a string.
 * Uses NFD decomposition so é → e + combining acute → e.
 */
export function removeAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Checks if `userInput` differs from `correct` only in accent marks
 * (ignoring case, leading/trailing whitespace, and basic punctuation).
 * Returns false if they are an exact normalised match (already "correct").
 */
export function isAccentOnlyDiff(userInput: string, correct: string): boolean {
  const clean = (s: string) =>
    s.toLowerCase().replace(/[.,!?;:'"-]/g, '').replace(/\s+/g, ' ').trim();

  const userClean = clean(userInput);
  const correctClean = clean(correct);

  // Exact match → not an accent-only diff
  if (userClean === correctClean) return false;

  // Strip accents from both sides; if they then match → accent-only diff
  return removeAccents(userClean) === removeAccents(correctClean);
}
