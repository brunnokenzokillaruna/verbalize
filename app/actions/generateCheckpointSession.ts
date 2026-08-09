'use server';

import { callGeminiJSON } from '@/services/gemini';
import {
  buildCoveredTopics,
  pickStructuralProductionType,
  sampleAssessedTopics,
} from '@/lib/curriculum/checkpointAssessment';
import { getCheckpointWindow, formatCheckpointRange } from '@/lib/curriculum/checkpointWindow';
import { checkpointSessionSchema } from '@/lib/schemas/checkpoint';
import { validateAndSanitizeExercises } from '@/lib/practiceExercises/validateGeneratedExercises';
import { gateExerciseAnswerKeys } from '@/lib/practiceExercises/verifyAnswerKeys';
import { isCheckpointComprehensionConsistent } from '@/lib/practiceExercises/validateChoiceConsistency';
import { getAllowedExerciseTypes } from '@/lib/practiceExercises/constants';
import { buildTypeDescriptions } from '@/lib/practiceExercises/exerciseTypeDescriptions';
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

interface RawProductionExercise {
  type: string;
  data: Record<string, unknown>;
  topicFocus?: string;
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
    dialogueAudio: `${speaker}: ${promptLine}`,
    promptLine,
    contextPt: `Responda em ${LANG_LABEL[language]} sobre: ${theme}.`,
    evaluationCriteria: 'Resposta educada e relevante ao contexto do diálogo.',
    acceptableThemes: ['resposta natural ao contexto', 'tom educado'],
    exampleResponse: promptLine,
  };
  return { type: 'listen-and-respond', data };
}

function buildFallbackReverseTranslation(theme: string, language: SupportedLanguage): Exercise {
  return {
    type: 'reverse-translation',
    data: {
      portuguese_sentence: `Traduza uma frase natural sobre: ${theme}.`,
      target_translation:
        language === 'fr' ? 'Je suis prêt pour le voyage.' : "I'm ready for the trip.",
      acceptable_variants:
        language === 'fr'
          ? ['Je suis prêt pour le voyage.', 'Je suis prête pour le voyage.']
          : ["I'm ready for the trip.", 'I am ready for the trip.'],
    },
  };
}

export async function generateCheckpointSession(
  params: GenerateCheckpointSessionParams,
): Promise<CheckpointSessionResult | null> {
  const window = getCheckpointWindow(params.language, params.lessonId, 10);
  if (window.length === 0) return null;

  const assessed = sampleAssessedTopics(window, Math.min(5, window.length));
  const coveredTopics = buildCoveredTopics(window);
  const assessedLabels = assessed.map((a) => a.grammarFocus);

  const topicsBlock = window.map((w) => `- ${w.grammarFocus} (${w.tag})`).join('\n');
  const assessedBlock = assessed
    .map((w, i) => `${i + 1}. ${w.grammarFocus} — theme hint: ${w.theme}`)
    .join('\n');

  const rangeLabel = formatCheckpointRange({
    id: params.lessonId,
    language: params.language,
    level: params.level,
    tag: 'REVIEW',
    grammarFocus: params.grammarFocus,
    theme: params.theme,
    uiTitle: params.uiTitle,
  });

  const allowedSet = new Set(
    getAllowedExerciseTypes(params.level, params.knownVocabulary.length, 'REVIEW'),
  );
  allowedSet.add('reverse-translation');
  allowedSet.add('listen-and-respond');
  const structuralType = pickStructuralProductionType(allowedSet);
  const structuralLabel = structuralType ?? 'sentence-builder';
  const typeDescriptions = buildTypeDescriptions(LANG_LABEL[params.language]);
  const structuralSpec =
    typeDescriptions[structuralLabel] ??
    typeDescriptions['sentence-builder'];

  const systemPrompt = `You are a language assessment designer for Brazilian Portuguese speakers learning ${LANG_LABEL[params.language]}. Return ONLY valid JSON matching the schema. No markdown. This is a dense CHECKPOINT (assessment by sampling) — do NOT teach grammar.`;

  const prompt = `Create a DENSE CHECKPOINT assessment for ${params.level} ${LANG_LABEL[params.language]} learners.

CHECKPOINT: ${params.uiTitle ?? params.grammarFocus}
THEME: ${params.theme}
RANGE: ${rangeLabel}

Full window (retrieval context — do NOT try to re-teach all of these):
${topicsBlock}

MUST ASSESS these sampled topics (spread across dialogue + items):
${assessedBlock}

Known vocabulary (sample): ${params.knownVocabulary.slice(-80).join(', ') || '(beginner)'}

Generate JSON with this EXACT structure:
{
  "briefing": "2 sentences in PT-BR: this is a dense checkpoint to prove retention by sampling — encouraging, no grammar lecture",
  "dialogueAudio": "A 6-8 line ${LANG_LABEL[params.language]} dialogue (Speaker: line format). Weave in AT LEAST 4 of the MUST ASSESS topics naturally. Original text only.",
  "comprehensionQuestions": [
    {
      "questionPt": "PT-BR question about the dialogue",
      "options": ["A", "B", "C"],
      "correctIndex": 0,
      "explanationPt": "Short PT-BR explanation",
      "topicFocus": "Exact grammarFocus string from MUST ASSESS list"
    }
  ],
  "productionExercises": [
    {
      "type": "reverse-translation",
      "topicFocus": "Exact grammarFocus from MUST ASSESS",
      "data": {
        "portuguese_sentence": "Frase em PT-BR",
        "target_translation": "Correct ${LANG_LABEL[params.language]} sentence",
        "acceptable_variants": ["alt phrasing"]
      }
    },
    {
      "type": "listen-and-respond",
      "topicFocus": "Exact grammarFocus from MUST ASSESS",
      "data": {
        "dialogueAudio": "Recruteur: Une question — comment gérez-vous le stress ?",
        "promptLine": "Une question — comment gérez-vous le stress ?",
        "contextPt": "Situação em PT-BR",
        "evaluationCriteria": "What a good spoken response must accomplish",
        "acceptableThemes": ["theme 1", "theme 2"],
        "exampleResponse": "Natural ${LANG_LABEL[params.language]} response"
      }
    },
    {
      "type": "${structuralLabel}",
      "topicFocus": "Exact grammarFocus from MUST ASSESS",
      "data": { "...fields for ${structuralLabel}..." }
    }
  ],
  "coveredTopics": ${JSON.stringify(coveredTopics)},
  "assessedTopics": ${JSON.stringify(assessedLabels)}
}

Third production exercise schema (${structuralLabel}):
${structuralSpec}

Rules:
- Exactly 3 comprehensionQuestions with DISTINCT skills: (1) gist/main idea, (2) specific detail, (3) inference or pragmatic intent
- Each comprehensionQuestion: options[correctIndex] MUST match dialogueAudio; explanationPt must justify that option
- comprehensionQuestions: questionPt, options, explanationPt MUST be Brazilian Portuguese only — NEVER insert ${LANG_LABEL[params.language]} lesson vocabulary (use Portuguese meanings). Target language only inside quotes when citing dialogue verbatim.
- Each comprehensionQuestion.topicFocus MUST be copied verbatim from the MUST ASSESS list; the three questions should cover THREE DIFFERENT assessed topics when possible
- Exactly 3 productionExercises:
  1) reverse-translation (written production of a window structure)
  2) listen-and-respond (oral spontaneous — AFTER listening comprehension)
  3) ${structuralLabel} (structural/form focus from the assessed topics)
- Each productionExercises[].topicFocus MUST be from MUST ASSESS; prefer three different topics across the three production items
- NO hints in production exercises
- listen-and-respond: ORIGINAL short prompt from ONE interlocutor only (1–3 lines); last line = question for the learner. Do NOT reuse dialogueAudio from the checkpoint dialogue verbatim — invent a related new prompt tied to an assessed topic
- Dialogue must NOT be copied from any real textbook — create original scenario within theme "${params.theme}"
- Do NOT include a grammar explanation or bridge — assessment only`;

  try {
    const raw = await callGeminiJSON<CheckpointSessionResult & { productionExercises: RawProductionExercise[] }>(
      prompt,
      systemPrompt,
      6144,
      undefined,
      'standard',
    );
    const parsed = checkpointSessionSchema.safeParse(raw);
    if (!parsed.success) {
      console.error('[generateCheckpointSession] Schema validation failed:', parsed.error.flatten());
      return null;
    }

    const consistentQuestions = parsed.data.comprehensionQuestions.filter((question) => {
      const consistent = isCheckpointComprehensionConsistent({
        ...question,
        dialogueAudio: parsed.data.dialogueAudio,
      });
      if (!consistent) {
        console.warn(
          '[generateCheckpointSession] Dropped comprehension question — answer contradicts dialogue/explanation',
        );
      }
      return consistent;
    });

    if (consistentQuestions.length < 2) {
      console.error('[generateCheckpointSession] Not enough valid comprehension questions after consistency check');
      return null;
    }

    const rawProduction = parsed.data.productionExercises as RawProductionExercise[];

    let sanitized = await validateAndSanitizeExercises(
      rawProduction.map(({ type, data }) => ({ type, data })) as unknown as Exercise[],
      allowedSet,
      params.language,
    );
    sanitized = await gateExerciseAnswerKeys(sanitized, params.language);

    const usedSanitized = new Set<number>();
    const assembled: Array<{ exercise: Exercise; topic: string }> = [];

    const takeByType = (wanted: string, fallbackTopic: string) => {
      const idx = sanitized.findIndex((ex, i) => ex.type === wanted && !usedSanitized.has(i));
      if (idx < 0) return;
      usedSanitized.add(idx);
      const rawMatch = rawProduction.find((ex) => ex.type === wanted);
      assembled.push({
        exercise: sanitized[idx]!,
        topic: rawMatch?.topicFocus?.trim() || fallbackTopic,
      });
    };

    takeByType('reverse-translation', assessedLabels[0] || coveredTopics[0]!);
    takeByType('listen-and-respond', assessedLabels[1] || coveredTopics[0]!);
    if (structuralType) {
      takeByType(structuralType, assessedLabels[2] || coveredTopics[0]!);
    }

    for (let i = 0; i < sanitized.length && assembled.length < 3; i++) {
      if (usedSanitized.has(i)) continue;
      usedSanitized.add(i);
      assembled.push({
        exercise: sanitized[i]!,
        topic:
          rawProduction[i]?.topicFocus?.trim() ||
          assessedLabels[assembled.length % assessedLabels.length] ||
          coveredTopics[0]!,
      });
    }

    if (!assembled.some((a) => a.exercise.type === 'listen-and-respond')) {
      assembled.push({
        exercise: buildFallbackListenAndRespond(
          parsed.data.dialogueAudio,
          params.language,
          params.theme,
        ),
        topic: assessedLabels[assessedLabels.length - 1] || coveredTopics[0]!,
      });
    }

    if (!assembled.some((a) => a.exercise.type === 'reverse-translation')) {
      assembled.unshift({
        exercise: buildFallbackReverseTranslation(params.theme, params.language),
        topic: assessedLabels[0] || coveredTopics[0]!,
      });
    }

    const finalAssembled = assembled.slice(0, 3);
    if (finalAssembled.length < 2) {
      console.error('[generateCheckpointSession] Not enough valid production exercises');
      return null;
    }

    return {
      briefing: parsed.data.briefing,
      dialogueAudio: parsed.data.dialogueAudio,
      comprehensionQuestions: consistentQuestions.slice(0, 3),
      productionExercises: finalAssembled.map((a) => a.exercise),
      productionTopics: finalAssembled.map((a) => a.topic),
      coveredTopics,
      assessedTopics: assessedLabels,
    };
  } catch (err) {
    console.error('[generateCheckpointSession] Error:', err);
    return null;
  }
}
