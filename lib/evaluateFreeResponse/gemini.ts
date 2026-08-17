import { callGeminiJSON } from '@/services/gemini';
import type { EvaluateFreeResponseParams, GeminiEvaluationPayload } from './types';
import { buildEvaluationPrompt, FREE_RESPONSE_SYSTEM_PROMPT } from './prompt';

export { buildEvaluationPrompt, FREE_RESPONSE_SYSTEM_PROMPT } from './prompt';

export async function evaluateFreeResponseGemini(
  params: EvaluateFreeResponseParams,
): Promise<GeminiEvaluationPayload | null> {
  try {
    const result = await callGeminiJSON<GeminiEvaluationPayload>(
      buildEvaluationPrompt(params),
      FREE_RESPONSE_SYSTEM_PROMPT,
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
