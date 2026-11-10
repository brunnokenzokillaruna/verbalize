import { extractVerbOnlyForm, normalizeConjugationPreview } from '@/utils/conjugationHelper';
import type { SupportedLanguage, VerbDocument } from '@/types';
import type { VerbTenseKey } from './tenseKeys';

export type ConjugationPreviewRow = { pronoun: string; form: string };

/**
 * Build pronoun/form rows from a cached VerbDocument for the requested tense.
 * Forms keep the pronoun prefix when present in the table (UI/audio expect that shape).
 */
export function buildConjugationPreviewFromVerbDoc(
  verbDoc: VerbDocument,
  tenseKey: VerbTenseKey,
  language: SupportedLanguage,
): ConjugationPreviewRow[] {
  const forms = verbDoc.conjugations[tenseKey];
  if (!forms) return [];

  const rows: ConjugationPreviewRow[] = Object.entries(forms).map(([pronoun, form]) => {
    const trimmed = form.trim();
    if (!trimmed) return { pronoun, form: trimmed };
    const verbOnly = extractVerbOnlyForm(pronoun, trimmed, language);
    const formLooksFull = verbOnly !== trimmed;
    return { pronoun, form: formLooksFull ? trimmed : verbOnly };
  });

  return normalizeConjugationPreview(rows, language);
}
