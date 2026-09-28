import { canonicalVocabKey } from '@/lib/vocabCanonical';

/**
 * True when the candidate is missing or is the source word itself
 * (including accent-only copies such as "précieuse" → "precieuse").
 * A real Portuguese rendering like "hotel" for "hôtel" also matches here;
 * callers that already confirmed a cognate should pass allowCopy.
 */
export function isUntranslatedCopy(source: string, translation: string | undefined): boolean {
  const value = translation?.trim();
  if (!value) return true;
  return canonicalVocabKey(source) === canonicalVocabKey(value);
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
