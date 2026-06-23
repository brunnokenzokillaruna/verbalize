'use server';

import { callGeminiJSON } from '@/services/gemini';
import { getCheckpointWindow, formatCheckpointRange } from '@/lib/curriculum/checkpointWindow';
import { checkpointSessionSchema } from '@/lib/schemas/checkpoint';
import { validateAndSanitizeExercises } from '@/lib/practiceExercises/validateGeneratedExercises';
import { getAllowedExerciseTypes } from '@/lib/practiceExercises/constants';
import type {
  CheckpointSessionResult,
  Exercise,
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
        "acceptable_variants": ["alt phrasing"],
        "hint": ""
      }
    },
    {
      "type": "speak-repeat",
      "data": {
        "text": "Short ${LANG_LABEL[params.language]} sentence to speak",
        "translation": "PT-BR translation"
      }
    }
  ],
  "coveredTopics": ["topic 1", "topic 2"]
}

Rules:
- Exactly 2 comprehensionQuestions
- Exactly 2 productionExercises: one reverse-translation, one speak-repeat
- NO hints in production exercises (omit hint field or use empty string)
- Dialogue must NOT be copied from any real textbook — create original scenario within theme "${params.theme}"`;

  try {
    const raw = await callGeminiJSON<CheckpointSessionResult>(prompt, systemPrompt, 4096, undefined, 'standard');
    const parsed = checkpointSessionSchema.safeParse(raw);
    if (!parsed.success) {
      console.error('[generateCheckpointSession] Schema validation failed:', parsed.error.flatten());
      return null;
    }

    const allowedSet = new Set(
      getAllowedExerciseTypes(params.level, params.knownVocabulary.length),
    );
    allowedSet.add('reverse-translation');
    allowedSet.add('speak-repeat');

    const productionExercises = await validateAndSanitizeExercises(
      parsed.data.productionExercises as unknown as Exercise[],
      allowedSet,
      params.language,
    );

    if (productionExercises.length < 2) {
      console.error('[generateCheckpointSession] Not enough valid production exercises');
      return null;
    }

    return {
      ...parsed.data,
      productionExercises: productionExercises.slice(0, 2),
    };
  } catch (err) {
    console.error('[generateCheckpointSession] Error:', err);
    return null;
  }
}
