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
 * Generates 5 practice exercises via Gemini:
 * context-choice, error-correction, reverse-translation, audio-dictation, reverse-translation.
 * Two additional SentenceBuilder exercises are constructed client-side from the dialogue.
 * Returns null on any error.
 */
export async function generatePracticeExercises(
  params: GeneratePracticeParams,
): Promise<Exercise[] | null> {
  const { dialogue, newVocabulary, language, level } = params;
  const isEarly = level === 'A1' || level === 'A2';

  try {
    const systemPrompt = `You are a language exercise generator for Brazilian Portuguese speakers learning ${LANG_LABEL[language]}. Respond with ONLY a valid JSON array, no markdown, no explanation.`;

    const prompt = `Based on this ${LANG_LABEL[language]} dialogue at ${level} level:
"${dialogue}"

Key vocabulary words: ${newVocabulary.join(', ')}

Generate exactly 5 exercises as a JSON array:

Exercise 1 — type "context-choice":
- Take ONE sentence from the dialogue that contains a key vocabulary word
- Replace that word with ___ in the "sentence" field
- "blankWord" is the correct answer
- "options" must have exactly 4 items: the correct word plus 3 plausible wrong options
- "translation" is the Brazilian Portuguese translation of the full original sentence

Exercise 2 — type "error-correction":
- Write a ${LANG_LABEL[language]} sentence inspired by the dialogue but containing ONE deliberate grammatical or vocabulary error
- "sentence_with_error" is the full sentence as written (with the error)
- "error_word" is the incorrect word or short phrase
- "correct_word" is the correct replacement
- "explanation" is a brief explanation in Brazilian Portuguese of why it is wrong

Exercise 3 — type "reverse-translation":
- "portuguese_sentence" is a natural Brazilian Portuguese sentence related to the dialogue theme
- "target_translation" is the correct ${LANG_LABEL[language]} translation
- "acceptable_variants" lists 1-2 alternative correct phrasings (or empty array)
- "hint" is ${isEarly ? 'an optional grammar tip in Portuguese' : 'omitted (leave field out)'}

Exercise 4 — type "audio-dictation":
- "text" is a sentence taken directly from the dialogue (in ${LANG_LABEL[language]}, without the speaker name)
- "translation" is the Brazilian Portuguese translation of that sentence

Exercise 5 — type "reverse-translation":
- A second, different reverse-translation exercise
- Use a different sentence or theme variation from Exercise 3
- Same fields as Exercise 3

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
      "portuguese_sentence": "Primeira frase em português.",
      "target_translation": "First target language sentence.",
      "acceptable_variants": [],
      "hint": "Dica gramatical opcional"
    }
  },
  {
    "type": "audio-dictation",
    "data": {
      "text": "A sentence from the dialogue in ${LANG_LABEL[language]}",
      "translation": "Portuguese translation"
    }
  },
  {
    "type": "reverse-translation",
    "data": {
      "portuguese_sentence": "Segunda frase diferente em português.",
      "target_translation": "Second different target language sentence.",
      "acceptable_variants": [],
      "hint": "Dica gramatical opcional"
    }
  }
]`;

    const exercises = await callGeminiJSON<Exercise[]>(prompt, systemPrompt);

    // Validate we got an array with the expected types
    if (!Array.isArray(exercises) || exercises.length < 4) {
      console.error('[generatePracticeExercises] Unexpected response shape');
      return null;
    }

    return exercises;
  } catch (err) {
    console.error('[generatePracticeExercises] Error:', err);
    return null;
  }
}
