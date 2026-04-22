'use server';

import { callGeminiJSON } from '@/services/gemini';
import type { Exercise, SupportedLanguage, ProficiencyLevel, LessonTag } from '@/types';

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

type ExerciseTypeId =
  | 'context-choice'
  | 'error-correction'
  | 'reverse-translation'
  | 'audio-dictation'
  | 'speak-repeat'
  | 'sentence-builder'
  | 'social-roleplay'
  | 'scrambled-conversation'
  | 'interactive-subtitles'
  | 'logic-connectors';

// Tiered progression: free-writing types (audio-dictation, reverse-translation) are
// gated behind sufficient vocabulary so absolute beginners aren't asked to produce
// full target-language sentences from scratch.
const TIER_1_TYPES: ExerciseTypeId[] = [
  'sentence-builder',
  'context-choice',
  'speak-repeat',
  'interactive-subtitles',
  'scrambled-conversation',
];

const TIER_2_ADDITIONS: ExerciseTypeId[] = [
  'error-correction',
  'social-roleplay',
  'logic-connectors',
];

const TIER_3_ADDITIONS: ExerciseTypeId[] = [
  'audio-dictation',
  'reverse-translation',
];

function getAllowedExerciseTypes(level: ProficiencyLevel, knownVocabCount: number): ExerciseTypeId[] {
  if (level === 'A1' && knownVocabCount < 30) {
    return TIER_1_TYPES;
  }
  if (level === 'A1' || (level === 'A2' && knownVocabCount < 60)) {
    return [...TIER_1_TYPES, ...TIER_2_ADDITIONS];
  }
  return [...TIER_1_TYPES, ...TIER_2_ADDITIONS, ...TIER_3_ADDITIONS];
}

function buildTypeDescriptions(langLabel: string): Record<ExerciseTypeId, string> {
  return {
    'context-choice': `type "context-choice":
   - Write an ORIGINAL sentence with a blank (___) for a key vocabulary word or grammar item.
   - "blankWord" is correct answer. "options" has 4 items (1 correct + 3 clearly wrong distractors).
   - "translation" in PT-BR.`,
    'error-correction': `type "error-correction":
   - Write an ORIGINAL sentence with ONE deliberate error.
   - "sentence_with_error", "error_word", "correct_word", "explanation" (PT-BR).
   - "acceptable_answers" is an array of other valid options or empty.`,
    'reverse-translation': `type "reverse-translation":
   - "portuguese_sentence" (PT-BR) → "target_translation" (${langLabel}).
   - "acceptable_variants" (2-4 alternative phrasings).
   - "hint" (optional grammar tip in PT-BR).`,
    'audio-dictation': `type "audio-dictation":
   - Short ORIGINAL sentence. "text" (${langLabel}), "translation" (PT-BR).`,
    'speak-repeat': `type "speak-repeat":
   - Short ORIGINAL sentence. "text" (${langLabel}), "translation" (PT-BR).`,
    'sentence-builder': `type "sentence-builder":
   - Short ORIGINAL sentence (3-8 words).
   - "words" (shuffled array), "correctOrder" (correct array), "translation" (PT-BR).`,
    'social-roleplay': `type "social-roleplay":
   - "context" (PT-BR) describing the situation.
   - "promptLine" (${langLabel}) what the NPC says.
   - "options" (3 possible natural responses in target language).
   - "correctIndex" (0-2), "explanation" (PT-BR).`,
    'scrambled-conversation': `type "scrambled-conversation":
   - A short sequence of 3-4 dialogue lines.
   - "lines" (correct order), "shuffledLines" (random order).`,
    'interactive-subtitles': `type "interactive-subtitles":
   - "correctText" (original sentence).
   - "errorText" (copy of correctText but with 1-2 words swapped for wrong ones or misspelled).
   - "wrongWords" (array of the words that are WRONG in errorText).
   - "translations" (PT-BR).`,
    'logic-connectors': `type "logic-connectors":
    - "partA" (first half), "partB" (second half).
    - "options" (3 connectors like 'but', 'because', 'so').
    - "correctConnector", "translation" (PT-BR).`,
  };
}

function buildTagGuidance(tag: LessonTag, allowed: Set<ExerciseTypeId>): string {
  const pick = (candidates: ExerciseTypeId[]) => candidates.filter((t) => allowed.has(t));
  const list = (items: ExerciseTypeId[]) => items.map((t) => `'${t}'`).join(', ');

  if (tag === 'PRON') {
    const types = pick(['speak-repeat', 'audio-dictation', 'interactive-subtitles']);
    return types.length ? `- Focus heavily on ${list(types)} (at least 3 out of 5).` : '';
  }
  if (tag === 'GRAM') {
    const types = pick(['error-correction', 'sentence-builder', 'context-choice']);
    return types.length ? `- Focus on ${list(types)} to reinforce the grammar structure.` : '';
  }
  if (tag === 'VOC') {
    const types = pick(['context-choice', 'reverse-translation', 'sentence-builder']);
    return types.length ? `- Focus on ${list(types)} used in very simple sentences.` : '';
  }
  if (tag === 'DIAL' || tag === 'MISS') {
    const types = pick(['social-roleplay', 'scrambled-conversation', 'interactive-subtitles']);
    return types.length
      ? `- Focus on ${list(types)} to simulate real-world usage. Use scenarios a Brazilian would realistically encounter: at a French restaurant, at a hotel in Lyon, on the Paris metro, at a French pharmacy, at an airport, in a Parisian shop.`
      : '';
  }
  return '';
}

interface GeneratePracticeParams {
  dialogue: string;
  newVocabulary: string[];
  verbWord: string;
  grammarFocus: string;
  tag: LessonTag;
  language: SupportedLanguage;
  level: ProficiencyLevel;
  knownVocabulary: string[];
  previousTopics: string[];
}

/**
 * Generates exactly 5 practice exercises via Gemini.
 * The types are chosen randomly and variedly from the available pool.
 *
 * IMPORTANT: Exercises create ORIGINAL sentences — never copying from the dialogue.
 * They use only vocabulary the user has already learned + the current lesson's new words.
 * Returns null on any error.
 */
export async function generatePracticeExercises(
  params: GeneratePracticeParams,
): Promise<Exercise[] | null> {
  const { dialogue, newVocabulary, grammarFocus, tag, language, level, knownVocabulary, previousTopics } = params;
  const levelDesc = LEVEL_EXERCISE_DESCRIPTORS[level];
  const isEarlyLearner = knownVocabulary.length < 30;

  const allowedTypes = getAllowedExerciseTypes(level, knownVocabulary.length);
  const allowedSet = new Set(allowedTypes);
  const typeDescriptions = buildTypeDescriptions(LANG_LABEL[language]);
  const poolSection = allowedTypes.map((t, i) => `${i + 1}. ${typeDescriptions[t]}`).join('\n\n');
  const tagGuidance = buildTagGuidance(tag, allowedSet);

  const vocabConstraint = isEarlyLearner
    ? `\nVOCABULARY CONSTRAINT: The learner is a beginner with very limited vocabulary. All exercise sentences must use ONLY: the key vocabulary words listed above, the words involved in the grammar focus ("${grammarFocus}"), basic function words (articles, prepositions, pronouns, conjunctions, auxiliary verbs), and simple A1-level everyday words. Do NOT use any advanced or uncommon content words.`
    : `\nVOCABULARY CONSTRAINT: All exercise sentences must use EXCLUSIVELY words the learner already knows: [${knownVocabulary.slice(-1000).join(', ')}], plus the key vocabulary words listed above, plus the words involved in the grammar focus ("${grammarFocus}"), plus basic function words (articles, prepositions, pronouns, conjunctions, auxiliary verbs). Do NOT introduce unknown content words.`;

  const previousTopicsBlock = previousTopics.length > 0
    ? `\nPREVIOUS LESSON TOPICS (for context and coherence — you may reference these themes): ${previousTopics.join(' | ')}`
    : '';

  try {
    const systemPrompt = `You are a language exercise generator for Brazilian Portuguese speakers learning ${LANG_LABEL[language]}. The student is Brazilian — use scenarios, cultural references, and situations that are engaging and relevant for a Brazilian learner (e.g., a Brazilian tourist in Paris, a Brazilian professional in a French meeting, a Brazilian student abroad, ordering food in Lyon, asking for directions in London). Respond with ONLY a valid JSON array, no markdown, no explanation.`;

    const prompt = `The learner just studied a ${LANG_LABEL[language]} dialogue at ${level} level.

GRAMMAR FOCUS: ${grammarFocus}
THEME/CONTEXT (from dialogue):
"${dialogue}"

Key vocabulary words from this lesson: ${newVocabulary.join(', ')}
${previousTopicsBlock}

TAG-SPECIFIC EXERCISE BALANCE (follow this strictly):
${tagGuidance}

CRITICAL RULE: Do NOT copy or reuse any sentence from the dialogue above. Every exercise sentence must be ORIGINAL — newly created by you. The sentences should be related to the lesson's theme and grammar focus, but must be completely different from the dialogue lines.

LEVEL CONSTRAINTS — all sentences you write must follow these rules: ${levelDesc}
${vocabConstraint}

Generate exactly 5 exercises as a JSON array. Choose varied types from the following pool for a balanced practice session. You MUST use ONLY the types listed below — any other type is forbidden.

--- POOL OF EXERCISE TYPES (the ONLY types you may use) ---

${poolSection}

--- OUTPUT FORMAT ---
Return a JSON array of 5 objects, each with "type" and "data".
Example for social-roleplay:
{
  "type": "social-roleplay",
  "data": {
    "context": "Você está pedindo um café.",
    "promptLine": "Bonjour ! Vous désirez ?",
    "options": ["Je voudrais um café, s'il vous plaît.", "Je suis un café.", "Merci beaucoup !"],
    "correctIndex": 0,
    "explanation": "A primeira opção é a forma polida de pedir algo."
  }
}
`;

    const exercises = await callGeminiJSON<Exercise[]>(prompt, systemPrompt, 3072);

    if (!Array.isArray(exercises) || exercises.length < 3) {
      console.error('[generatePracticeExercises] Unexpected response shape or too few exercises');
      return null;
    }

    // Structural validation: drop exercises that are clearly malformed or use forbidden types
    const validated = exercises.filter((ex) => {
      if (!allowedSet.has(ex.type as ExerciseTypeId)) {
        console.warn(`[generatePracticeExercises] Dropped ${ex.type} — not allowed at this level/progress`);
        return false;
      }
      if (ex.type === 'error-correction') {
        const { sentence_with_error, error_word, correct_word } = ex.data as {
          sentence_with_error: string;
          error_word: string;
          correct_word: string;
        };
        const ok =
          sentence_with_error &&
          error_word &&
          correct_word &&
          sentence_with_error.toLowerCase().includes(error_word.toLowerCase()) &&
          error_word.toLowerCase() !== correct_word.toLowerCase();
        if (!ok) console.warn('[generatePracticeExercises] Dropped malformed error-correction exercise');
        return ok;
      }
      if (ex.type === 'audio-dictation' || ex.type === 'speak-repeat') {
        const text = (ex.data as { text: string }).text?.trim();
        if (!text) {
          console.warn(`[generatePracticeExercises] Dropped ${ex.type} with empty text`);
          return false;
        }
        return true;
      }
      if (ex.type === 'sentence-builder') {
        const { words, correctOrder } = ex.data as { words: string[]; correctOrder: string[] };
        if (!words?.length || !correctOrder?.length || words.length !== correctOrder.length) {
          console.warn('[generatePracticeExercises] Dropped malformed sentence-builder exercise');
          return false;
        }
        return true;
      }
      if (ex.type === 'context-choice') {
        const { sentence, blankWord, options } = ex.data as { sentence: string; blankWord: string; options: string[] };
        if (!sentence || !blankWord || !Array.isArray(options) || options.length < 2) {
          console.warn('[generatePracticeExercises] Dropped malformed context-choice');
          return false;
        }
        return true;
      }
      return true;
    });

    return validated;
  } catch (err) {
    console.error('[generatePracticeExercises] Error:', err);
    return null;
  }
}
