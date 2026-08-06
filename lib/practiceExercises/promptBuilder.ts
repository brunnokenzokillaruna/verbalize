import type { GrammarBridgeResult } from '@/types';
import {
  ENFORCE_PRODUCTION_PER_LESSON,
  getAllowedExerciseTypes,
  getTagExclusiveType,
  LANG_LABEL,
  LEVEL_EXERCISE_DESCRIPTORS,
  PRACTICE_EXERCISE_COUNT,
  type ExerciseTypeId,
} from './constants';
import { buildTypeDescriptions } from './exerciseTypeDescriptions';
import { buildTagGuidance } from './tagGuidance';
import { buildGrammarFocusExerciseGuidance } from './grammarFocusExerciseGuidance';
import { REVERSE_TRANSLATION_PT_ADVERB_PROMPT_RULE } from '@/lib/reverseTranslationPtAdverb';
import { FILL_GAP_DIRECTIONAL_PROMPT_RULE } from '@/lib/fillGapDirectionalSanitize';
import { buildChainPromptBlock } from './chainExercises';
import { pickInterleavingWords, buildInterleavingPromptBlock } from './interleaving';
import { resolveRequiredProductionType } from './productionTypes';
import type { GeneratePracticeParams } from './types';
import { buildPtBrVocabRule } from './validatePtBrText';

export function buildDialogueAnchorBlock(): string {
  return `
DIALOGUE ANCHOR (mandatory): Every exercise scenario must connect to the lesson theme and reuse vocabulary or situational context from the dialogue above — but NEVER copy dialogue sentences verbatim. Invent new sentences that feel like the same situation.`;
}

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

  const allowedTypes = getAllowedExerciseTypes(level, knownVocabulary.length, tag);
  const allowedSet = new Set(allowedTypes);
  const typeDescriptions = buildTypeDescriptions(LANG_LABEL[language]);

  // Inject tag-exclusive exercise types into the pool
  if (tag === 'GRAM') allowedSet.add('grammar-trap');
  if (tag === 'PRON') {
    allowedSet.add('minimal-pair');
    if (['A2', 'B1', 'B2', 'C1', 'C2'].includes(level)) {
      allowedSet.add('minimal-pair-production');
    }
  }
  if (tag === 'VERB') allowedSet.add('conjugation-speed');

  const tagExclusive = getTagExclusiveType(tag, level);

  const requiredProduction = resolveRequiredProductionType(
    level,
    knownVocabulary.length,
    allowedTypes,
  );

  const poolTypes: ExerciseTypeId[] = tagExclusive
    ? [
        tagExclusive,
        ...(requiredProduction && requiredProduction !== tagExclusive ? [requiredProduction] : []),
        ...allowedTypes.filter((t) => t !== tagExclusive && t !== requiredProduction),
      ]
    : requiredProduction
      ? [requiredProduction, ...allowedTypes.filter((t) => t !== requiredProduction)]
      : allowedTypes;

  const productionRuleBlock =
    ENFORCE_PRODUCTION_PER_LESSON && requiredProduction
      ? `\nPRODUCTION RULE (mandatory): You MUST include EXACTLY ONE exercise of type "${requiredProduction}". This exercise must appear in the final array. Place it as the LAST exercise (index ${PRACTICE_EXERCISE_COUNT - 1}) so the learner produces language after receptive drills.\n`
      : '';

  const poolSection = poolTypes.map((t, i) => `${i + 1}. ${typeDescriptions[t]}`).join('\n\n');
  const tagGuidance = buildTagGuidance(tag, allowedSet, level, knownVocabulary.length);
  const grammarFocusGuidance = buildGrammarFocusExerciseGuidance(grammarFocus, language);

  const vocabConstraint = isEarlyLearner
    ? `\nVOCABULARY CONSTRAINT: The learner is a beginner with very limited vocabulary. All exercise sentences must use ONLY: the key vocabulary words listed above, the words that appeared in the dialogue above, the words involved in the grammar focus ("${grammarFocus}"), basic function words (articles, prepositions, pronouns, conjunctions, auxiliary verbs), and simple A1-level everyday words. Do NOT use any advanced or uncommon content words.`
    : `\nVOCABULARY CONSTRAINT: All exercise sentences should PRIORITIZE using words the learner already knows: [${knownVocabulary.slice(-1000).join(', ')}], plus the key vocabulary words listed above, plus any words that appeared in the dialogue above, plus the words involved in the grammar focus ("${grammarFocus}"), plus basic function words (articles, prepositions, pronouns, conjunctions, auxiliary verbs). You are ALLOWED to use other standard everyday words if necessary to make the exercise sentences natural and logical. Do NOT introduce highly complex, technical, or obscure vocabulary.`;

  const previousTopicsBlock = previousTopics.length > 0
    ? `\nPREVIOUS LESSON TOPICS (for context and coherence — you may reference these themes): ${previousTopics.join(' | ')}`
    : '';

  const grammarBridgeBlock = buildGrammarBridgeExerciseBlock(grammarBridge);

  const interleavingWords = pickInterleavingWords(knownVocabulary, newVocabulary);
  const interleavingBlock = buildInterleavingPromptBlock(interleavingWords);

  const hasChainTypes =
    allowedSet.has('listening-comprehension') &&
    (allowedSet.has('reverse-translation') || allowedSet.has('listen-and-respond'));
  const chainBlock = buildChainPromptBlock(hasChainTypes);
  const dialogueAnchorBlock = buildDialogueAnchorBlock();
  const constraintBlock = allowedSet.has('translation-with-constraint')
    ? `\nTRANSLATION-WITH-CONSTRAINT RULE: "required_chunk" MUST come from this lesson's key vocabulary or dialogue — the learner must use that chunk in their written translation. All acceptable_variants must also contain required_chunk. CRITICAL: "portuguese_sentence" must be pure PT-BR and must NOT contain required_chunk (use a Portuguese equivalent in the prompt; show the ${LANG_LABEL[language]} chunk only via required_chunk).`
    : '';

  const curatedAnchorBlock = theme
    ? `\nCURATED LESSON ANCHOR (all exercise scenarios MUST stay within this — do NOT invent unrelated situations):\n- Theme: "${theme}"${uiTitle ? `\n- Scenario: "${uiTitle}"` : ''}`
    : '';

  const isA2Plus = ['A2', 'B1', 'B2', 'C1', 'C2'].includes(level);
  const reverseTranslationHintRule = isA2Plus
    ? `\nREVERSE-TRANSLATION RULE: For level ${level}, do NOT include the "hint" field in reverse-translation exercises — the learner must produce without scaffolding. Still follow the PT-BR adverb clarity rule below (use explicit "-mente" in portuguese_sentence instead of relying on a hint).`
    : '';
  const reverseTranslationAdverbRule = allowedSet.has('reverse-translation')
    ? REVERSE_TRANSLATION_PT_ADVERB_PROMPT_RULE
    : '';
  const directionalVerbRule =
    language === 'fr' &&
    (allowedSet.has('fill-gap-production') || allowedSet.has('context-choice'))
      ? FILL_GAP_DIRECTIONAL_PROMPT_RULE
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
- MULTIPLE-CHOICE COHERENCE (listening-comprehension, bridge-choice, listen-and-select):
  - options[correctIndex] must mean the same thing as explanationPt / explanation AND the audio source (dialogueAudio or audioText).
  - Never mark an option correct when the explanation describes a different action (e.g. dialogue/explanation about eating but correct answer about resting).
  - For listen-and-select: the correct option must be an exact or near-exact transcription of audioText.
${buildPtBrVocabRule(language)}
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
${tagGuidance}${grammarFocusGuidance}${productionRuleBlock}${interleavingBlock}${chainBlock}${dialogueAnchorBlock}${constraintBlock}

CRITICAL RULE: Do NOT copy or reuse any sentence from the dialogue above. Every exercise sentence must be ORIGINAL — newly created by you. The sentences should be related to the lesson's theme and grammar focus, but must be completely different from the dialogue lines.

LEVEL CONSTRAINTS — all sentences you write must follow these rules: ${levelDesc}
${vocabConstraint}${reverseTranslationHintRule}${reverseTranslationAdverbRule}${directionalVerbRule}
${grammarAccuracyBlock}

Generate exactly ${PRACTICE_EXERCISE_COUNT} exercises as a JSON array. Choose varied types from the following pool for a balanced practice session. You MUST use ONLY the types listed below — any other type is forbidden.

VARIETY RULE (mandatory): use at least 3 DIFFERENT exercise types; no type may appear more than twice.

--- POOL OF EXERCISE TYPES (the ONLY types you may use) ---

${poolSection}

--- OUTPUT FORMAT ---
Return a JSON array of ${PRACTICE_EXERCISE_COUNT} objects, each with "type" and "data".
Example for listen-and-respond:
{
  "type": "listen-and-respond",
  "data": {
    "dialogueAudio": "Recruteur: Merci d'être venu.\\nRecruteur: Que pouvez-vous nous apporter malgré votre manque d'expérience ?",
    "promptLine": "Que pouvez-vous nous apporter malgré votre manque d'expérience ?",
    "contextPt": "Você está em uma entrevista de emprego e o recrutador questiona sua falta de experiência.",
    "evaluationCriteria": "Destacar motivação, aprendizado rápido ou experiências relacionadas com tom profissional.",
    "acceptableThemes": ["motivação para aprender", "experiências transferíveis", "tom profissional"],
    "exampleResponse": "Je suis motivé et j'apprends vite. J'ai déjà travaillé en équipe sur des projets concrets."
  }
}
Example for free-roleplay:
{
  "type": "free-roleplay",
  "data": {
    "context": "Você está no balcão de uma padaria em Paris.",
    "promptLine": "Bonjour ! Qu'est-ce que je vous mets ?",
    "evaluationCriteria": "Pedir um item do cardápio de forma educada e natural.",
    "acceptableThemes": ["pedir pão ou doce", "tom educado"],
    "exampleResponse": "Bonjour ! Je voudrais une baguette, s'il vous plaît.",
    "explanation": "Je voudrais + item é a forma natural de pedir; Bonjour mantém o registro educado."
  }
}
Example for micro-message:
{
  "type": "micro-message",
  "data": {
    "context": "Seu colega francês mandou mensagem confirmando o horário do café.",
    "incomingMessage": "Salut ! On se voit à 15h au café ?",
    "translation": "Oi! A gente se vê às 15h no café?",
    "evaluationCriteria": "Confirmar ou sugerir outro horário de forma informal e clara.",
    "exampleResponse": "Oui, parfait ! À tout à l'heure 😊"
  }
}
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
