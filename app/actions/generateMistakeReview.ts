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
  /** Number of exercises to generate. Defaults to 3 (lesson review). Use 5 for profile review. */
  count?: number;
  /**
   * Words the student already knows. When provided, the AI will prefer these
   * words in exercise sentences so the student can focus on grammar, not vocabulary.
   * Pass up to 30 words; extras are silently ignored.
   */
  knownVocabulary?: string[];
}

/**
 * Generates exercises targeting a specific grammar mistake.
 * count=3 (default): context-choice, error-correction, reverse-translation
 * count=5: adds a second context-choice and a second reverse-translation
 * Returns null on any error.
 */
export async function generateMistakeReview(
  params: GenerateMistakeReviewParams,
): Promise<Exercise[] | null> {
  const { grammarFocus, mistakeContext, language, level, count = 3, knownVocabulary } = params;
  const isEarly = level === 'A1' || level === 'A2';
  const isFive = count >= 5;
  const isEarlyLearner = !knownVocabulary || knownVocabulary.length < 30;
  const vocabHint = isEarlyLearner
    ? `\nVOCABULARY CONSTRAINT: The learner is a beginner with very limited vocabulary. All exercise sentences must use ONLY: basic function words (articles, prepositions, pronouns, conjunctions, auxiliary verbs) and simple A1-level everyday words. Do NOT use any advanced or uncommon content words.${knownVocabulary && knownVocabulary.length > 0 ? ` Words the student already knows: ${knownVocabulary.join(', ')}.` : ''}`
    : `\nVOCABULARY CONSTRAINT: All exercise sentences must use EXCLUSIVELY words the learner already knows: [${knownVocabulary!.slice(-200).join(', ')}], plus basic function words (articles, prepositions, pronouns, conjunctions, auxiliary verbs). Do NOT introduce unknown content words.`;

  try {
    const systemPrompt = `You are a language exercise generator for Brazilian Portuguese speakers learning ${LANG_LABEL[language]}. Respond with ONLY a valid JSON array, no markdown, no explanation.`;

    const extraExercises = isFive ? `

Exercise 4 — type "context-choice":
- Create a DIFFERENT sentence (not the same as Exercise 1) that tests this exact grammar point
- Replace the key word with ___ in the "sentence" field
- "blankWord" is the correct answer
- "options" must have exactly 4 items: the correct word plus 3 distractors
- CRITICAL: the 3 distractors must be CLEARLY WRONG in this specific sentence
- "translation" is the Brazilian Portuguese translation of the full sentence

Exercise 5 — type "reverse-translation":
- "portuguese_sentence" MUST be written ENTIRELY in Brazilian Portuguese — do NOT include any ${LANG_LABEL[language]} words. Write a DIFFERENT sentence from Exercise 3 that exercises this grammar point
- "target_translation" is the correct ${LANG_LABEL[language]} translation
- "acceptable_variants" lists 1-2 alternative correct phrasings (or empty array)
- "hint" is ${isEarly ? 'a brief grammar tip in Portuguese' : 'omitted (leave field out)'}` : '';

    const extraJson = isFive ? `,
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
    "type": "reverse-translation",
    "data": {
      "portuguese_sentence": "Outra frase em português.",
      "target_translation": "Target language sentence.",
      "acceptable_variants": [],
      "hint": "Dica opcional"
    }
  }` : '';

    const prompt = `A student learning ${LANG_LABEL[language]} at level ${level} made a mistake.
Grammar topic: "${grammarFocus}"
Mistake context: "${mistakeContext}"${vocabHint}

Generate exactly ${isFive ? 5 : 3} exercises to help them correct this mistake and reinforce the grammar point.

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
- "correct_word" is the ideal correct replacement
- "acceptable_answers" is an array of OTHER words that are also grammatically correct in that slot and demonstrate the same grammar concept. If no valid alternatives exist, use an empty array.
- "explanation" is a brief explanation in Brazilian Portuguese of why the error is wrong and what the correct form should be
- CRITICAL: "error_word" must appear EXACTLY ONCE in "sentence_with_error". Write the sentence so the error word does not repeat elsewhere. The sentence must be grammatically clean except for that single deliberate error.
- CRITICAL: The sentence_with_error must be OBJECTIVELY AND UNAMBIGUOUSLY WRONG. A native speaker would immediately recognize the error. NEVER create trick sentences where the "error" is actually grammatically valid.
- SELF-CHECK before outputting: ask yourself "Is this sentence clearly wrong? Would every native speaker agree it contains an error?" If there is any doubt, choose a different, clearer error.
- GOOD error types (clear and unambiguous): wrong verb conjugation, wrong gender agreement, wrong subject pronoun, missing negation particle, wrong required preposition.
- BAD error types (AVOID — too ambiguous): swapping determiners that could both be valid, word-order variations acceptable in informal speech, register differences.
- CRITICAL — ELISION/CONTRACTION RULE: When the error involves elision or contraction (e.g., "Je" before a vowel that should become "J'"), the "error_word" MUST span ALL words involved in the contraction, and "correct_word" MUST be the complete contracted result. NEVER set correct_word to a bare clitic like "J'" that cannot stand alone. Example: error_word="Je écoute" → correct_word="J'écoute" (NOT error_word="Je" → correct_word="J'"). The same rule applies to "de + vowel" → "d'", "le/la + vowel" → "l'", etc.

Exercise 3 — type "reverse-translation":
- "portuguese_sentence" MUST be written ENTIRELY in Brazilian Portuguese — do NOT include any ${LANG_LABEL[language]} words. Express the meaning using only Portuguese words (e.g., use "Há" instead of "Il y a", "Existe" instead of "There is", etc.)
- "target_translation" is the correct ${LANG_LABEL[language]} translation of that Portuguese sentence
- "acceptable_variants" lists 1-2 alternative correct phrasings (or empty array)
- "hint" is ${isEarly ? 'a brief grammar tip in Portuguese' : 'omitted (leave field out)'}${extraExercises}

Output format (exactly this structure, ${isFive ? 5 : 3} items):
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
      "acceptable_answers": ["other_valid_word1"],
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
  }${extraJson}
]`;

    const exercises = await callGeminiJSON<Exercise[]>(prompt, systemPrompt, isFive ? 1800 : 1200);

    if (!Array.isArray(exercises) || exercises.length < 3) {
      console.error('[generateMistakeReview] Unexpected response shape');
      return null;
    }

    // Structural validation: drop error-correction exercises where
    // error_word is absent from the sentence or equals correct_word
    const validated = exercises.filter((ex) => {
      if (ex.type !== 'error-correction') return true;
      const { sentence_with_error, error_word, correct_word } = ex.data as {
        sentence_with_error: string; error_word: string; correct_word: string;
      };
      const ok = sentence_with_error?.includes(error_word) && error_word !== correct_word;
      if (!ok) console.warn('[generateMistakeReview] Dropped malformed error-correction exercise');
      return ok;
    });

    return validated.slice(0, isFive ? 5 : 3);
  } catch (err) {
    console.error('[generateMistakeReview] Error:', err);
    return null;
  }
}
