'use server';

import { evaluateFreeResponseGemini } from '@/lib/evaluateFreeResponse/gemini';
import { evaluateFreeResponseLocal } from '@/lib/evaluateFreeResponse/local';
import type {
  EvaluateFreeResponseParams,
  EvaluateFreeResponseResult,
} from '@/lib/evaluateFreeResponse/types';

export async function evaluateFreeResponse(
  params: EvaluateFreeResponseParams,
): Promise<EvaluateFreeResponseResult> {
  try {
    const useGemini = params.preferGemini !== false;

    if (useGemini) {
      const geminiResult = await evaluateFreeResponseGemini(params);
      if (geminiResult) {
        return { ...geminiResult, evaluator: 'gemini' };
      }
    }

    return evaluateFreeResponseLocal(params);
  } catch (err) {
    console.error('[evaluateFreeResponse] Error:', err);
    try {
      return evaluateFreeResponseLocal(params);
    } catch {
      return {
        isCorrect: false,
        feedback: 'Houve um erro ao analisar sua resposta. Tente novamente.',
        error: 'EVALUATION_FAILED',
        evaluator: 'local',
      };
    }
  }
}
