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

  const frenchNames = ['Marie', 'Lucas', 'Sophie', 'Thomas', 'Camille', 'Julien', 'Léa', 'Antoine'];
  const englishNames = ['Emma', 'Jake', 'Sarah', 'Michael', 'Olivia', 'Daniel', 'Chloe', 'Ryan'];
  const namePool = language === 'fr' ? frenchNames : englishNames;
  const [nameA, nameB] = [...namePool].sort(() => Math.random() - 0.5);

  try {
    const systemPrompt = `You are an expert language teacher creating content for Brazilian Portuguese speakers learning ${LANG_LABEL[language]}. Respond with ONLY valid JSON, no markdown, no explanation.`;

    const prompt = `Write a short 2-person dialogue in ${LANG_LABEL[language]} between ${nameA} and ${nameB}.

Requirements:
- ${level} level vocabulary and grammar
- Topic: ${interests.join(', ')}
- Naturally uses this grammar: ${grammarFocus}
- 2 to 4 lines total, alternating speakers
- Every line MUST begin with the speaker name and a colon

Example of the required format (replace with real content in ${LANG_LABEL[language]}):
${nameA}: Bonjour, comment tu t'appelles ?
${nameB}: Je m'appelle ${nameB}. Et toi ?

Output this JSON:
{
  "dialogue": "${nameA}: <first line>\\n${nameB}: <second line>",
  "newVocabulary": ["word1", "word2", "word3"],
  "grammarFocus": "one sentence describing the grammar used"
}`;

    const result = await callGeminiJSON<HookResult>(prompt, systemPrompt);
    if (!result) return null;

    // Post-process: ensure every line has "Name: " prefix.
    // Gemini sometimes ignores format instructions; this guarantees the UI
    // can always parse speaker names.
    const lines = result.dialogue.split('\n').filter((l) => l.trim().length > 0);
    const alreadyLabelled = lines.length > 0 && /^[^:\n]{1,25}:/.test(lines[0]);
    if (!alreadyLabelled) {
      result.dialogue = lines
        .map((line, i) => `${i % 2 === 0 ? nameA : nameB}: ${line}`)
        .join('\n');
    }

    return result;
  } catch (err) {
    console.error('[generateHook] Error:', err);
    return null;
  }
}
