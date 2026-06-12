'use server';

import { callGeminiJSON } from '@/services/gemini';
import { getVerbConjugation } from '@/app/actions/getVerbConjugation';
import { extractVerbOnlyForm, stripPronounPrefix } from '@/utils/conjugationHelper';
import { sanitizeConjugationOptions } from '@/utils/verbDrillGenerator';
import { isValidErrorCorrectionExercise, normalizeErrorCorrectionData } from '@/utils/errorCorrection';
import { enforceVariety, pinTagExclusiveFirst, varietyNeedsRegeneration } from '@/utils/exerciseVariety';
import type { ConjugationSpeedData, ErrorCorrectionData, Exercise, GrammarBridgeResult, SupportedLanguage, ProficiencyLevel, LessonTag } from '@/types';

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
  | 'word-bank-translation'
  | 'bridge-choice'
  | 'listen-and-select'
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
  'word-bank-translation',
  'bridge-choice',
  'listen-and-select',
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
  // Tier 3 (free production) requires A2+ OR sufficient vocabulary
  const tier3Eligible =
    !['A1'].includes(level) || knownVocabCount >= 60;
  if (!tier3Eligible) {
    return [...TIER_1_TYPES, ...TIER_2_ADDITIONS];
  }
  return [...TIER_1_TYPES, ...TIER_2_ADDITIONS, ...TIER_3_ADDITIONS];
}

function buildTypeDescriptions(langLabel: string): Record<ExerciseTypeId, string> {
  return {
    'context-choice': `type "context-choice":
   - Write an ORIGINAL sentence with a blank (___) for a key vocabulary word or grammar item.
   - "blankWord" is correct answer. "options" has 4 items: the correct word plus 3 highly plausible distractors of the same grammatical category, similar spelling/tense, or common learner mistakes. Do NOT use obviously different or unrelated words. The options must make the student think.
   - "translation" in PT-BR.`,
    'error-correction': `type "error-correction":
   - Write an ORIGINAL sentence with ONE deliberate error.
   - "sentence_with_error", "error_word", "correct_word", "corrected_sentence", "translation" (PT-BR: translation of corrected_sentence), "explanation" (PT-BR).
   - "corrected_sentence" is ALWAYS required: the full sentence after fixing the error.
   - "answer_mode": "replace" when the student only types the replacement word/phrase; "rewrite" when they must type the full corrected sentence (use for deletions, multi-word fixes, or redundant repetition like pronoun + noun).
   - When the fix is to REMOVE a word (e.g. redundant "du pain" after "en"), set answer_mode to "rewrite", correct_word to the removed span, and corrected_sentence to the full fixed sentence. NEVER leave correct_word empty and NEVER ask the student to leave the answer blank.
   - When the fix is to REPLACE one word, set answer_mode to "replace", correct_word to the replacement, and corrected_sentence to the full fixed sentence.
   - CRITICAL: "error_word" must appear EXACTLY ONCE in "sentence_with_error". If the natural context repeats the phrase (e.g. question + answer both with "du pain"), isolate ONLY the clause with the error — e.g. use "Oui, j'en ai du pain." instead of "Tu as du pain ? Oui, j'en ai du pain."
   - If error_word truly cannot be unique, set "error_span_start" to the 0-based character index where the erroneous occurrence begins.
   - "acceptable_answers" is an array of other valid corrected sentences or replacement words, or empty.`,
    'reverse-translation': `type "reverse-translation":
   - "portuguese_sentence" (PT-BR) → "target_translation" (${langLabel}).
   - "acceptable_variants" (2-4 alternative phrasings).
   - "hint" (optional grammar tip in PT-BR).`,
    'word-bank-translation': `type "word-bank-translation":
   - "portuguese_sentence" (PT-BR sentence to translate).
   - "correctOrder" (array of ${langLabel} words in correct order).
   - "words" (EXACT same words as correctOrder, shuffled).
   - "acceptable_variants" (0-2 alternative word orders as arrays).
   - "hint" (optional PT-BR grammar tip).`,
    'bridge-choice': `type "bridge-choice":
   - MCQ testing Brazilian Portuguese interference on the lesson grammar focus.
   - "scenario" (PT-BR, 1-2 sentences of context).
   - "question" (PT-BR).
   - "options" (3-4 complete sentences or phrases in ${langLabel}).
   - "correctIndex" (0-based).
   - "explanation" (PT-BR).
   - "trapRule" (optional PT-BR, 1 sentence about the interference pattern).`,
    'listen-and-select': `type "listen-and-select":
   - "audioText" (${langLabel} sentence to be played via TTS).
   - "options" (4 written transcriptions — 1 correct, 3 plausible but wrong).
   - "correctIndex" (0-based).
   - "translation" (PT-BR hint).`,
    'audio-dictation': `type "audio-dictation":
   - Short ORIGINAL sentence. "text" (${langLabel}), "translation" (PT-BR).`,
    'speak-repeat': `type "speak-repeat":
   - Short ORIGINAL sentence. "text" (${langLabel}), "translation" (PT-BR).`,
    'sentence-builder': `type "sentence-builder":
   - Short ORIGINAL sentence (3-8 words).
   - "correctOrder" (array of words in the correct order), "words" (array of the EXACT same words, shuffled), "translation" (PT-BR).
   - "explanation" (PT-BR): 1-2 short sentences explaining the word order — especially adverb placement vs Portuguese when relevant.
   - CRITICAL: "words" MUST contain the exact same words as "correctOrder". No missing words, no extra distractors.`,
    'social-roleplay': `type "social-roleplay":
   - "context" (PT-BR) describing the situation.
   - "promptLine" (${langLabel}) what the NPC says.
   - "options" (3 responses in target language). The correct option must use the target expression naturally. The other 2 options MUST be highly plausible, grammatically correct responses in target language that are contextually inappropriate or slightly incorrect (e.g. wrong pronoun, incorrect politeness level, or a subtle mismatch in context). DO NOT generate silly, obviously wrong, or unrelated distractors. The options should make the student think.
   - "correctIndex" (0-2), "explanation" (PT-BR).`,
    'scrambled-conversation': `type "scrambled-conversation":
   - A short sequence of 3-4 dialogue lines.
   - "lines" (correct order), "shuffledLines" (random order).
   - CRITICAL COHERENCE:
     1. Labeled Speakers: Every line MUST start with a speaker's name (e.g., "Marie: ...", "Thomas: ..."). The speakers MUST alternate (A -> B -> A -> B) to establish structure.
     2. Unambiguous Logical Ordering: The conversation must have exactly ONE logical chronological order. Use strong chronological clues: greeting at the start, question followed by its direct answer, request followed by its fulfillment, and a closing remark/despedida at the end.
     3. No Ambiguity: Do not write lines that could logically be swapped or placed in multiple positions (e.g., multiple general thank-yous or remarks). Every line must have a unique, necessary position in the chain.`,
    'interactive-subtitles': `type "interactive-subtitles":
   - "correctText" (original sentence).
   - "errorText" (copy of correctText but with 1-2 words swapped for wrong ones or misspelled).
   - "wrongWords" (array of the words that are WRONG in errorText).
   - "corrections" (array with ONE entry per wrong word): each { "wrong": "word in errorText", "correct": "replacement word", "options": [correct + 2 plausible distractors of same category] }.
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
   - "options" (array of EXACTLY 4 UNIQUE strings: 1 correct + 3 highly plausible but wrong conjugations of the SAME verb. No duplicates allowed.).
   - "exampleSentence" (target language): a complete sentence using the correct form.
   - "translation" (PT-BR): translation of the example sentence.`,
  };
}

function buildTagGuidance(tag: LessonTag, allowed: Set<ExerciseTypeId>): string {
  const pick = (candidates: ExerciseTypeId[]) => candidates.filter((t) => allowed.has(t));
  const list = (items: ExerciseTypeId[]) => items.map((t) => `'${t}'`).join(', ');

  if (tag === 'PRON') {
    const types = pick(['speak-repeat', 'audio-dictation', 'interactive-subtitles', 'listen-and-select']);
    return [
      `- The FIRST exercise (index 0) MUST be of type 'minimal-pair'. This is mandatory for PRON lessons.`,
      types.length ? `- The remaining 4 exercises should focus heavily on ${list(types)} (at least 3 out of 4).` : '',
    ].filter(Boolean).join('\n');
  }
  if (tag === 'GRAM') {
    const types = pick(['error-correction', 'sentence-builder', 'context-choice', 'bridge-choice']);
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
    return [
      types.length
        ? `- Focus on ${list(types)} to simulate real-world usage. Use scenarios a Brazilian would realistically encounter.`
        : '',
      `- MINI-STORY: All 5 exercise sentences MUST form a coherent micro-narrative. Sentence 2 must follow from sentence 1, sentence 3 from sentence 2, etc.`,
    ].filter(Boolean).join('\n');
  }
  if (tag === 'EXPR') {
    const types = pick(['social-roleplay', 'context-choice', 'sentence-builder']);
    return [
      types.length
        ? `- At least 2 out of 5 exercises MUST be 'social-roleplay' where the correct option uses the target expression naturally. The other options should be grammatically correct but less natural/idiomatic.\n- The remaining exercises should focus on ${list(types)}.`
        : '',
      `- MINI-STORY: All 5 exercise sentences MUST form a coherent micro-narrative. Sentence 2 must follow from sentence 1, sentence 3 from sentence 2, etc.`,
    ].filter(Boolean).join('\n');
  }
  if (tag === 'CULT') {
    const types = pick(['social-roleplay', 'context-choice', 'sentence-builder', 'logic-connectors']);
    return [
      `- At least 2 out of 5 exercises MUST be 'social-roleplay' testing cultural nuances (formality, taboos, gestures, social expectations).`,
      types.length ? `- Include at least 1 'context-choice' about cultural vocabulary or register.\n- Remaining exercises from: ${list(types)}.` : '',
      `- MINI-STORY: All 5 exercise sentences MUST form a coherent micro-narrative with cultural context.`,
    ].filter(Boolean).join('\n');
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

async function fixConjugationSpeedExercise(
  data: ConjugationSpeedData,
  language: SupportedLanguage,
): Promise<ConjugationSpeedData | null> {
  const correctForm = stripPronounPrefix(data.correctForm, language, data.pronoun);
  const options = data.options.map((opt) => stripPronounPrefix(opt, language, data.pronoun));

  let sanitized = sanitizeConjugationOptions(correctForm, options);
  if (sanitized) {
    return { ...data, correctForm, options: sanitized };
  }

  const verbDoc = await getVerbConjugation(data.verb, language);
  const extraPool = verbDoc?.conjugations
    ? Object.values(verbDoc.conjugations).flatMap((c) =>
        Object.entries(c || {}).map(([p, f]) => extractVerbOnlyForm(p, f, language)),
      )
    : [];

  sanitized = sanitizeConjugationOptions(correctForm, options, extraPool);
  if (!sanitized) return null;
  return { ...data, correctForm, options: sanitized };
}

interface GeneratePracticeParams {
  dialogue: string;
  newVocabulary: string[];
  verbWord: string;
  grammarFocus: string;
  theme?: string;
  uiTitle?: string;
  tag: LessonTag;
  language: SupportedLanguage;
  level: ProficiencyLevel;
  knownVocabulary: string[];
  previousTopics: string[];
  grammarBridge?: GrammarBridgeResult | null;
}

function buildGrammarBridgeExerciseBlock(bridge: GrammarBridgeResult | null | undefined): string {
  if (!bridge) return '';

  const trap =
    typeof bridge.brazilianTrap === 'object' && bridge.brazilianTrap
      ? bridge.brazilianTrap
      : null;

  const lines = [
    '\n--- GRAMMAR BRIDGE CONTEXT (from the lesson the student just studied) ---',
    bridge.insight ? `Central insight: ${bridge.insight}` : '',
    bridge.survivalTip ? `Survival tip: ${bridge.survivalTip}` : '',
    trap
      ? `Brazilian trap — WRONG: "${trap.wrong}" | CORRECT: "${trap.right}" | Why: ${trap.explanation}`
      : '',
    'For grammar-trap (exercise #1 when tag is GRAM): the incorrect options MUST echo the brazilianTrap wrong pattern above. The correct option MUST match the trap.right pattern or equivalent correct usage.',
  ].filter(Boolean);

  return lines.join('\n');
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
  const { dialogue, newVocabulary, grammarFocus, theme, uiTitle, tag, language, level, knownVocabulary, previousTopics, grammarBridge } = params;
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
    ? `\nVOCABULARY CONSTRAINT: The learner is a beginner with very limited vocabulary. All exercise sentences must use ONLY: the key vocabulary words listed above, the words that appeared in the dialogue above, the words involved in the grammar focus ("${grammarFocus}"), basic function words (articles, prepositions, pronouns, conjunctions, auxiliary verbs), and simple A1-level everyday words. Do NOT use any advanced or uncommon content words.`
    : `\nVOCABULARY CONSTRAINT: All exercise sentences should PRIORITIZE using words the learner already knows: [${knownVocabulary.slice(-1000).join(', ')}], plus the key vocabulary words listed above, plus any words that appeared in the dialogue above, plus the words involved in the grammar focus ("${grammarFocus}"), plus basic function words (articles, prepositions, pronouns, conjunctions, auxiliary verbs). You are ALLOWED to use other standard everyday words if necessary to make the exercise sentences natural and logical. Do NOT introduce highly complex, technical, or obscure vocabulary.`;

  const previousTopicsBlock = previousTopics.length > 0
    ? `\nPREVIOUS LESSON TOPICS (for context and coherence — you may reference these themes): ${previousTopics.join(' | ')}`
    : '';

  const grammarBridgeBlock = buildGrammarBridgeExerciseBlock(grammarBridge);

  const curatedAnchorBlock = theme
    ? `\nCURATED LESSON ANCHOR (all exercise scenarios MUST stay within this — do NOT invent unrelated situations):\n- Theme: "${theme}"${uiTitle ? `\n- Scenario: "${uiTitle}"` : ''}`
    : '';

  const grammarAccuracyBlock = `
--- CRITICAL LINGUISTIC ACCURACY & GENDER AGREEMENT RULES ---
- STRICT GENDER & NUMBER AGREEMENT: You MUST double-check the grammatical gender and number of all nouns in the target language (${LANG_LABEL[language]}).
  - Example (French): "la viennoiserie" is FEMININE singular. Therefore, the adjective MUST be feminine singular ("chère", NOT "cher"). Generating "La viennoiserie est trop cher" as correct is a CRITICAL ERROR.
  - Example (French): "la chanson" is FEMININE. The adjective must be "bonne", not "bon".
  - Always verify every noun's gender in the target language.
- ABSOLUTE GRAMMATICAL CORRECTNESS FOR THE CORRECT OPTION:
  - The option marked "isCorrect": true or the "blankWord" or "target_translation" MUST be 100% flawlessly grammatical under standard rules of ${LANG_LABEL[language]}. There must be zero typos, zero gender/number agreement errors, and zero conjugation errors.
- TRAP ERROR VERIFICATION:
  - The incorrect options must contain ONLY the intended error stemming from Portuguese interference. They must NOT contain accidental/unintended errors, nor should they be grammatically correct sentences marked as false. Double-check that the "isCorrect" boolean is not inverted.
- SELF-CHECK CHALLENGE: Before generating the final JSON array, mentally verify: "Is the correct option actually correct? Are the distractors actually incorrect? Did I match the adjective gender to the noun gender correctly?"
`;

  try {
    const systemPrompt = `You are a language exercise generator for Brazilian Portuguese speakers learning ${LANG_LABEL[language]}. The student is Brazilian — use scenarios, cultural references, and situations that are engaging and relevant for a Brazilian learner (e.g., a Brazilian tourist in Paris, a Brazilian professional in a French meeting, a Brazilian student abroad, ordering food in Lyon, asking for directions in London). Respond with ONLY a valid JSON array, no markdown, no explanation.`;

    const prompt = `The learner just studied a ${LANG_LABEL[language]} dialogue at ${level} level.

GRAMMAR FOCUS: ${grammarFocus}${curatedAnchorBlock}
DIALOGUE (for vocabulary and tone reference only — do NOT copy sentences):
"${dialogue}"

Key vocabulary words from this lesson: ${newVocabulary.join(', ')}
${previousTopicsBlock}
${grammarBridgeBlock}

TAG-SPECIFIC EXERCISE BALANCE (follow this strictly):
${tagGuidance}

CRITICAL RULE: Do NOT copy or reuse any sentence from the dialogue above. Every exercise sentence must be ORIGINAL — newly created by you. The sentences should be related to the lesson's theme and grammar focus, but must be completely different from the dialogue lines.

LEVEL CONSTRAINTS — all sentences you write must follow these rules: ${levelDesc}
${vocabConstraint}
${grammarAccuracyBlock}

Generate exactly 5 exercises as a JSON array. Choose varied types from the following pool for a balanced practice session. You MUST use ONLY the types listed below — any other type is forbidden.

VARIETY RULE (mandatory): use at least 3 DIFFERENT exercise types; no type may appear more than twice.

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
        const normalized = normalizeErrorCorrectionData(ex.data as ErrorCorrectionData);
        const ok = isValidErrorCorrectionExercise(normalized);
        if (ok) {
          Object.assign(ex.data, normalized);
        } else {
          console.warn('[generatePracticeExercises] Dropped malformed error-correction exercise');
        }
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
        const data = ex.data as { words: string[]; correctOrder: string[] };
        if (!data.words?.length || !data.correctOrder?.length) {
          console.warn('[generatePracticeExercises] Dropped malformed sentence-builder exercise');
          return false;
        }
        
        // Always rebuild words from correctOrder to guarantee exact casing and content match.
        // Previously we only checked case-insensitively, which let casing mismatches slip through
        // (e.g. words had "la" but correctOrder had "La", causing false negatives on comparison).
        const sortedWords = [...data.words].map(w => w.trim()).sort();
        const sortedCorrect = [...data.correctOrder].map(w => w.trim()).sort();
        
        if (sortedWords.join(',') !== sortedCorrect.join(',')) {
          console.warn('[generatePracticeExercises] Auto-fixing mismatched words in sentence-builder');
          data.words = [...data.correctOrder].sort(() => Math.random() - 0.5);
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
      if (ex.type === 'scrambled-conversation') {
        const d = ex.data as { lines: string[]; shuffledLines: string[] };
        if (!Array.isArray(d.lines) || !Array.isArray(d.shuffledLines) || d.lines.length < 3 || d.lines.length !== d.shuffledLines.length) {
          console.warn('[generatePracticeExercises] Dropped malformed scrambled-conversation');
          return false;
        }
        
        // Ensure that shuffledLines actually contains the same lines as lines, and is actually shuffled.
        const sortedLines = [...d.lines].sort();
        const sortedShuffled = [...d.shuffledLines].sort();
        if (sortedLines.join(',') !== sortedShuffled.join(',')) {
          console.warn('[generatePracticeExercises] Auto-fixing scrambled-conversation with mismatched shuffled lines');
          d.shuffledLines = [...d.lines].sort(() => Math.random() - 0.5);
        }
        
        // If the shuffle randomly ended up in the same order, reshuffle
        if (JSON.stringify(d.lines) === JSON.stringify(d.shuffledLines) && d.lines.length > 1) {
          d.shuffledLines = [...d.lines].sort(() => Math.random() - 0.5);
        }
        return true;
      }
      if (ex.type === 'interactive-subtitles') {
        const d = ex.data as {
          correctText?: string;
          errorText?: string;
          wrongWords?: string[];
          translations?: string;
          translation?: string;
          corrections?: Array<{ wrong: string; correct: string; options: string[] }>;
        };
        if (d.translation && !d.translations) {
          d.translations = d.translation;
        }
        if (!d.correctText || !d.errorText || !Array.isArray(d.wrongWords) || !d.translations) {
          console.warn('[generatePracticeExercises] Dropped malformed interactive-subtitles');
          return false;
        }
        if (!Array.isArray(d.corrections) || d.corrections.length !== d.wrongWords.length) {
          console.warn('[generatePracticeExercises] Auto-fixing interactive-subtitles missing corrections');
          d.corrections = d.wrongWords.map((wrong) => {
            const correctWord = d.correctText!.split(/\s+/).find(
              (w) => w.replace(/[.,!?;:'"]/g, '').toLowerCase() !== wrong.replace(/[.,!?;:'"]/g, '').toLowerCase(),
            ) ?? wrong;
            return { wrong, correct: correctWord, options: [correctWord, wrong, '...'] };
          });
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
        const d = ex.data as ConjugationSpeedData;
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
      if (ex.type === 'word-bank-translation') {
        const d = ex.data as { words: string[]; correctOrder: string[]; portuguese_sentence?: string };
        if (!d.portuguese_sentence || !d.words?.length || !d.correctOrder?.length) return false;
        const sortedWords = [...d.words].map(w => w.trim()).sort();
        const sortedCorrect = [...d.correctOrder].map(w => w.trim()).sort();
        if (sortedWords.join(',') !== sortedCorrect.join(',')) {
          (ex.data as { words: string[] }).words = [...d.correctOrder].sort(() => Math.random() - 0.5);
        }
        return true;
      }
      if (ex.type === 'bridge-choice') {
        const d = ex.data as { scenario?: string; question?: string; options?: string[]; correctIndex?: number; explanation?: string };
        if (!d.question || !d.explanation || !Array.isArray(d.options) || d.options.length < 3) return false;
        if (typeof d.correctIndex !== 'number' || d.correctIndex < 0 || d.correctIndex >= d.options.length) return false;
        return true;
      }
      if (ex.type === 'listen-and-select') {
        const d = ex.data as { audioText?: string; options?: string[]; correctIndex?: number; translation?: string };
        if (!d.audioText || !d.translation || !Array.isArray(d.options) || d.options.length < 3) return false;
        if (typeof d.correctIndex !== 'number' || d.correctIndex < 0 || d.correctIndex >= d.options.length) return false;
        return true;
      }
      return true;
    });

    const dedupedValidated: Exercise[] = [];
    for (const ex of validated) {
      if (ex.type === 'conjugation-speed') {
        const fixed = await fixConjugationSpeedExercise(ex.data, language);
        if (!fixed) {
          console.warn('[generatePracticeExercises] Dropped conjugation-speed exercise with duplicate options');
          continue;
        }
        dedupedValidated.push({ ...ex, data: fixed });
        continue;
      }
      dedupedValidated.push(ex);
    }

    // For tag-exclusive exercises, ensure they are at index 0
    let finalExercises = pinTagExclusiveFirst(dedupedValidated, tagExclusive);
    finalExercises = enforceVariety(
      finalExercises,
      [...allowedSet] as ExerciseTypeId[],
      tagExclusive,
    );

    if (varietyNeedsRegeneration(finalExercises) && finalExercises.length >= 3) {
      console.warn('[generatePracticeExercises] Variety insufficient after enforcement — returning best-effort set');
    }

    return finalExercises.length > 0 ? finalExercises : null;
  } catch (err) {
    console.error('[generatePracticeExercises] Error:', err);
    return null;
  }
}
