import { getVerbConjugation } from '@/app/actions/getVerbConjugation';
import { resolveConjugationPreviewTense } from '@/lib/grammarBridge/usagePedagogy';
import { buildConjugationPreviewFromVerbDoc } from '@/lib/verbs/buildConjugationPreview';
import { mapPreviewTenseToVerbKey, pickAvailableTense } from '@/lib/verbs/tenseKeys';
import type { GrammarBridgeResult, SupportedLanguage } from '@/types';

/**
 * Overwrite verbSpotlight.conjugationPreview from Firestore/Gemini verb cache.
 * Leaves Gemini preview only when the requested tense is not stored as a table
 * (compound/periphrastic).
 */
export async function hydrateConjugationPreview(
  bridge: GrammarBridgeResult,
  language: SupportedLanguage,
  grammarFocus: string,
): Promise<GrammarBridgeResult> {
  const spotlight = bridge.verbSpotlight;
  if (!spotlight?.infinitive?.trim()) return bridge;

  const verbDoc = await getVerbConjugation(spotlight.infinitive, language);
  if (!verbDoc?.conjugations) return bridge;

  const previewTense = resolveConjugationPreviewTense(grammarFocus, language);
  const mapped = mapPreviewTenseToVerbKey(previewTense, language);

  // Compound/periphrastic tenses are not stored as full tables — keep whatever Gemini sent
  // (usually [] after the prompt change; conjugation steps simply won't appear).
  if (mapped === null) {
    return bridge;
  }

  const tenseKey = pickAvailableTense(verbDoc.conjugations, mapped);
  if (!tenseKey) return bridge;

  const preview = buildConjugationPreviewFromVerbDoc(verbDoc, tenseKey, language);
  if (preview.length === 0) return bridge;

  return {
    ...bridge,
    verbSpotlight: {
      ...spotlight,
      conjugationPreview: preview,
    },
  };
}
