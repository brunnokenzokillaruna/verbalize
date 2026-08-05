'use server';

import { NATURAL_PT_BR_RULE, normalizeToEverydayPtBr } from '@/lib/naturalPtBr';
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

Rules: example must be ${LANG_LABEL[language]} only; beginner vocabulary.
${NATURAL_PT_BR_RULE}`;

    const result = await callGeminiJSON<TranslateWordResult>(prompt, systemPrompt, 256, 0, 'lightweight');
    return {
      ...result,
      translation: normalizeToEverydayPtBr(result.translation ?? ''),
      explanation: normalizeToEverydayPtBr(result.explanation ?? ''),
    };
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
  context?: string,
): Promise<{ word: string; translation: string }[] | null> {
  'use cache';
  cacheLife('weeks');
  if (words.length === 0) return [];
  try {
    const systemPrompt = `You are a language assistant for Brazilian Portuguese speakers learning ${LANG_LABEL[language]}. Respond with ONLY a valid JSON array of objects, with no markdown formatting, no explanations.`;

    const contextBlock = context?.trim()
      ? `\nDialogue context (use it to resolve the meaning of each item):\n${context.trim().slice(0, 2000)}\n`
      : '';
    const prompt = `Translate the following list of ${LANG_LABEL[language]} words or expressions into Brazilian Portuguese:
${JSON.stringify(words)}
${contextBlock}

Output a JSON array of objects in exactly this format:
[
  {
    "word": "original word",
    "translation": "Portuguese translation"
  }
]

Rules:
- Keep translations brief, accurate, and natural.
- Preserve each original item exactly in the "word" field.
- Translate the meaning used in the dialogue, not every possible dictionary meaning.
- Respond ONLY with the JSON array, no markdown fences, no extra text.
${NATURAL_PT_BR_RULE}`;

    const items = await callGeminiJSON<{ word: string; translation: string }[]>(prompt, systemPrompt, 4096, 0, 'lightweight');
    return items.map((item) => ({
      ...item,
      translation: normalizeToEverydayPtBr(item.translation ?? ''),
    }));
  } catch (err) {
    console.error('[translateWordsBatch] Error:', err);
    return null;
  }
}

