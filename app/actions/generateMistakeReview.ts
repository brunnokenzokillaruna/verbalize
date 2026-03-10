'use server';

import { callGeminiJSON } from '@/services/gemini';
import type { Exercise, SupportedLanguage, ProficiencyLevel } from '@/types';

const LANG_LABEL: Record<SupportedLanguage, string> = {
  fr: 'French',
  en: 'English',
};

interface GenerateMistakeReviewParams {
  grammarFocus: string;
  mistakeContext: string;
  language: SupportedLanguage;
  level: ProficiencyLevel;
}

/**
 * Generates 3 exercises targeting a specific grammar mistake.
 * Exercise types: context-choice, error-correction, reverse-translation.
 * Returns null on any error.
 */
export async function generateMistakeReview(
  params: GenerateMistakeReviewParams,
): Promise<Exercise[] | null> {
  const { grammarFocus, mistakeContext, language, level } = params;
  const isEarly = level === 'A1' || level === 'A2';

  try {
    const systemPrompt = `You are a language exercise generator for Brazilian Portuguese speakers learning ${LANG_LABEL[language]}. Respond with ONLY a valid JSON array, no markdown, no explanation.`;

    const prompt = `A student learning ${LANG_LABEL[language]} at level ${level} made a mistake.
Grammar topic: "${grammarFocus}"
Mistake context: "${mistakeContext}"

Generate exactly 3 exercises to help them correct this mistake and reinforce the grammar point.

Exercise 1 — type "context-choice":
- Create a sentence that tests this exact grammar point
- Replace the key word with ___ in the "sentence" field
- "blankWord" is the correct answer
- "options" must have exactly 4 items: the correct word plus 3 distractors
- CRITICAL: the 3 distractors must be CLEARLY WRONG in this specific sentence — they must not make logical or grammatical sense in the blank. Choose words from different semantic fields or grammatical categories so that ONLY the correct answer fits. Never use synonyms or words from the same category that could also make the sentence true.
- "translation" is the Brazilian Portuguese translation of the full sentence

Exercise 2 — type "error-correction":
- Write a ${LANG_LABEL[language]} sentence that contains ONE deliberate error related to this grammar point
- "sentence_with_error" is the full sentence (with the error)
- "error_word" is the incorrect word or short phrase
- "correct_word" is the correct replacement
- "explanation" is a brief explanation in Brazilian Portuguese of why it is wrong

Exercise 3 — type "reverse-translation":
- "portuguese_sentence" is a natural Brazilian Portuguese sentence that exercises this grammar point
- "target_translation" is the correct ${LANG_LABEL[language]} translation
- "acceptable_variants" lists 1-2 alternative correct phrasings (or empty array)
- "hint" is ${isEarly ? 'a brief grammar tip in Portuguese' : 'omitted (leave field out)'}

Output format (exactly this structure, 3 items):
[
  {
    "type": "context-choice",
    "data": {
      "sentence": "sentence with ___",
      "blankWord": "correct word",
      "options": ["correct", "wrong1", "wrong2", "wrong3"],
      "translation": "Portuguese translation"
    }
  },
  {
    "type": "error-correction",
    "data": {
      "sentence_with_error": "sentence with one error",
      "error_word": "wrong word",
      "correct_word": "correct word",
      "explanation": "Explicação em português"
    }
  },
  {
    "type": "reverse-translation",
    "data": {
      "portuguese_sentence": "Frase em português.",
      "target_translation": "Target language sentence.",
      "acceptable_variants": [],
      "hint": "Dica opcional"
    }
  }
]`;

    const exercises = await callGeminiJSON<Exercise[]>(prompt, systemPrompt, 1200);

    if (!Array.isArray(exercises) || exercises.length < 3) {
      console.error('[generateMistakeReview] Unexpected response shape');
      return null;
    }

    return exercises.slice(0, 3);
  } catch (err) {
    console.error('[generateMistakeReview] Error:', err);
    return null;
  }
}
