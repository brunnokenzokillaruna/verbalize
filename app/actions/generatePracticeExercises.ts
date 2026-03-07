'use server';

import { callGeminiJSON } from '@/services/gemini';
import type { Exercise, SupportedLanguage, ProficiencyLevel } from '@/types';

const LANG_LABEL: Record<SupportedLanguage, string> = {
  fr: 'French',
  en: 'English',
};

interface GeneratePracticeParams {
  dialogue: string;
  newVocabulary: string[];
  language: SupportedLanguage;
  level: ProficiencyLevel;
}

/**
 * Generates 2 practice exercises (context-choice + reverse-translation) via Gemini.
 * A third exercise (SentenceBuilder) is constructed client-side from the dialogue.
 * Returns null on any error.
 */
export async function generatePracticeExercises(
  params: GeneratePracticeParams,
): Promise<Exercise[] | null> {
  const { dialogue, newVocabulary, language, level } = params;

  try {
    const systemPrompt = `You are a language exercise generator for Brazilian Portuguese speakers learning ${LANG_LABEL[language]}. Respond with ONLY a valid JSON array, no markdown, no explanation.`;

    const prompt = `Based on this ${LANG_LABEL[language]} dialogue at ${level} level:
"${dialogue}"

Key vocabulary words: ${newVocabulary.join(', ')}

Generate exactly 2 exercises as a JSON array:

Exercise 1 — type "context-choice":
- Take ONE sentence from the dialogue that contains a key vocabulary word
- Replace that word with ___ in the "sentence" field
- The "blankWord" is the correct answer
- "options" must have exactly 4 items: the correct word plus 3 plausible wrong options
- "translation" is the Brazilian Portuguese translation of the full original sentence

Exercise 2 — type "reverse-translation":
- "portuguese_sentence" is a natural Brazilian Portuguese sentence related to the dialogue theme
- "target_translation" is the correct ${LANG_LABEL[language]} translation
- "acceptable_variants" lists 1-2 alternative correct phrasings (or empty array)
- "hint" is an optional grammar tip in Portuguese (include only for ${level === 'A1' || level === 'A2' ? 'A1/A2' : 'no hint needed for this level'})

Output format (exactly this structure):
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
    "type": "reverse-translation",
    "data": {
      "portuguese_sentence": "Frase em português.",
      "target_translation": "Target language sentence.",
      "acceptable_variants": [],
      "hint": "Optional grammar tip or omit this field"
    }
  }
]`;

    const exercises = await callGeminiJSON<Exercise[]>(prompt, systemPrompt);

    // Validate we got an array with the expected types
    if (!Array.isArray(exercises) || exercises.length < 2) {
      console.error('[generatePracticeExercises] Unexpected response shape');
      return null;
    }

    return exercises;
  } catch (err) {
    console.error('[generatePracticeExercises] Error:', err);
    return null;
  }
}
