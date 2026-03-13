'use server';

import { callGeminiJSON } from '@/services/gemini';
import type { Exercise, SupportedLanguage, ProficiencyLevel } from '@/types';

const LANG_LABEL: Record<SupportedLanguage, string> = {
  fr: 'French',
  en: 'English',
};

const LEVEL_EXERCISE_DESCRIPTORS: Record<ProficiencyLevel, string> = {
  A1: 'A1 BEGINNER: use only the 300–500 most common everyday words. Sentences max 8 words. Simple present tense only. No subordinate clauses. Very short, clear sentences.',
  A2: 'A2 ELEMENTARY: use everyday vocabulary (up to 1,500 words). Sentences 8–12 words. Present, simple past, futur proche / going to. Basic connectors (and, but, because).',
  B1: 'B1 INTERMEDIATE: intermediate vocabulary (up to 3,000 words). Sentences 10–16 words. Can use past, future, conditional, simple relative clauses.',
  B2: 'B2 UPPER-INTERMEDIATE: varied vocabulary (up to 6,000 words). Complex sentences allowed. Passive voice, subjunctive, complex conjunctions are fine.',
  C1: 'C1 ADVANCED: rich and precise vocabulary. Idiomatic, formal register welcome. Long complex sentences with multiple subordinate clauses.',
  C2: 'C2 MASTERY: fully native-level. Any register, tense, or structure. Stylistic sophistication expected.',
};

interface GeneratePracticeParams {
  dialogue: string;
  newVocabulary: string[];
  verbWord: string;
  language: SupportedLanguage;
  level: ProficiencyLevel;
}

/**
 * Generates 8 practice exercises via Gemini:
 *   2× context-choice, 2× error-correction, 2× reverse-translation,
 *   1× audio-dictation, 1× speak-repeat.
 * Two more are built client-side: sentence-builder + image-match → 10 total.
 * Returns null on any error.
 */
export async function generatePracticeExercises(
  params: GeneratePracticeParams,
): Promise<Exercise[] | null> {
  const { dialogue, newVocabulary, language, level } = params;
  const isEarly = level === 'A1' || level === 'A2';
  const levelDesc = LEVEL_EXERCISE_DESCRIPTORS[level];

  try {
    const systemPrompt = `You are a language exercise generator for Brazilian Portuguese speakers learning ${LANG_LABEL[language]}. Respond with ONLY a valid JSON array, no markdown, no explanation.`;

    const prompt = `Based on this ${LANG_LABEL[language]} dialogue at ${level} level:
"${dialogue}"

Key vocabulary words: ${newVocabulary.join(', ')}

LEVEL CONSTRAINTS — all sentences you write must follow these rules: ${levelDesc}

Generate exactly 8 exercises as a JSON array in this order:

Exercise 1 — type "context-choice":
- Take ONE sentence from the dialogue that contains a key vocabulary word
- Replace that word with ___ in the "sentence" field
- "blankWord" is the correct answer
- "options" must have exactly 4 items: the correct word plus 3 distractors
- CRITICAL: the 3 distractors must be CLEARLY WRONG in this specific sentence — they must not make logical or grammatical sense in the blank. Choose words from different semantic fields or grammatical categories so that ONLY the correct answer fits. Never use synonyms or words from the same category that could also make the sentence true.
- "translation" is the Brazilian Portuguese translation of the full original sentence

Exercise 2 — type "error-correction":
- Write a ${LANG_LABEL[language]} sentence inspired by the dialogue but containing ONE deliberate grammatical or vocabulary error
- "sentence_with_error" is the full sentence as written (with the error)
- "error_word" is the incorrect word or short phrase
- "correct_word" is the ideal correct replacement (the word that best fits the intended meaning)
- "acceptable_answers" is an array of OTHER words that are also grammatically correct in that slot and would demonstrate the same grammar concept (e.g. if the slot takes a demonstrative determiner, list all valid ones like ["ce", "cet", "cette", "ces"] minus the one already in correct_word). If no valid alternatives exist, use an empty array.
- "explanation" is a brief explanation in Brazilian Portuguese of why the error is wrong and what the correct form should be
- CRITICAL: "error_word" must appear EXACTLY ONCE in "sentence_with_error". Write the sentence so the error word does not repeat elsewhere. The sentence must be grammatically clean except for that single deliberate error.
- CRITICAL: The sentence_with_error must be OBJECTIVELY AND UNAMBIGUOUSLY WRONG. A native speaker would immediately recognize the error. NEVER create trick sentences where the "error" is actually grammatically valid.
- SELF-CHECK before outputting: ask yourself "Is this sentence clearly wrong? Would every native speaker agree it contains an error?" If there is any doubt, choose a different, clearer error.
- GOOD error types (clear and unambiguous): wrong verb conjugation ("ils mange" → "mangent"), wrong gender agreement ("un belle maison" → "une belle"), wrong subject pronoun, missing negation particle ("je pas mange" → "ne…pas"), wrong preposition required by a specific verb.
- BAD error types (AVOID — too ambiguous): swapping determiners that could both be valid (le/ce/mon/son), word-order variations acceptable in informal speech, register differences.

Exercise 3 — type "reverse-translation":
- "portuguese_sentence" is a natural Brazilian Portuguese sentence related to the dialogue theme
- "target_translation" is the correct ${LANG_LABEL[language]} translation
- "acceptable_variants" lists 1-2 alternative correct phrasings (or empty array)
- "hint" is ${isEarly ? 'an optional grammar tip in Portuguese' : 'omitted (leave field out)'}

Exercise 4 — type "audio-dictation":
- "text" is a sentence taken directly from the dialogue (in ${LANG_LABEL[language]}, without the speaker name prefix)
- "translation" is the Brazilian Portuguese translation of that sentence

Exercise 5 — type "speak-repeat":
- Pick ONE sentence from the dialogue (without the speaker name prefix)
- "text" is that sentence in ${LANG_LABEL[language]}
- "translation" is the Brazilian Portuguese translation

Exercise 6 — type "context-choice" (second one, different sentence and word from Exercise 1):
- Same rules as Exercise 1 (including the CRITICAL distractor rule) but use a different sentence and vocabulary word

Exercise 7 — type "error-correction" (second one, different sentence from Exercise 2):
- Same rules as Exercise 2 but write a completely different sentence with a different error

Exercise 8 — type "reverse-translation" (second one, different sentence from Exercise 3):
- Same rules as Exercise 3 but use a different Brazilian Portuguese sentence

Output format (exactly this structure, 8 items):
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
      "acceptable_answers": ["other_valid_word1", "other_valid_word2"],
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
    "type": "speak-repeat",
    "data": {
      "text": "A sentence from the dialogue",
      "translation": "Portuguese translation"
    }
  },
  {
    "type": "context-choice",
    "data": {
      "sentence": "different sentence with ___",
      "blankWord": "correct word",
      "options": ["correct", "wrong1", "wrong2", "wrong3"],
      "translation": "Portuguese translation"
    }
  },
  {
    "type": "error-correction",
    "data": {
      "sentence_with_error": "different sentence with one error",
      "error_word": "wrong word",
      "correct_word": "correct word",
      "acceptable_answers": ["other_valid_word1", "other_valid_word2"],
      "explanation": "Explicação em português"
    }
  },
  {
    "type": "reverse-translation",
    "data": {
      "portuguese_sentence": "Outra frase em português.",
      "target_translation": "Target language sentence.",
      "acceptable_variants": [],
      "hint": "Dica gramatical opcional"
    }
  }
]`;

    const exercises = await callGeminiJSON<Exercise[]>(prompt, systemPrompt, 2048);

    if (!Array.isArray(exercises) || exercises.length < 7) {
      console.error('[generatePracticeExercises] Unexpected response shape');
      return null;
    }

    // Structural validation: remove error-correction exercises where
    // error_word is absent from the sentence or equals correct_word
    // (catches obvious Gemini mistakes before they reach the user)
    const validated = exercises.filter((ex) => {
      if (ex.type !== 'error-correction') return true;
      const { sentence_with_error, error_word, correct_word } = ex.data as {
        sentence_with_error: string; error_word: string; correct_word: string;
      };
      const ok = sentence_with_error?.includes(error_word) && error_word !== correct_word;
      if (!ok) console.warn('[generatePracticeExercises] Dropped malformed error-correction exercise');
      return ok;
    });

    return validated;
  } catch (err) {
    console.error('[generatePracticeExercises] Error:', err);
    return null;
  }
}
