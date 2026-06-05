'use server';

import { callGeminiJSON } from '@/services/gemini';
import { getCachedVerb, saveVerbCache } from '@/services/firestore';
import type { VerbDocument, SupportedLanguage } from '@/types';
import { unstable_cacheLife as cacheLife } from 'next/cache';
import { normalizeConjugations } from '@/utils/conjugationHelper';

const LANG_LABEL: Record<SupportedLanguage, string> = {
  fr: 'French',
  en: 'English',
};

/**
 * Returns conjugation data for a verb.
 * Flow: Firestore cache → Gemini generate → save cache → return.
 */
export async function getVerbConjugation(
  infinitive: string,
  language: SupportedLanguage,
): Promise<VerbDocument | null> {
  'use cache';
  cacheLife('weeks');
  const clean = infinitive.trim().toLowerCase();
  if (!clean) return null;

  try {
    // 1. Check Firestore cache first
    const cached = await getCachedVerb(clean, language);
    if (cached) {
      cached.conjugations = normalizeConjugations(cached.conjugations, language);
      return cached;
    }

    // 2. Generate via Gemini
    const systemPrompt = `You are a language expert creating verb conjugation data for Brazilian Portuguese speakers learning ${LANG_LABEL[language]}. Respond with ONLY valid JSON, no markdown, no explanation.`;

    const prompt = `Generate complete conjugation data for the ${LANG_LABEL[language]} verb "${clean}".

Output JSON in exactly this format:
{
  "infinitive": "${clean}",
  "language": "${language}",
  "translation": "Portuguese translation of the verb (infinitive form)",
  "conjugations": {
    "present": {
      ${
        language === 'fr'
          ? `"je": "conjugated form",
      "tu": "conjugated form",
      "il": "conjugated form",
      "elle": "conjugated form",
      "on": "conjugated form",
      "nous": "conjugated form",
      "vous": "conjugated form",
      "ils": "conjugated form",
      "elles": "conjugated form"`
          : `"I": "conjugated form",
      "you": "conjugated form",
      "he": "conjugated form",
      "she": "conjugated form",
      "it": "conjugated form",
      "we": "conjugated form",
      "they": "conjugated form"`
      }
    },
    "past": {
      ${
        language === 'fr'
          ? `"je": "conjugated form",
      "tu": "conjugated form",
      "il": "conjugated form",
      "elle": "conjugated form",
      "on": "conjugated form",
      "nous": "conjugated form",
      "vous": "conjugated form",
      "ils": "conjugated form",
      "elles": "conjugated form"`
          : `"I": "conjugated form",
      "you": "conjugated form",
      "he": "conjugated form",
      "she": "conjugated form",
      "it": "conjugated form",
      "we": "conjugated form",
      "they": "conjugated form"`
      }
    },
    "future": {
      ${
        language === 'fr'
          ? `"je": "conjugated form",
      "tu": "conjugated form",
      "il": "conjugated form",
      "elle": "conjugated form",
      "on": "conjugated form",
      "nous": "conjugated form",
      "vous": "conjugated form",
      "ils": "conjugated form",
      "elles": "conjugated form"`
          : `"I": "conjugated form",
      "you": "conjugated form",
      "he": "conjugated form",
      "she": "conjugated form",
      "it": "conjugated form",
      "we": "conjugated form",
      "they": "conjugated form"`
      }
    }
  },
  "exampleSentences": [
    { "target": "Example sentence in ${LANG_LABEL[language]}", "portuguese": "Translation in Brazilian Portuguese" },
    { "target": "Another example", "portuguese": "Outra tradução" }
  ]
}

Rules:
${
  language === 'fr'
    ? `- For French: use exactly the separate pronouns je, tu, il, elle, on, nous, vous, ils, elles. Do NOT group them (e.g. do NOT use il/elle or ils/elles).`
    : `- For English: use exactly the separate pronouns I, you, he, she, it, we, they. Do NOT group them (e.g. do NOT use he/she).`
}
- Include present tense always. Include past and future if commonly used at A1-B1 level.
- Include 2-3 example sentences showing common usage.
- Keep examples simple (A1-B1 level vocabulary).
- "translation" must be the Brazilian Portuguese infinitive (e.g., "ser/estar" for "être").`;

    const data = await callGeminiJSON<VerbDocument>(prompt, systemPrompt, 900);

    if (!data || !data.infinitive || !data.conjugations?.present) {
      console.error('[getVerbConjugation] Invalid response from Gemini');
      return null;
    }

    // Normalize infinitive to what user typed (Gemini may return different casing)
    data.infinitive = clean;
    data.language = language;
    data.conjugations = normalizeConjugations(data.conjugations, language);

    // 3. Cache the result
    await saveVerbCache(data);

    return data;
  } catch (err) {
    console.error('[getVerbConjugation] Error:', err);
    return null;
  }
}
