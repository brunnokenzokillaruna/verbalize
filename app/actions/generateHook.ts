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

    const frenchNames = ['Marie', 'Lucas', 'Sophie', 'Thomas', 'Camille', 'Julien', 'Léa', 'Antoine'];
    const englishNames = ['Emma', 'Jake', 'Sarah', 'Michael', 'Olivia', 'Daniel', 'Chloe', 'Ryan'];
    const namePool = language === 'fr' ? frenchNames : englishNames;
    const shuffle = (arr: string[]) => [...arr].sort(() => Math.random() - 0.5);
    const [nameA, nameB] = shuffle(namePool);

    const prompt = `Write a short, natural 2-person dialogue (2–4 lines total, alternating between exactly 2 speakers).

Target language: ${LANG_LABEL[language]}
User level: ${level}
Topics of interest: ${interests.join(', ')}
Target grammar: ${grammarFocus}
Speaker 1 name: ${nameA}
Speaker 2 name: ${nameB}

Rules:
- Each line must start with the speaker's name followed by a colon, e.g. "${nameA}: ..." then "${nameB}: ...".
- Use simple vocabulary suited for ${level} level.
- Emphasize the target grammar naturally within the dialogue.
- Make it conversational and engaging.
- Write entirely in ${LANG_LABEL[language]}.

Output JSON in exactly this format:
{
  "dialogue": "${nameA}: [first line]\\n${nameB}: [second line]\\n${nameA}: [optional third line]",
  "newVocabulary": ["key", "vocabulary", "words", "to", "highlight"],
  "grammarFocus": "Brief description of the grammar pattern used"
}`;

    return await callGeminiJSON<HookResult>(prompt, systemPrompt);
  } catch (err) {
    console.error('[generateHook] Error:', err);
    return null;
  }
}
