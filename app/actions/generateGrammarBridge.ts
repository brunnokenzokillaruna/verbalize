'use server';

import { callGeminiJSON } from '@/services/gemini';
import type { SupportedLanguage, GrammarBridgeResult } from '@/types';

const LANG_LABEL: Record<SupportedLanguage, string> = {
  fr: 'French',
  en: 'English',
};

interface GenerateGrammarBridgeParams {
  dialogue: string;
  grammarFocus: string;
  language: SupportedLanguage;
}

/**
 * Generates a Grammar Bridge explanation using the Portuguese Bridge Method (Prompt #2).
 * Output maps directly to GrammarBridgeCard props.
 * Returns null on any error.
 */
export async function generateGrammarBridge(
  params: GenerateGrammarBridgeParams,
): Promise<GrammarBridgeResult | null> {
  const { dialogue, grammarFocus, language } = params;

  try {
    const systemPrompt = `You are an expert language teacher using the Portuguese Bridge Method for Brazilian Portuguese speakers learning ${LANG_LABEL[language]}. Respond with ONLY valid JSON, no markdown, no explanation.`;

    const prompt = `Explain the grammar pattern "${grammarFocus}" from this dialogue:

"${dialogue}"

Use the Portuguese Bridge Method: compare the ${LANG_LABEL[language]} structure directly to Brazilian Portuguese. Keep the explanation under 3 sentences total.

Output JSON in exactly this format:
{
  "rule": "Short explanation in Brazilian Portuguese (under 3 sentences, comparing to Portuguese structure)",
  "targetExample": "One example sentence in ${LANG_LABEL[language]} from or inspired by the dialogue",
  "portugueseComparison": "The Brazilian Portuguese equivalent of that sentence"
}`;

    return await callGeminiJSON<GrammarBridgeResult>(prompt, systemPrompt);
  } catch (err) {
    console.error('[generateGrammarBridge] Error:', err);
    return null;
  }
}
