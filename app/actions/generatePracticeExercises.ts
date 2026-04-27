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
  | 'logic-connectors'
  | 'grammar-trap'
  | 'minimal-pair'
  | 'conjugation-speed';

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
    'grammar-trap': `type "grammar-trap":
   - This exercise tests whether the student can identify the CORRECT sentence among traps.
   - "scenario" (PT-BR, 1-2 sentences): brief context about the Brazilian interference being tested.
   - "question" (PT-BR): e.g. "Qual destas frases esta CORRETA?"
   - "options": array of EXACTLY 4 objects, each with:
     - "sentence" (target language): a complete sentence
     - "translation" (PT-BR): natural translation
     - "isCorrect" (boolean): EXACTLY ONE must be true
   - The 3 incorrect options MUST contain classic errors Brazilians make due to Portuguese interference on the grammar focus of this lesson.
   - The 1 correct option must be perfectly grammatical.
   - "explanation" (PT-BR): clear explanation of WHY the correct answer is right and why the traps are wrong.
   - "trapRule" (PT-BR, 1 sentence): the core Brazilian error pattern.`,
    'minimal-pair': `type "minimal-pair":
   - This exercise trains auditory discrimination between similar-sounding words.
   - "wordA" (target language): first word of the pair (e.g. "poisson").
   - "wordB" (target language): second word, minimal pair (e.g. "poison"). Must differ by only 1-2 sounds.
   - "correctWord": which word fits the sentence context (must equal wordA or wordB).
   - "sentenceContext" (target language): a sentence using the correctWord naturally.
   - "translation" (PT-BR): translation of the sentence.
   - "tip" (PT-BR): a pronunciation tip to help distinguish the two sounds.`,
    'conjugation-speed': `type "conjugation-speed":
   - This exercise tests quick verb conjugation.
   - "verb" (infinitive form in target language).
   - "pronoun" (subject pronoun, e.g. "je", "il", "nous", "vous").
   - "tense" (PT-BR tense name, e.g. "presente", "passe compose").
   - "correctForm" (correctly conjugated form).
   - "options" (array of EXACTLY 4 strings: 1 correct + 3 plausible but wrong conjugations).
   - "exampleSentence" (target language): a complete sentence using the correct form.
   - "translation" (PT-BR): translation of the example sentence.`,
  };
}

function buildTagGuidance(tag: LessonTag, allowed: Set<ExerciseTypeId>): string {
  const pick = (candidates: ExerciseTypeId[]) => candidates.filter((t) => allowed.has(t));
  const list = (items: ExerciseTypeId[]) => items.map((t) => `'${t}'`).join(', ');

  if (tag === 'PRON') {
    const types = pick(['speak-repeat', 'audio-dictation', 'interactive-subtitles']);
    return [
      `- The FIRST exercise (index 0) MUST be of type 'minimal-pair'. This is mandatory for PRON lessons.`,
      types.length ? `- The remaining 4 exercises should focus heavily on ${list(types)} (at least 3 out of 4).` : '',
    ].filter(Boolean).join('\n');
  }
  if (tag === 'GRAM') {
    const types = pick(['error-correction', 'sentence-builder', 'context-choice']);
    return [
      `- The FIRST exercise (index 0) MUST be of type 'grammar-trap'. This is mandatory for GRAM lessons.`,
      types.length ? `- The remaining 4 exercises should focus on ${list(types)} to reinforce the grammar structure.` : '',
    ].filter(Boolean).join('\n');
  }
  if (tag === 'VOC') {
    const types = pick(['context-choice', 'reverse-translation', 'sentence-builder']);
    return [
      types.length ? `- Focus on ${list(types)} used in very simple sentences.` : '',
      `- MINI-STORY: All 5 exercise sentences MUST form a coherent micro-narrative. Sentence 2 must follow from sentence 1, sentence 3 from sentence 2, etc. Imagine a short story unfolding — each exercise is the next scene. This makes the vocabulary stick through narrative context.`,
    ].filter(Boolean).join('\n');
  }
  if (tag === 'DIAL') {
    const types = pick(['social-roleplay', 'scrambled-conversation', 'interactive-subtitles']);
    return [
      types.length
        ? `- Focus on ${list(types)} to simulate real-world usage. Use scenarios a Brazilian would realistically encounter: at a French restaurant, at a hotel in Lyon, on the Paris metro, at a French pharmacy, at an airport, in a Parisian shop.`
        : '',
      `- MINI-STORY: All 5 exercise sentences MUST form a coherent micro-narrative. Sentence 2 must follow from sentence 1, sentence 3 from sentence 2, etc. Imagine a short story unfolding — each exercise is the next scene.`,
    ].filter(Boolean).join('\n');
  }
  if (tag === 'MISS') {
    const types = pick(['social-roleplay', 'scrambled-conversation', 'interactive-subtitles']);
    return types.length
      ? `- Focus on ${list(types)} to simulate real-world usage. Use scenarios a Brazilian would realistically encounter.`
      : '';
  }
  if (tag === 'EXPR') {
    const types = pick(['social-roleplay', 'context-choice', 'sentence-builder']);
    return types.length
      ? `- At least 2 out of 5 exercises MUST be 'social-roleplay' where the correct option uses the target expression naturally. The other options should be grammatically correct but less natural/idiomatic.\n- The remaining exercises should focus on ${list(types)}.`
      : '';
  }
  if (tag === 'VERB') {
    const types = pick(['error-correction', 'sentence-builder', 'context-choice']);
    return [
      `- The FIRST exercise (index 0) MUST be of type 'conjugation-speed'. This is mandatory for VERB lessons.`,
      types.length ? `- The remaining 4 exercises should focus on ${list(types)} to reinforce the verb conjugation patterns.` : '',
    ].filter(Boolean).join('\n');
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

  // Inject tag-exclusive exercise types into the pool
  if (tag === 'GRAM') allowedSet.add('grammar-trap');
  if (tag === 'PRON') allowedSet.add('minimal-pair');
  if (tag === 'VERB') allowedSet.add('conjugation-speed');

  const tagExclusive: ExerciseTypeId | null =
    tag === 'GRAM' ? 'grammar-trap' :
    tag === 'PRON' ? 'minimal-pair' :
    tag === 'VERB' ? 'conjugation-speed' : null;

  const poolTypes: ExerciseTypeId[] = tagExclusive
    ? [tagExclusive, ...allowedTypes]
    : allowedTypes;

  const poolSection = poolTypes.map((t, i) => `${i + 1}. ${typeDescriptions[t]}`).join('\n\n');
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
      if (ex.type === 'grammar-trap') {
        const d = ex.data as {
          scenario: string;
          question: string;
          options: Array<{ sentence: string; translation: string; isCorrect: boolean }>;
          explanation: string;
          trapRule: string;
        };
        if (
          !d.scenario ||
          !d.question ||
          !d.explanation ||
          !d.trapRule ||
          !Array.isArray(d.options) ||
          d.options.length !== 4 ||
          d.options.filter((o) => o.isCorrect).length !== 1
        ) {
          console.warn('[generatePracticeExercises] Dropped malformed grammar-trap exercise');
          return false;
        }
        return true;
      }
      if (ex.type === 'minimal-pair') {
        const d = ex.data as {
          wordA: string; wordB: string; correctWord: string;
          sentenceContext: string; translation: string; tip: string;
        };
        if (
          !d.wordA || !d.wordB || !d.correctWord ||
          !d.sentenceContext || !d.translation || !d.tip ||
          (d.correctWord !== d.wordA && d.correctWord !== d.wordB)
        ) {
          console.warn('[generatePracticeExercises] Dropped malformed minimal-pair exercise');
          return false;
        }
        return true;
      }
      if (ex.type === 'conjugation-speed') {
        const d = ex.data as {
          verb: string; pronoun: string; tense: string;
          correctForm: string; options: string[];
          exampleSentence: string; translation: string;
        };
        if (
          !d.verb || !d.pronoun || !d.tense || !d.correctForm ||
          !d.exampleSentence || !d.translation ||
          !Array.isArray(d.options) || d.options.length !== 4 ||
          !d.options.includes(d.correctForm)
        ) {
          console.warn('[generatePracticeExercises] Dropped malformed conjugation-speed exercise');
          return false;
        }
        return true;
      }
      return true;
    });

    // For tag-exclusive exercises, ensure they are at index 0
    if (tagExclusive) {
      const exclusiveIdx = validated.findIndex((ex) => ex.type === tagExclusive);
      if (exclusiveIdx > 0) {
        const [exclusive] = validated.splice(exclusiveIdx, 1);
        validated.unshift(exclusive);
      }
    }

    return validated;
  } catch (err) {
    console.error('[generatePracticeExercises] Error:', err);
    return null;
  }
}
