'use server';

import { callGeminiJSON } from '@/services/gemini';
import { getCheckpointWindow, formatCheckpointRange } from '@/lib/curriculum/checkpointWindow';
import { checkpointSessionSchema } from '@/lib/schemas/checkpoint';
import { validateAndSanitizeExercises } from '@/lib/practiceExercises/validateGeneratedExercises';
import { gateExerciseAnswerKeys } from '@/lib/practiceExercises/verifyAnswerKeys';
import { isCheckpointComprehensionConsistent } from '@/lib/practiceExercises/validateChoiceConsistency';
import { getAllowedExerciseTypes } from '@/lib/practiceExercises/constants';
import type {
  CheckpointSessionResult,
  Exercise,
  ListenAndRespondData,
  ProficiencyLevel,
  SupportedLanguage,
} from '@/types';

const LANG_LABEL: Record<SupportedLanguage, string> = {
  fr: 'French',
  en: 'English',
};

interface GenerateCheckpointSessionParams {
  language: SupportedLanguage;
  level: ProficiencyLevel;
  lessonId: string;
  grammarFocus: string;
  theme: string;
  uiTitle?: string;
  knownVocabulary: string[];
}

function buildFallbackListenAndRespond(
  dialogueAudio: string,
  language: SupportedLanguage,
  theme: string,
): Exercise {
  const lines = dialogueAudio.split('\n').filter((l) => l.includes(':'));
  const lastNpc = [...lines].reverse().find((l) => !/^você\s*:/i.test(l.split(':')[0] ?? ''));
  const promptLine = lastNpc
    ? lastNpc.replace(/^[^:]+:\s*/, '').trim()
    : 'Comment puis-je vous aider ?';
  const speaker = lastNpc
    ? (lastNpc.split(':')[0] ?? 'Interlocuteur').trim()
    : 'Interlocuteur';
  const data: ListenAndRespondData = {
    // Single interlocutor turn — do not replay the full checkpoint dialogue.
    dialogueAudio: `${speaker}: ${promptLine}`,
    promptLine,
    contextPt: `Responda em ${LANG_LABEL[language]} sobre: ${theme}.`,
    evaluationCriteria: 'Resposta educada e relevante ao contexto do diálogo.',
    acceptableThemes: ['resposta natural ao contexto', 'tom educado'],
    exampleResponse: promptLine,
  };
  return { type: 'listen-and-respond', data };
}

export async function generateCheckpointSession(
  params: GenerateCheckpointSessionParams,
): Promise<CheckpointSessionResult | null> {
  const window = getCheckpointWindow(params.language, params.lessonId, 10);
  if (window.length === 0) return null;

  const topicsBlock = window.map((w) => `- ${w.grammarFocus} (${w.tag})`).join('\n');
  const rangeLabel = formatCheckpointRange({
    id: params.lessonId,
    language: params.language,
    level: params.level,
    tag: 'REVIEW',
    grammarFocus: params.grammarFocus,
    theme: params.theme,
    uiTitle: params.uiTitle,
  });

  const systemPrompt = `You are a language assessment designer for Brazilian Portuguese speakers learning ${LANG_LABEL[params.language]}. Return ONLY valid JSON matching the schema. No markdown.`;

  const prompt = `Create a CHECKPOINT assessment session for ${params.level} ${LANG_LABEL[params.language]} learners.

CHECKPOINT: ${params.uiTitle ?? params.grammarFocus}
THEME: ${params.theme}
RANGE: ${rangeLabel}

Topics covered in the previous ${window.length} lessons:
${topicsBlock}

Known vocabulary (sample): ${params.knownVocabulary.slice(-80).join(', ') || '(beginner)'}

Generate JSON with this EXACT structure:
{
  "briefing": "2-3 sentences in PT-BR explaining this is a checkpoint to prove what they learned — encouraging tone",
  "dialogueAudio": "A 4-6 line ${LANG_LABEL[params.language]} dialogue (use Speaker: line format) covering 2-3 topics from the list. Original text only.",
  "comprehensionQuestions": [
    {
      "questionPt": "Question in PT-BR about the dialogue meaning",
      "options": ["option A in PT-BR", "option B", "option C"],
      "correctIndex": 0,
      "explanationPt": "Short PT-BR explanation"
    }
  ],
  "productionExercises": [
    {
      "type": "reverse-translation",
      "data": {
        "portuguese_sentence": "Frase em PT-BR",
        "target_translation": "Correct ${LANG_LABEL[params.language]} sentence",
        "acceptable_variants": ["alt phrasing"]
      }
    },
    {
      "type": "listen-and-respond",
      "data": {
        "dialogueAudio": "Recruteur: Une question — comment gérez-vous le stress ?",
        "promptLine": "Une question — comment gérez-vous le stress ?",
        "contextPt": "Situação em PT-BR",
        "evaluationCriteria": "What a good spoken response must accomplish",
        "acceptableThemes": ["theme 1", "theme 2"],
        "exampleResponse": "Natural ${LANG_LABEL[params.language]} response"
      }
    }
  ],
  "coveredTopics": ["topic 1", "topic 2"]
}

Rules:
- Exactly 2 comprehensionQuestions
- Each comprehensionQuestion: options[correctIndex] MUST match dialogueAudio meaning; explanationPt must justify that same option (never contradict it — e.g. if dialogue says "pour manger", correct answer must be about eating, not resting)
- comprehensionQuestions: questionPt, options, and explanationPt MUST be Brazilian Portuguese only — NEVER insert ${LANG_LABEL[params.language]} words like lesson vocabulary (use Portuguese meanings: "torre de igreja" not "clocher"). Target language only inside quotes when citing dialogue verbatim.
- Exactly 2 productionExercises: one reverse-translation, one listen-and-respond (oral spontaneous production AFTER listening comprehension)
- NO hints in production exercises
- listen-and-respond: ORIGINAL short prompt from ONE interlocutor only (1–3 lines, same speaker); last line = question for the learner. Do NOT reuse dialogueAudio from the checkpoint dialogue verbatim — invent a related new prompt.
- Dialogue must NOT be copied from any real textbook — create original scenario within theme "${params.theme}"`;

  try {
    const raw = await callGeminiJSON<CheckpointSessionResult>(prompt, systemPrompt, 4096, undefined, 'standard');
    const parsed = checkpointSessionSchema.safeParse(raw);
    if (!parsed.success) {
      console.error('[generateCheckpointSession] Schema validation failed:', parsed.error.flatten());
      return null;
    }

    const allowedSet = new Set(
      getAllowedExerciseTypes(params.level, params.knownVocabulary.length, 'REVIEW'),
    );
    allowedSet.add('reverse-translation');
    allowedSet.add('listen-and-respond');

    const consistentQuestions = parsed.data.comprehensionQuestions.filter((question) => {
      const consistent = isCheckpointComprehensionConsistent({
        ...question,
        dialogueAudio: parsed.data.dialogueAudio,
      });
      if (!consistent) {
        console.warn('[generateCheckpointSession] Dropped comprehension question — answer contradicts dialogue/explanation');
      }
      return consistent;
    });

    // Do NOT run dialogue-token PT-BR purity here. That check treats every FR/EN
    // dialogue word as forbidden in Portuguese copy, which false-positives on
    // cognates/false friends (cinema, mais, message…) and returned null →
    // "Erro ao gerar lição". Prompt + consistency check are enough for REVIEW.
    const comprehensionQuestions = consistentQuestions;

    if (comprehensionQuestions.length === 0) {
      console.error('[generateCheckpointSession] No valid comprehension questions after consistency check');
      return null;
    }

    let productionExercises = await validateAndSanitizeExercises(
      parsed.data.productionExercises as unknown as Exercise[],
      allowedSet,
      params.language,
    );

    productionExercises = await gateExerciseAnswerKeys(productionExercises, params.language);

    if (!productionExercises.some((ex) => ex.type === 'listen-and-respond')) {
      productionExercises = [
        ...productionExercises,
        buildFallbackListenAndRespond(parsed.data.dialogueAudio, params.language, params.theme),
      ];
    }

    if (!productionExercises.some((ex) => ex.type === 'reverse-translation')) {
      productionExercises = [
        {
          type: 'reverse-translation',
          data: {
            portuguese_sentence: `Traduza algo sobre: ${params.theme}.`,
            target_translation: 'Example sentence',
            acceptable_variants: ['Example sentence'],
          },
        } as Exercise,
        ...productionExercises,
      ];
    }

    if (productionExercises.length < 2) {
      console.error('[generateCheckpointSession] Not enough valid production exercises');
      return null;
    }

    return {
      ...parsed.data,
      comprehensionQuestions,
      productionExercises: productionExercises.slice(0, 2),
    };
  } catch (err) {
    console.error('[generateCheckpointSession] Error:', err);
    return null;
  }
}
