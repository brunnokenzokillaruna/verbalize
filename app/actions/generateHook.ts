'use server';

import { callGemini, callGeminiJSON } from '@/services/gemini';
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

function pickNames(language: SupportedLanguage) {
  const femaleNames = language === 'fr'
    ? ['Marie', 'Sophie', 'Camille', 'Lea', 'Emma', 'Chloe', 'Manon', 'Ines', 'Sarah',
       'Jade', 'Louise', 'Alice', 'Lina', 'Julia', 'Eva', 'Clara', 'Lucie', 'Romane',
       'Agathe', 'Jeanne', 'Margaux', 'Noemie', 'Elise', 'Anais']
    : ['Emma', 'Sarah', 'Olivia', 'Chloe'];
  const maleNames = language === 'fr'
    ? ['Lucas', 'Thomas', 'Julien', 'Antoine', 'Louis', 'Hugo', 'Arthur', 'Nathan',
       'Gabriel', 'Raphael', 'Leo', 'Enzo', 'Paul', 'Jules', 'Adam', 'Victor',
       'Noah', 'Ethan', 'Mathis', 'Maxime', 'Alexandre', 'Clement', 'Baptiste', 'Romain']
    : ['Jake', 'Michael', 'Daniel', 'Ryan'];
  return {
    nameA: femaleNames[Math.floor(Math.random() * femaleNames.length)],
    nameB: maleNames[Math.floor(Math.random() * maleNames.length)],
  };
}

function pickTopic(interests: string[]) {
  const generalTopics = [
    'daily life', 'food & restaurants', 'travel', 'work & career', 'shopping',
    'health & medicine', 'sports & fitness', 'technology', 'nature & environment',
    'art & culture', 'family & relationships', 'education', 'music', 'movies & TV',
    'weather', 'transportation', 'home & living', 'hobbies', 'news & current events',
    'celebrations & holidays', 'history', 'science', 'psychology', 'philosophy',
    'politics & government', 'finance & investing', 'personal development', 'mental health',
    'design & creativity', 'gardening', 'architecture', 'internet & social media',
    'customer service', 'leadership & management', 'productivity & organization',
    'time management', 'language learning', 'culture & traditions',
  ];
  const weighted = [...generalTopics, ...interests.flatMap((i) => [i, i, i])];
  return weighted[Math.floor(Math.random() * weighted.length)];
}

const DIALOGUE_LINES: Record<ProficiencyLevel, number> = {
  A1: 4, A2: 4, B1: 6, B2: 6, C1: 8, C2: 8,
};

function fixDialogueLabels(dialogue: string, nameA: string, nameB: string): string {
  const lines = dialogue.split('\n').filter((l) => l.trim().length > 0);
  return lines
    .map((line, i) => (/^[^:\n]{1,25}:/.test(line) ? line : `${i % 2 === 0 ? nameA : nameB}: ${line}`))
    .join('\n');
}

/**
 * Super-hook: generates dialogue, grammar bridge, image keywords, and vocab
 * translations in a single Gemini call (4 096 token budget).
 *
 * Falls back automatically to a minimal hook-only call when Gemini returns
 * invalid JSON or hits a quota error, so lessons always load.
 */
export async function generateHook(params: GenerateHookParams): Promise<HookResult | null> {
  const { language, level, interests, grammarFocus } = params;
  const { nameA, nameB } = pickNames(language);
  const topic = pickTopic(interests);
  const lineCount = DIALOGUE_LINES[level];
  const lang = LANG_LABEL[language];

  const systemPrompt = `You are an expert language teacher creating content for Brazilian Portuguese speakers learning ${lang}. Respond with ONLY valid JSON, no markdown, no explanation.`;

  // ── Attempt 1: Super-hook (all fields bundled) ───────────────────────────
  const superPrompt = `Write a 2-person dialogue in ${lang} between ${nameA} and ${nameB}.

Requirements:
- ${level} level vocabulary and grammar
- Topic: ${topic}
- Naturally uses this grammar: ${grammarFocus}
- Exactly ${lineCount} lines total, alternating speakers, forming a natural flowing conversation
- Every line MUST begin with the speaker name and a colon

Output ONLY this JSON object (no extra text):
{
  "dialogue": "${nameA}: <line 1>\\n${nameB}: <line 2>\\n...",
  "dialogueTranslations": ["<pt-BR line 1>", "<pt-BR line 2>", ...],
  "newVocabulary": ["verb_infinitive", "noun1", "noun2", "noun3", "noun4"],
  "verbWord": "verb_infinitive",
  "grammarFocus": "one sentence describing the grammar used",
  "grammarBridge": {
    "rule": "4-6 sentence explanation in Brazilian Portuguese using the Portuguese Bridge Method",
    "targetExample": "Main example in ${lang} from the dialogue",
    "portugueseComparison": "Brazilian Portuguese equivalent of the main example",
    "additionalExamples": [
      { "target": "Second example in ${lang}", "portuguese": "Portuguese equivalent" },
      { "target": "Third example in ${lang}", "portuguese": "Portuguese equivalent" }
    ]
  },
  "imageKeywords": {
    "<vocab word 1>": "short English Pexels search term",
    "<vocab word 2>": "short English Pexels search term",
    "<vocab word 3>": "short English Pexels search term",
    "<vocab word 4>": "short English Pexels search term",
    "<vocab word 5>": "short English Pexels search term"
  },
  "vocabTranslations": {
    "<vocab word 1>": { "translation": "pt-BR", "explanation": "tip in Portuguese ≤20 words", "example": "sentence in ${lang}" },
    "<vocab word 2>": { "translation": "pt-BR", "explanation": "tip in Portuguese ≤20 words", "example": "sentence in ${lang}" },
    "<vocab word 3>": { "translation": "pt-BR", "explanation": "tip in Portuguese ≤20 words", "example": "sentence in ${lang}" },
    "<vocab word 4>": { "translation": "pt-BR", "explanation": "tip in Portuguese ≤20 words", "example": "sentence in ${lang}" },
    "<vocab word 5>": { "translation": "pt-BR", "explanation": "tip in Portuguese ≤20 words", "example": "sentence in ${lang}" }
  }
}

Rules:
- dialogue must have exactly ${lineCount} lines
- newVocabulary: first word is a verb (infinitive), then 4 nouns; all 5 must appear in the dialogue
- verbWord must equal newVocabulary[0]
- dialogueTranslations: ${lineCount} strings, no speaker prefix, natural Brazilian Portuguese
- imageKeywords keys must match the actual vocabulary words in newVocabulary
- vocabTranslations keys must match the actual vocabulary words in newVocabulary`;

  try {
    const result = await callGeminiJSON<HookResult>(superPrompt, systemPrompt, 4096);
    if (result?.dialogue && result?.newVocabulary?.length === 5) {
      result.dialogue = fixDialogueLabels(result.dialogue, nameA, nameB);
      return result;
    }
  } catch (err) {
    console.error('[generateHook] Super-hook failed, falling back to simple hook:', err);
  }

  // ── Fallback: minimal hook-only prompt (original behavior) ───────────────
  console.warn('[generateHook] Using simple hook fallback');
  const simplePrompt = `Write a 2-person dialogue in ${lang} between ${nameA} and ${nameB}.

Requirements:
- ${level} level vocabulary and grammar
- Topic: ${topic}
- Naturally uses this grammar: ${grammarFocus}
- Exactly ${lineCount} lines total, alternating speakers
- Every line MUST begin with the speaker name and a colon

Output this JSON (dialogue must have exactly ${lineCount} lines):
{
  "dialogue": "${nameA}: <first line>\\n${nameB}: <second line>\\n...",
  "dialogueTranslations": ["<pt-BR translation of line 1>", "<pt-BR translation of line 2>", ...],
  "newVocabulary": ["verb_infinitive", "noun1", "noun2", "noun3", "noun4"],
  "verbWord": "verb_infinitive",
  "grammarFocus": "one sentence describing the grammar used"
}

Rules for newVocabulary: first word is a verb in infinitive form, then 4 nouns; all must appear in the dialogue.
Rules for dialogueTranslations: ${lineCount} natural Brazilian Portuguese translations, no speaker prefix.`;

  try {
    const fallback = await callGeminiJSON<HookResult>(simplePrompt, systemPrompt, 1024);
    if (!fallback) return null;
    fallback.dialogue = fixDialogueLabels(fallback.dialogue, nameA, nameB);
    return fallback;
  } catch (err) {
    console.error('[generateHook] Simple hook fallback also failed:', err);
    return null;
  }
}
