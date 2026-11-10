'use server';

import { callGeminiJSON } from '@/services/gemini';
import { getCachedVerb, saveVerbCache } from '@/services/firestore';
import {
  buildFullVerbTablePrompt,
  buildMissingTensesPrompt,
  mergeVerbConjugations,
} from '@/lib/verbs/generateVerbTable';
import { missingCoreTenses, VERB_TABLE_VERSION } from '@/lib/verbs/tenseKeys';
import type { VerbDocument, SupportedLanguage } from '@/types';
import { unstable_cacheLife as cacheLife } from 'next/cache';
import { normalizeConjugations } from '@/utils/conjugationHelper';

type UpgradePayload = {
  conjugations?: Partial<VerbDocument['conjugations']>;
};

/**
 * Returns conjugation data for a verb.
 * Flow: Firestore → lazy-upgrade missing core tenses → else Gemini full generate → save → return.
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
    const data = await callGeminiJSON<VerbDocument>(
      prompt,
      systemPrompt,
      2200,
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

    await saveVerbCache(data);
    return data;
  } catch (err) {
    console.error('[getVerbConjugation] Error:', err);
    return null;
  }
}

/**
 * If the Firestore doc is missing curriculum tenses, fill only the gaps (one lightweight call).
 */
async function maybeUpgradeVerbDocument(
  cached: VerbDocument,
  language: SupportedLanguage,
): Promise<VerbDocument> {
  const missing = missingCoreTenses(cached.conjugations, language);
  if (missing.length === 0 && cached.tableVersion === VERB_TABLE_VERSION) {
    return cached;
  }
  if (missing.length === 0) {
    const stamped = { ...cached, tableVersion: VERB_TABLE_VERSION };
    await saveVerbCache(stamped);
    return stamped;
  }

  try {
    const { systemPrompt, prompt } = buildMissingTensesPrompt(
      cached.infinitive,
      language,
      missing,
    );
    const patch = await callGeminiJSON<UpgradePayload>(
      prompt,
      systemPrompt,
      1200,
      undefined,
      'lightweight',
    );

    const merged = mergeVerbConjugations(cached.conjugations, patch?.conjugations);
    const upgraded: VerbDocument = {
      ...cached,
      tableVersion: VERB_TABLE_VERSION,
      conjugations: normalizeConjugations(merged, language),
    };
    await saveVerbCache(upgraded);
    console.info(
      `[getVerbConjugation] Upgraded ${cached.infinitive}_${language} with: ${missing.join(', ')}`,
    );
    return upgraded;
  } catch (err) {
    console.warn('[getVerbConjugation] Upgrade failed; returning cached table:', err);
    return cached;
  }
}
