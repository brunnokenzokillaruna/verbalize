'use server';

import { callGeminiJSON } from '@/services/gemini';
import type { SupportedLanguage, ProficiencyLevel, HookResult } from '@/types';

const LANG_LABEL: Record<SupportedLanguage, string> = {
  fr: 'French',
  en: 'English',
};

interface GenerateHookParams {
  language: SupportedLanguage;
  level: ProficiencyLevel;
  interests: string[];
  grammarFocus: string;
}

/**
 * Generates a short dialogue (Hook) for a lesson using Gemini (Prompt #1).
 * Returns null on any error.
 */
export async function generateHook(params: GenerateHookParams): Promise<HookResult | null> {
  const { language, level, interests, grammarFocus } = params;

  try {
    const systemPrompt = `You are an expert language teacher creating content for Brazilian Portuguese speakers learning ${LANG_LABEL[language]}. Respond with ONLY valid JSON, no markdown, no explanation.`;

    const prompt = `Write a short, natural dialogue or micro-story (2–4 sentences maximum).

Target language: ${LANG_LABEL[language]}
User level: ${level}
Topics of interest: ${interests.join(', ')}
Target grammar: ${grammarFocus}

Rules:
- Use simple vocabulary suited for ${level} level.
- Emphasize the target grammar naturally within the dialogue.
- Make it conversational and engaging.
- Write entirely in ${LANG_LABEL[language]}.

Output JSON in exactly this format:
{
  "dialogue": "The full dialogue text (use \\n for line breaks between speakers)",
  "newVocabulary": ["key", "vocabulary", "words", "to", "highlight"],
  "grammarFocus": "Brief description of the grammar pattern used"
}`;

    return await callGeminiJSON<HookResult>(prompt, systemPrompt);
  } catch (err) {
    console.error('[generateHook] Error:', err);
    return null;
  }
}
