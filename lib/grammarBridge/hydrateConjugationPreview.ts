import { getVerbConjugation } from '@/app/actions/getVerbConjugation';
import { resolveConjugationPreviewTense } from '@/lib/grammarBridge/usagePedagogy';
import { buildConjugationPreviewFromVerbDoc } from '@/lib/verbs/buildConjugationPreview';
import { mapPreviewTenseToVerbKey, pickAvailableTense } from '@/lib/verbs/tenseKeys';
import type { GrammarBridgeResult, SupportedLanguage } from '@/types';

/**
 * Overwrite verbSpotlight.conjugationPreview from the Firestore verb cache.
 * Uses the grammar-focus tense when present; never substitutes présent for another tense.
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
  const mapped = mapPreviewTenseToVerbKey(previewTense);

  // Rare paradigms we still do not store — leave Gemini rows (usually []).
  if (mapped === null) {
    return bridge;
  }

  const tenseKey = pickAvailableTense(verbDoc.conjugations, mapped, { allowFallback: false });
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
