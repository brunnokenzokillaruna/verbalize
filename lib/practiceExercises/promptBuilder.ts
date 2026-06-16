import type { GrammarBridgeResult } from '@/types';
import {
  getAllowedExerciseTypes,
  getTagExclusiveType,
  LANG_LABEL,
  LEVEL_EXERCISE_DESCRIPTORS,
  type ExerciseTypeId,
} from './constants';
import { buildTypeDescriptions } from './exerciseTypeDescriptions';
import { buildTagGuidance } from './tagGuidance';
import type { GeneratePracticeParams } from './types';

export function buildGrammarBridgeExerciseBlock(bridge: GrammarBridgeResult | null | undefined): string {
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

export function buildPracticeExercisePrompt(params: GeneratePracticeParams): {
  systemPrompt: string;
  prompt: string;
} {
  const {
    dialogue,
    newVocabulary,
    grammarFocus,
    theme,
    uiTitle,
    tag,
    language,
    level,
    knownVocabulary,
    previousTopics,
    grammarBridge,
  } = params;

  const levelDesc = LEVEL_EXERCISE_DESCRIPTORS[level];
  const isEarlyLearner = knownVocabulary.length < 30;

  const allowedTypes = getAllowedExerciseTypes(level, knownVocabulary.length);
  const allowedSet = new Set(allowedTypes);
  const typeDescriptions = buildTypeDescriptions(LANG_LABEL[language]);

  // Inject tag-exclusive exercise types into the pool
  if (tag === 'GRAM') allowedSet.add('grammar-trap');
  if (tag === 'PRON') allowedSet.add('minimal-pair');
  if (tag === 'VERB') allowedSet.add('conjugation-speed');

  const tagExclusive = getTagExclusiveType(tag);

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
    "explanation": "Use 'Je voudrais' para pedir algo de forma polida; 'Je suis' significa 'eu sou', não um pedido."
  }
}
`;

  return { systemPrompt, prompt };
}
