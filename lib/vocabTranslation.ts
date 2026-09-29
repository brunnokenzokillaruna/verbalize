import { canonicalVocabKey, wordsMatchCanonically } from '@/lib/vocabCanonical';

function comparableVocabKey(value: string): string {
  return canonicalVocabKey(value.replace(/['’ʼ]/g, ''));
}

/**
 * True when the candidate is missing or is the source word itself
 * (including accent-only copies such as "précieuse" → "precieuse",
 * and French elisions such as "sinstaller" → "s'installer").
 * A real Portuguese rendering like "hotel" for "hôtel" also matches here;
 * callers that already confirmed a cognate should pass allowCopy.
 */
export function isUntranslatedCopy(source: string, translation: string | undefined): boolean {
  const value = translation?.trim();
  if (!value) return true;
  return comparableVocabKey(source) === comparableVocabKey(value);
}

/** "s'installer" is the French verb again, not a Portuguese cognate. */
export function isFrenchElisionCopy(source: string, translation: string | undefined): boolean {
  const value = translation?.trim();
  if (!value || !/['’ʼ]/.test(value)) return false;
  return isUntranslatedCopy(source, value);
}

/**
 * Picks the translation for one vocabulary word from a batch response.
 * Gemini often "corrects" accents or articles in the echoed word, so an exact
 * string match drops a usable translation and the library button looks dead.
 * A single-item batch is used when the echoed word still does not match.
 * Copies of the source are kept only when allowCopy is set (later retry).
 */
export function pickBatchTranslation(
  word: string,
  results: { word: string; translation: string }[] | null | undefined,
  allowCopy: boolean,
): string | undefined {
  if (!results?.length) return undefined;

  const echoed =
    results.find((item) => wordsMatchCanonically(item.word, word)) ??
    (results.length === 1 ? results[0] : undefined);
  const translation = echoed?.translation?.trim();
  if (!translation) return undefined;
  if (isFrenchElisionCopy(word, translation)) return undefined;
  if (!allowCopy && isUntranslatedCopy(word, translation)) return undefined;
  return translation;
}

/** Finds a stored translation even when the key differs by case or accents. */
export function lookupStoredTranslation(
  translations: Record<string, string>,
  word: string,
): string | undefined {
  const target = canonicalVocabKey(word);
  if (!target) return undefined;
  for (const [key, value] of Object.entries(translations)) {
    if (canonicalVocabKey(key) !== target) continue;
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

let pending: Promise<void> | null = null;

/** Keeps lesson completion from saving vocabulary before translations finish. */
export function trackVocabTranslationFill(task: Promise<void>): void {
  const tracked = task.finally(() => {
    if (pending === tracked) pending = null;
  });
  pending = tracked;
}

export function waitForVocabTranslations(): Promise<void> {
  return pending ?? Promise.resolve();
}
