'use server';

import { callGeminiJSON } from '@/services/gemini';
import type { SupportedLanguage, TranslateWordResult } from '@/types';

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
): Promise<TranslateWordResult | null> {
  try {
    const systemPrompt = `You are a language assistant for Brazilian Portuguese speakers learning ${LANG_LABEL[language]}. Respond with ONLY valid JSON, no markdown, no explanation.`;

    const prompt = `A user clicked on the word "${word}" inside the sentence "${sentence}".

Provide a quick, helpful explanation in Brazilian Portuguese.

Output JSON in exactly this format:
{
  "translation": "Portuguese translation of the word",
  "explanation": "One sentence explaining usage or grammar tip (in Portuguese, max 20 words)",
  "example": "A new example sentence using the same word in ${LANG_LABEL[language]} only"
}

Rules:
- Keep explanation under 20 words in Portuguese.
- The example must be in ${LANG_LABEL[language]} only (no Portuguese).
- Use simple vocabulary appropriate for beginners.`;

    return await callGeminiJSON<TranslateWordResult>(prompt, systemPrompt, 300);
  } catch (err) {
    console.error('[translateWord] Error:', err);
    return null;
  }
}
