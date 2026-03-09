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
  verbWord: string;
  language: SupportedLanguage;
  level: ProficiencyLevel;
}

/**
 * Generates 6 practice exercises via Gemini:
 *   context-choice, error-correction, reverse-translation,
 *   audio-dictation, verb-conjugation-drill, speak-repeat.
 * Two more exercises are constructed client-side (sentence-builder, image-match).
 * Returns null on any error.
 */
export async function generatePracticeExercises(
  params: GeneratePracticeParams,
): Promise<Exercise[] | null> {
  const { dialogue, newVocabulary, verbWord, language, level } = params;
  const isEarly = level === 'A1' || level === 'A2';

  // Pronouns for conjugation drill
  const pronouns = language === 'fr'
    ? ['je', 'tu', 'il/elle', 'nous', 'vous', 'ils/elles']
    : ['I', 'you', 'he/she', 'we', 'you (pl.)', 'they'];

  try {
    const systemPrompt = `You are a language exercise generator for Brazilian Portuguese speakers learning ${LANG_LABEL[language]}. Respond with ONLY a valid JSON array, no markdown, no explanation.`;

    const prompt = `Based on this ${LANG_LABEL[language]} dialogue at ${level} level:
"${dialogue}"

Key vocabulary words: ${newVocabulary.join(', ')}
Verb to conjugate: ${verbWord}

Generate exactly 6 exercises as a JSON array:

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
- "text" is a sentence taken directly from the dialogue (in ${LANG_LABEL[language]}, without the speaker name prefix)
- "translation" is the Brazilian Portuguese translation of that sentence

Exercise 5 — type "verb-conjugation-drill":
- Conjugate the verb "${verbWord}" in the present tense
- "verb" is "${verbWord}"
- "tense" is the tense label in ${LANG_LABEL[language]} (e.g. "présent" or "present simple")
- "conjugations" is an array of ALL 6 pronoun forms using these exact pronouns: ${pronouns.join(', ')}
  Each item: { "pronoun": "...", "form": "conjugated form", "blank": true/false }
  Mark exactly 3 forms as blank: true (choose varied persons, not consecutive)
- "tip" is an optional short memory tip in Brazilian Portuguese (or omit the field)

Exercise 6 — type "speak-repeat":
- Pick ONE sentence from the dialogue (without the speaker name prefix)
- "text" is that sentence in ${LANG_LABEL[language]}
- "translation" is the Brazilian Portuguese translation

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
      "portuguese_sentence": "Frase em português.",
      "target_translation": "Target language sentence.",
      "acceptable_variants": [],
      "hint": "Dica gramatical opcional"
    }
  },
  {
    "type": "audio-dictation",
    "data": {
      "text": "A sentence from the dialogue",
      "translation": "Portuguese translation"
    }
  },
  {
    "type": "verb-conjugation-drill",
    "data": {
      "verb": "${verbWord}",
      "tense": "présent",
      "conjugations": [
        { "pronoun": "${pronouns[0]}", "form": "...", "blank": false },
        { "pronoun": "${pronouns[1]}", "form": "...", "blank": true },
        { "pronoun": "${pronouns[2]}", "form": "...", "blank": false },
        { "pronoun": "${pronouns[3]}", "form": "...", "blank": true },
        { "pronoun": "${pronouns[4]}", "form": "...", "blank": false },
        { "pronoun": "${pronouns[5]}", "form": "...", "blank": true }
      ],
      "tip": "Dica opcional"
    }
  },
  {
    "type": "speak-repeat",
    "data": {
      "text": "A sentence from the dialogue",
      "translation": "Portuguese translation"
    }
  }
]`;

    const exercises = await callGeminiJSON<Exercise[]>(prompt, systemPrompt);

    if (!Array.isArray(exercises) || exercises.length < 5) {
      console.error('[generatePracticeExercises] Unexpected response shape');
      return null;
    }

    return exercises;
  } catch (err) {
    console.error('[generatePracticeExercises] Error:', err);
    return null;
  }
}
