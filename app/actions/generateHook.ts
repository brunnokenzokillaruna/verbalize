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

  // Always pair one female name (nameA / voice A) with one male name (nameB / voice B)
  const femaleNames = language === 'fr'
    ? ['Marie', 'Sophie', 'Camille', 'Lea',
      'Emma', 'Chloe', 'Manon', 'Ines', 'Sarah',
      'Jade', 'Louise', 'Alice', 'Lina', 'Julia',
      'Eva', 'Clara', 'Lucie', 'Romane',
      'Agathe', 'Jeanne', 'Margaux', 'Noemie',
      'Elise', 'Anais']
    : ['Emma', 'Sarah', 'Olivia', 'Chloe'];
  const maleNames = language === 'fr'
    ? ['Lucas', 'Thomas', 'Julien', 'Antoine',
      'Louis', 'Hugo', 'Arthur', 'Nathan',
      'Gabriel', 'Raphael', 'Leo', 'Enzo',
      'Paul', 'Jules', 'Adam', 'Victor',
      'Noah', 'Ethan', 'Mathis', 'Maxime',
      'Alexandre', 'Clement', 'Baptiste', 'Romain']
    : ['Jake', 'Michael', 'Daniel', 'Ryan'];
  const nameA = femaleNames[Math.floor(Math.random() * femaleNames.length)];
  const nameB = maleNames[Math.floor(Math.random() * maleNames.length)];

  // Pick ONE random interest per lesson so every dialogue has a fresh theme
  const topicPool = interests.length > 0 ? interests : ['daily life'];
  const topic = topicPool[Math.floor(Math.random() * topicPool.length)];

  try {
    const systemPrompt = `You are an expert language teacher creating content for Brazilian Portuguese speakers learning ${LANG_LABEL[language]}. Respond with ONLY valid JSON, no markdown, no explanation.`;

    const prompt = `Write a rich 2-person dialogue in ${LANG_LABEL[language]} between ${nameA} and ${nameB}.

Requirements:
- ${level} level vocabulary and grammar
- Topic: ${topic}
- Naturally uses this grammar: ${grammarFocus}
- 6 to 8 lines total, alternating speakers, forming a natural flowing conversation
- Include natural conversational turns (questions, answers, reactions, follow-ups)
- Every line MUST begin with the speaker name and a colon

Example of the required format (replace with real content in ${LANG_LABEL[language]}):
${nameA}: Bonjour, comment tu t'appelles ?
${nameB}: Je m'appelle ${nameB}. Et toi ?

Output this JSON:
{
  "dialogue": "${nameA}: <first line>\\n${nameB}: <second line>\\n${nameA}: <third line>\\n${nameB}: <fourth line>\\n...",
  "newVocabulary": ["word1", "word2", "word3", "word4", "word5", "word6"],
  "grammarFocus": "one sentence describing the grammar used"
}`;

    const result = await callGeminiJSON<HookResult>(prompt, systemPrompt);
    if (!result) return null;

    // Post-process: ensure EVERY line has "Name: " prefix.
    // Gemini sometimes labels only the first line; check each line individually.
    const lines = result.dialogue.split('\n').filter((l) => l.trim().length > 0);
    result.dialogue = lines
      .map((line, i) => {
        if (/^[^:\n]{1,25}:/.test(line)) return line; // already labelled
        return `${i % 2 === 0 ? nameA : nameB}: ${line}`;
      })
      .join('\n');

    return result;
  } catch (err) {
    console.error('[generateHook] Error:', err);
    return null;
  }
}
