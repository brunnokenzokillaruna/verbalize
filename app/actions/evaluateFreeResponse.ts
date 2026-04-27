'use server';

import { callGeminiJSON } from '@/services/gemini';
import type { SupportedLanguage } from '@/types';

const LANG_LABEL: Record<SupportedLanguage, string> = {
  fr: 'French',
  en: 'English',
};

interface EvaluateFreeResponseParams {
  transcript: string;
  intent: string;
  language: SupportedLanguage;
  previousContext: string[]; // Last few lines of dialogue to provide context
}

export interface EvaluateFreeResponseResult {
  isCorrect: boolean;
  feedback: string;
  correctedSentence?: string;
  error?: string;
}

export async function evaluateFreeResponse(
  params: EvaluateFreeResponseParams
): Promise<EvaluateFreeResponseResult> {
  const prompt = `You are a strict but fair language teacher evaluating a student's spoken response in ${LANG_LABEL[params.language]}.

CONTEXT (previous dialogue lines):
${params.previousContext.join('\n') || '(Start of conversation)'}

STUDENT'S INTENT (what they were supposed to say in PT-BR):
"${params.intent}"

STUDENT'S ACTUAL TRANSCRIPT (what the speech-to-text heard in ${LANG_LABEL[params.language]}):
"${params.transcript}"

EVALUATION TASK:
1. Determine if the student's transcript successfully and naturally communicates the required intent in ${LANG_LABEL[params.language]}.
2. Minor grammar mistakes (like wrong gender or slight misconjugation) are acceptable IF the intent is perfectly clear and it's a typical intermediate learner mistake.
3. If the transcript makes no sense, is the wrong language, or completely misses the intent, it is INCORRECT.
4. Provide a very short, encouraging feedback in PT-BR (max 2 sentences).
5. If there are mistakes or a much more natural way to say it, provide the "correctedSentence" in ${LANG_LABEL[params.language]}.

Return ONLY a JSON object with this exact structure:
{
  "isCorrect": boolean,
  "feedback": "string",
  "correctedSentence": "string" // optional
}`;

  try {
    const result = await callGeminiJSON<EvaluateFreeResponseResult>(prompt, 'You are an expert language evaluator. Return ONLY valid JSON.');
    return result;
  } catch (err) {
    console.error('[evaluateFreeResponse] Error:', err);
    return { isCorrect: false, feedback: 'Houve um erro ao analisar sua resposta. Tente novamente.', error: 'EVALUATION_FAILED' };
  }
}
