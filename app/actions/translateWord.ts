'use server';

import { callGeminiJSON } from '@/services/gemini';
import type { SupportedLanguage, TranslateWordResult } from '@/types';
import { unstable_cacheLife as cacheLife } from 'next/cache';

const LANG_LABEL: Record<SupportedLanguage, string> = {
  fr: 'French',
  en: 'English',
};

/**
 * Translates a single word in context using Gemini (Prompt #5).
 * Returns null on any error so callers can show a graceful fallback.
 */
export async function translateWord(
  word: string,
  sentence: string,
  language: SupportedLanguage,
  isNewVerb?: boolean,
): Promise<TranslateWordResult | null> {
  'use cache';
  cacheLife('weeks');
  try {
    const systemPrompt = `You are a language assistant for Brazilian Portuguese speakers learning ${LANG_LABEL[language]}. Respond with ONLY valid JSON, no markdown, no explanation.`;

    let verbInstruction = '';
    if (isNewVerb) {
      verbInstruction = `
- The clicked word is flagged as a NEW VERB in the lesson.
- You MUST identify its INFINITIVE form in ${LANG_LABEL[language]} (e.g. "plaire" for "plaît", "coûter" for "coûte", "payer" for "paye").
- You MUST return "partOfSpeech": "Verbo" and "infinitive": "<infinitive_form_in_lowercase>".
- Ensure the explanation in Portuguese mentions the infinitive verb and explains why it is conjugated this way.`;
    }

    const prompt = `A user clicked on the word "${word}" in: "${sentence}".
${verbInstruction}

Respond with ONLY this JSON (no markdown):
{"translation":"PT-BR translation","explanation":"one PT-BR sentence, max 20 words","example":"new sentence in ${LANG_LABEL[language]} using the same word","partOfSpeech":${isNewVerb ? '"Verbo"' : 'null'},"infinitive":${isNewVerb ? '"infinitive lowercase"' : 'null'}}

Rules: example must be ${LANG_LABEL[language]} only; beginner vocabulary.`;

    return await callGeminiJSON<TranslateWordResult>(prompt, systemPrompt, 256, 0, 'lightweight');
  } catch (err) {
    console.error('[translateWord] Error:', err);
    return null;
  }
}

/**
 * Translates multiple words at once to Brazilian Portuguese.
 * This prevents hitting Gemini rate limits when loading a large vocabulary list.
 */
export async function translateWordsBatch(
  words: string[],
  language: SupportedLanguage,
): Promise<{ word: string; translation: string }[] | null> {
  'use cache';
  cacheLife('weeks');
  if (words.length === 0) return [];
  try {
    const systemPrompt = `You are a language assistant for Brazilian Portuguese speakers learning ${LANG_LABEL[language]}. Respond with ONLY a valid JSON array of objects, with no markdown formatting, no explanations.`;

    const prompt = `Translate the following list of ${LANG_LABEL[language]} words into Brazilian Portuguese:
${JSON.stringify(words)}

Output a JSON array of objects in exactly this format:
[
  {
    "word": "original word",
    "translation": "Portuguese translation"
  }
]

Rules:
- Keep translations brief, accurate, and natural.
- Respond ONLY with the JSON array, no markdown fences, no extra text.`;

    return await callGeminiJSON<{ word: string; translation: string }[]>(prompt, systemPrompt, 1500, 0, 'lightweight');
  } catch (err) {
    console.error('[translateWordsBatch] Error:', err);
    return null;
  }
}

