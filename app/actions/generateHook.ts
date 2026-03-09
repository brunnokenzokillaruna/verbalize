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

  // Pick ONE topic per lesson using weighted selection:
  // user's interests appear 3× (higher probability) alongside a general pool (1× each)
  const generalTopics = [
    'daily life', 'food & restaurants', 'travel', 'work & career', 'shopping',
    'health & medicine', 'sports & fitness', 'technology', 'nature & environment',
    'art & culture', 'family & relationships', 'education', 'music', 'movies & TV',
    'weather', 'transportation', 'home & living', 'hobbies', 'news & current events',
    'celebrations & holidays', 'history', 'science', 'psychology', 'philosophy', 'politics & government',
    'finance & investing', 'personal development', 'mental health', 'design & creativity',
    'gardening', 'architecture', 'internet & social media', 'customer service', 'leadership & management',
    'productivity & organization', 'time management', 'language learning', 'culture & traditions',
  ];
  const weightedPool = [
    ...generalTopics,
    ...interests.flatMap((i) => [i, i, i]), // user interests at 3× weight
  ];
  const topic = weightedPool[Math.floor(Math.random() * weightedPool.length)];

  const dialogueLines: Record<ProficiencyLevel, number> = {
    A1: 4, A2: 4,
    B1: 6, B2: 6,
    C1: 8, C2: 8,
  };
  const lineCount = dialogueLines[level];

  try {
    const systemPrompt = `You are an expert language teacher creating content for Brazilian Portuguese speakers learning ${LANG_LABEL[language]}. Respond with ONLY valid JSON, no markdown, no explanation.`;

    const prompt = `Write a 2-person dialogue in ${LANG_LABEL[language]} between ${nameA} and ${nameB}.

Requirements:
- ${level} level vocabulary and grammar
- Topic: ${topic}
- Naturally uses this grammar: ${grammarFocus}
- Exactly ${lineCount} lines total, alternating speakers, forming a natural flowing conversation
- Include natural conversational turns (questions, answers, reactions, follow-ups)
- Every line MUST begin with the speaker name and a colon

Example of the required format (replace with real content in ${LANG_LABEL[language]}):
${nameA}: Bonjour, comment tu t'appelles ?
${nameB}: Je m'appelle ${nameB}. Et toi ?

Output this JSON (dialogue must have exactly ${lineCount} lines):
{
  "dialogue": "${nameA}: <first line>\\n${nameB}: <second line>\\n...",
  "dialogueTranslations": ["<pt-BR translation of line 1>", "<pt-BR translation of line 2>", ...],
  "newVocabulary": ["verb_infinitive", "noun1", "noun2", "noun3", "noun4"],
  "verbWord": "verb_infinitive",
  "grammarFocus": "one sentence describing the grammar used"
}

Rules for newVocabulary:
- Exactly 5 words: the FIRST word must be 1 verb in its infinitive form, then exactly 4 nouns
- verbWord MUST equal newVocabulary[0]
- All 5 words must appear naturally in the dialogue

Rules for dialogueTranslations:
- Exactly ${lineCount} strings, one natural Brazilian Portuguese translation per dialogue line
- Do NOT include the speaker name prefix — translate only the spoken text`;

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
