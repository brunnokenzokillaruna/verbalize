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
  isNewVerb?: boolean,
): Promise<TranslateWordResult | null> {
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

    const prompt = `A user clicked on the word "${word}" inside the sentence "${sentence}".

Provide a quick, helpful explanation in Brazilian Portuguese.
${verbInstruction}

Output JSON in exactly this format:
{
  "translation": "Portuguese translation of the word",
  "explanation": "One sentence explaining usage or grammar tip (in Portuguese, max 20 words)",
  "example": "A new example sentence using the same word in ${LANG_LABEL[language]} only",
  "partOfSpeech": "Only if this is a new verb, set this to 'Verbo', otherwise omit or set to null",
  "infinitive": "Only if this is a new verb, set this to its infinitive form, otherwise omit or set to null"
}

Rules:
- Keep explanation under 20 words in Portuguese.
- The example must be in ${LANG_LABEL[language]} only (no Portuguese).
- Use simple vocabulary appropriate for beginners.`;

    return await callGeminiJSON<TranslateWordResult>(prompt, systemPrompt, 500, 0);
  } catch (err) {
    console.error('[translateWord] Error:', err);
    return null;
  }
}
