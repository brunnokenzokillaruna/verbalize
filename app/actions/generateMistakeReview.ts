'use server';

import { callGeminiJSON } from '@/services/gemini';
import { isValidErrorCorrectionExercise, normalizeErrorCorrectionData } from '@/utils/errorCorrection';
import type { ErrorCorrectionData, Exercise, SupportedLanguage, ProficiencyLevel } from '@/types';

const LANG_LABEL: Record<SupportedLanguage, string> = {
  fr: 'French',
  en: 'English',
};

const MIN_EXERCISES = 3;

function prepareErrorCorrectionForValidation(data: ErrorCorrectionData): ErrorCorrectionData {
  const normalized = normalizeErrorCorrectionData(data);
  if (normalized.translation?.trim()) return normalized;

  const fallback =
    normalized.explanation?.trim() ||
    normalized.corrected_sentence?.trim() ||
    'Tradução da frase corrigida';

  return { ...normalized, translation: fallback };
}

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
    const systemPrompt = `Você é um professor de línguas brasileiro, muito gente boa, que cria exercícios focados em corrigir erros comuns de forma leve e humana.
Regras de Humanidade:
- ZERO "IA-ismos": nada de "Certamente", "Aqui está", "O erro reside em".
- Explicações curtas e papo reto (máximo 12 palavras).
- Use tom de encorajamento (ex: "Quase lá!", "Pega essa dica:", "Não cai nessa!").
Respond with ONLY a valid JSON array, no markdown, no explanation.`;

    const extraExercises = isFive ? `

Exercise 4 — type "bridge-choice" OR "context-choice":
- Prefer "bridge-choice" if the mistake stems from Brazilian Portuguese interference
- For bridge-choice: "scenario" (PT-BR), "question" (PT-BR), "options" (3-4 ${LANG_LABEL[language]} sentences), "correctIndex", "explanation", optional "trapRule"
- Otherwise use context-choice as originally specified

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
- CRITICAL: the 3 distractors must be grammatically incorrect or contextually wrong in this specific sentence, but they should be highly plausible (e.g. similar verb forms, same grammatical category, or common learner traps) to challenge the student. Do NOT use obviously unrelated or silly distractors. There must be only one correct answer.
- "translation" is the Brazilian Portuguese translation of the full sentence

Exercise 2 — type "error-correction":
- Write a ${LANG_LABEL[language]} sentence that contains ONE deliberate error related to this grammar point
- "sentence_with_error" is the full sentence (with the error)
- "error_word" is the incorrect word or short phrase
- "correct_word" is the replacement word/phrase (for deletions, repeat the removed span)
- "corrected_sentence" is ALWAYS required: the full sentence after fixing the error
- "answer_mode": "replace" for single-word swaps; "rewrite" when the student must type the full corrected sentence (deletions, redundant repetition, multi-word fixes)
- "acceptable_answers" is an array of OTHER valid corrected sentences or replacement words. If none exist, use an empty array.
- "translation" is the Brazilian Portuguese translation of "corrected_sentence" (NOT the explanation)
- "explanation" is a brief explanation in Brazilian Portuguese of why the error is wrong and what the correct form should be
- CRITICAL: "error_word" must appear EXACTLY ONCE in "sentence_with_error". If context naturally repeats the phrase, isolate ONLY the clause with the error (e.g. "Oui, j'en ai du pain." not "Tu as du pain ? Oui, j'en ai du pain.").
- NEVER ask the student to leave the answer blank. For deletions, use answer_mode "rewrite" and corrected_sentence as the full fixed sentence.
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
      "corrected_sentence": "full sentence after fix",
      "answer_mode": "replace",
      "acceptable_answers": ["other_valid_word1"],
      "translation": "Tradução em português da frase corrigida",
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

    const targetCount = isFive ? 5 : 3;
    const maxAttempts = 2;
    let validated: Exercise[] = [];

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const exercises = await callGeminiJSON<Exercise[]>(
        prompt,
        systemPrompt,
        isFive ? 1800 : 1200,
      );

      if (!Array.isArray(exercises) || exercises.length < MIN_EXERCISES) {
        console.error('[generateMistakeReview] Unexpected response shape');
        if (attempt === maxAttempts - 1) return null;
        continue;
      }

      validated = exercises.filter((ex) => {
        if (ex.type !== 'error-correction') return true;
        const prepared = prepareErrorCorrectionForValidation(ex.data as ErrorCorrectionData);
        const ok = isValidErrorCorrectionExercise(prepared);
        if (ok) {
          Object.assign(ex.data, prepared);
        } else {
          console.warn('[generateMistakeReview] Dropped malformed error-correction exercise');
        }
        return ok;
      });

      if (validated.length >= targetCount) break;
      console.warn(
        `[generateMistakeReview] Only ${validated.length}/${targetCount} valid exercises — retrying`,
      );
    }

    if (validated.length < MIN_EXERCISES) {
      console.error(
        `[generateMistakeReview] Insufficient valid exercises (${validated.length}/${targetCount})`,
      );
      return null;
    }

    return validated.slice(0, targetCount);
  } catch (err) {
    console.error('[generateMistakeReview] Error:', err);
    return null;
  }
}
