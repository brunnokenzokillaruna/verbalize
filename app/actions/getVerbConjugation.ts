'use server';

import { callGeminiJSON } from '@/services/gemini';
import { getCachedVerb, saveVerbCache } from '@/services/firestore';
import {
  buildFullVerbTablePrompt,
  buildMissingTenseExamplesPrompt,
  buildMissingTensesPrompt,
  extractTenseExamples,
  mergeVerbConjugations,
  type TenseExamplesPayload,
} from '@/lib/verbs/generateVerbTable';
import { CORE_TENSES_BY_LANG, missingCoreTenses, VERB_TABLE_VERSION } from '@/lib/verbs/tenseKeys';
import { mergeTenseGuides, missingTenseGuideKeys } from '@/lib/verbs/tenseUsage';
import type { VerbDocument, SupportedLanguage } from '@/types';
import { unstable_cacheLife as cacheLife } from 'next/cache';
import { normalizeConjugations } from '@/utils/conjugationHelper';

type UpgradePayload = {
  conjugations?: Partial<VerbDocument['conjugations']>;
  tenseExamples?: TenseExamplesPayload;
};

type ExamplesPayload = {
  tenseExamples?: TenseExamplesPayload;
};

/**
 * Returns conjugation data for a verb.
 * Flow: Firestore → lazy-upgrade missing core tenses / tense guides → else Gemini full generate → save → return.
 *
 * `tableVersion` is part of the Next cache key so expanding the tense set invalidates stale entries.
 */
export async function getVerbConjugation(
  infinitive: string,
  language: SupportedLanguage,
): Promise<VerbDocument | null> {
  return getVerbConjugationCached(infinitive, language, VERB_TABLE_VERSION);
}

async function getVerbConjugationCached(
  infinitive: string,
  language: SupportedLanguage,
  tableVersion: number,
): Promise<VerbDocument | null> {
  'use cache';
  cacheLife('weeks');
  void tableVersion;

  const clean = infinitive.trim().toLowerCase();
  if (!clean) return null;

  try {
    const cached = await getCachedVerb(clean, language);
    if (cached?.conjugations?.present) {
      cached.conjugations = normalizeConjugations(cached.conjugations, language);
      const upgraded = await maybeUpgradeVerbDocument(cached, language);
      return upgraded;
    }

    const { systemPrompt, prompt } = buildFullVerbTablePrompt(clean, language);
    const data = await callGeminiJSON<VerbDocument & { tenseExamples?: TenseExamplesPayload }>(
      prompt,
      systemPrompt,
      2800,
      undefined,
      'lightweight',
    );

    if (!data || !data.infinitive || !data.conjugations?.present) {
      console.error('[getVerbConjugation] Invalid response from Gemini');
      return null;
    }

    data.infinitive = clean;
    data.language = language;
    data.tableVersion = VERB_TABLE_VERSION;
    data.conjugations = normalizeConjugations(data.conjugations, language);
    data.tenseGuides = mergeTenseGuides(
      language,
      data.conjugations,
      undefined,
      extractTenseExamples(data),
    );
    // AI may return tenseExamples transiently — do not persist the alias field.
    delete (data as { tenseExamples?: unknown }).tenseExamples;

    await saveVerbCache(data);
    return data;
  } catch (err) {
    console.error('[getVerbConjugation] Error:', err);
    return null;
  }
}

/**
 * If the Firestore doc is missing curriculum tenses or per-tense guides, fill the gaps.
 */
async function maybeUpgradeVerbDocument(
  cached: VerbDocument,
  language: SupportedLanguage,
): Promise<VerbDocument> {
  const missing = missingCoreTenses(cached.conjugations, language);
  const guideKeys = [
    ...new Set([
      ...CORE_TENSES_BY_LANG[language],
      ...(Object.keys(cached.conjugations) as (keyof VerbDocument['conjugations'])[]),
    ]),
  ];
  let current: VerbDocument = { ...cached };

  if (missing.length > 0) {
    try {
      const { systemPrompt, prompt } = buildMissingTensesPrompt(
        cached.infinitive,
        language,
        missing,
      );
      const patch = await callGeminiJSON<UpgradePayload>(
        prompt,
        systemPrompt,
        1400,
        undefined,
        'lightweight',
      );

      const merged = mergeVerbConjugations(cached.conjugations, patch?.conjugations);
      current = {
        ...cached,
        tableVersion: VERB_TABLE_VERSION,
        conjugations: normalizeConjugations(merged, language),
        tenseGuides: mergeTenseGuides(
          language,
          merged,
          cached.tenseGuides,
          extractTenseExamples(patch),
        ),
      };
      await saveVerbCache(current);
      console.info(
        `[getVerbConjugation] Upgraded ${cached.infinitive}_${language} with: ${missing.join(', ')}`,
      );
    } catch (err) {
      console.warn('[getVerbConjugation] Upgrade failed; returning cached table:', err);
      return stampGuidesIfComplete(cached, language);
    }
  }

  const missingGuides = missingTenseGuideKeys(
    current.conjugations,
    current.tenseGuides,
    language,
    guideKeys,
  );

  if (missingGuides.length > 0) {
    try {
      const { systemPrompt, prompt } = buildMissingTenseExamplesPrompt(
        current.infinitive,
        language,
        missingGuides,
      );
      const patch = await callGeminiJSON<ExamplesPayload>(
        prompt,
        systemPrompt,
        900,
        undefined,
        'lightweight',
      );
      current = {
        ...current,
        tableVersion: VERB_TABLE_VERSION,
        tenseGuides: mergeTenseGuides(
          language,
          current.conjugations,
          current.tenseGuides,
          extractTenseExamples(patch),
        ),
      };
      await saveVerbCache(current);
      console.info(
        `[getVerbConjugation] Added tense guides for ${current.infinitive}_${language}: ${missingGuides.join(', ')}`,
      );
    } catch (err) {
      console.warn('[getVerbConjugation] Tense guide upgrade failed:', err);
      return stampGuidesIfComplete(current, language);
    }
  }

  if (current.tableVersion !== VERB_TABLE_VERSION) {
    current = { ...current, tableVersion: VERB_TABLE_VERSION };
    await saveVerbCache(current);
  }

  return stampGuidesIfComplete(current, language);
}

/** Ensure whenToUse is always present from the static map even if example already existed. */
function stampGuidesIfComplete(
  doc: VerbDocument,
  language: SupportedLanguage,
): VerbDocument {
  const stamped = mergeTenseGuides(
    language,
    doc.conjugations,
    doc.tenseGuides,
    extractTenseExamples({ tenseGuides: doc.tenseGuides }),
  );
  if (!stamped || Object.keys(stamped).length === 0) return doc;
  const same =
    JSON.stringify(stamped) === JSON.stringify(doc.tenseGuides ?? {});
  if (same) return doc;
  return { ...doc, tenseGuides: stamped };
}
