import { callGeminiJSON } from '@/services/gemini';
import { LANG_LABEL } from '@/lib/practiceExercises/constants';
import type { EvaluateFreeResponseParams, GeminiEvaluationPayload } from './types';

const SYSTEM_PROMPT = `You evaluate whether a language learner's spoken or written response adequately communicates the intended meaning.
Accept grammatically imperfect but communicatively successful answers.
Reject answers that miss the intent, use the wrong language, are empty, or are unrelated.
Feedback must be in Brazilian Portuguese (PT-BR), 1-2 short encouraging sentences.
If incorrect, optionally suggest a natural corrected sentence in the target language.
Return ONLY valid JSON with keys: isCorrect (boolean), feedback (string), correctedSentence (string, optional).`;

function buildEvaluationPrompt(params: EvaluateFreeResponseParams): string {
  const langLabel = LANG_LABEL[params.language];
  const contextBlock =
    params.previousContext.length > 0
      ? params.previousContext.map((l) => `- ${l}`).join('\n')
      : '(none)';

  const themes =
    params.acceptableThemes && params.acceptableThemes.length > 0
      ? params.acceptableThemes.map((t) => `- ${t}`).join('\n')
      : '(none specified)';

  return `Target language: ${langLabel}

Previous dialogue:
${contextBlock}

Situation / intent (PT-BR): ${params.intent}
${params.evaluationCriteria ? `Evaluation criteria: ${params.evaluationCriteria}` : ''}
${params.promptLine ? `Interlocutor said (${langLabel}): "${params.promptLine}"` : ''}
${params.expectedLine ? `Example good response (${langLabel}): "${params.expectedLine}"` : ''}

Acceptable themes (any of these ideas counts as success):
${themes}

Learner response (${langLabel}): "${params.transcript.trim()}"

Does the learner response pragmatically fit the situation and communicate the intent?`;
}

export async function evaluateFreeResponseGemini(
  params: EvaluateFreeResponseParams,
): Promise<GeminiEvaluationPayload | null> {
  try {
    const result = await callGeminiJSON<GeminiEvaluationPayload>(
      buildEvaluationPrompt(params),
      SYSTEM_PROMPT,
      384,
      0,
      'lightweight',
    );

    if (typeof result.isCorrect !== 'boolean' || typeof result.feedback !== 'string') {
      return null;
    }

    return {
      isCorrect: result.isCorrect,
      feedback: result.feedback.trim(),
      correctedSentence: result.correctedSentence?.trim() || undefined,
    };
  } catch (err) {
    console.warn('[evaluateFreeResponseGemini] Gemini failed, caller should fallback:', err);
    return null;
  }
}
