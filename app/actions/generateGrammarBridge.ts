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

Use the Portuguese Bridge Method: compare the ${LANG_LABEL[language]} structure directly to Brazilian Portuguese.
Write a thorough but accessible explanation of 4-6 sentences in Brazilian Portuguese, covering:
1. What the rule is
2. How it compares/contrasts with Portuguese
3. Any important nuances or exceptions a Brazilian learner must know

Then provide the main example plus 2 additional varied examples.

Output JSON in exactly this format:
{
  "rule": "Thorough explanation in Brazilian Portuguese (4-6 sentences, using the Portuguese Bridge Method)",
  "targetExample": "Main example sentence in ${LANG_LABEL[language]} from or inspired by the dialogue",
  "portugueseComparison": "The Brazilian Portuguese equivalent of the main example",
  "additionalExamples": [
    { "target": "Second example sentence in ${LANG_LABEL[language]}", "portuguese": "Its Brazilian Portuguese equivalent" },
    { "target": "Third example sentence in ${LANG_LABEL[language]}", "portuguese": "Its Brazilian Portuguese equivalent" }
  ]
}`;

    return await callGeminiJSON<GrammarBridgeResult>(prompt, systemPrompt, 900);
  } catch (err) {
    console.error('[generateGrammarBridge] Error:', err);
    return null;
  }
}
