'use server';

import { similarity, normalizeText } from '@/components/lesson/mission-roleplay/utils';
import type { SupportedLanguage } from '@/types';

interface EvaluateFreeResponseParams {
  transcript: string;
  intent: string;
  language: SupportedLanguage;
  previousContext: string[];
  expectedLine?: string;
}

export interface EvaluateFreeResponseResult {
  isCorrect: boolean;
  feedback: string;
  correctedSentence?: string;
  error?: string;
}

const PT_STOP_WORDS = new Set([
  'a', 'o', 'e', 'de', 'da', 'do', 'em', 'um', 'uma', 'que', 'se', 'na', 'no',
  'para', 'por', 'com', 'como', 'voce', 'você', 'eu', 'ele', 'ela', 'isso', 'diga',
  'dizer', 'fale', 'peça', 'peca', 'pergunte', 'sugira', 'the', 'to', 'and',
]);

function extractKeywords(text: string): string[] {
  return normalizeText(text)
    .split(' ')
    .filter((w) => w.length > 3 && !PT_STOP_WORDS.has(w));
}

function evaluateLocally(params: EvaluateFreeResponseParams): EvaluateFreeResponseResult {
  const transcript = params.transcript.trim();
  if (!transcript || transcript.length < 2) {
    return {
      isCorrect: false,
      feedback: 'Não ouvimos sua fala. Tente falar mais perto do microfone.',
    };
  }

  if (params.expectedLine) {
    const score = similarity(params.expectedLine, transcript);
    if (score >= 0.55) {
      return {
        isCorrect: true,
        feedback: score >= 0.75 ? 'Perfeito! Comunicou a ideia muito bem.' : 'Boa! A ideia ficou clara.',
      };
    }
    if (score >= 0.4) {
      return {
        isCorrect: true,
        feedback: 'Quase lá — a ideia passou, mas dá para polir a frase.',
        correctedSentence: params.expectedLine,
      };
    }
  }

  const intentKeywords = extractKeywords(params.intent);
  const transcriptNorm = normalizeText(transcript);
  const keywordHits = intentKeywords.filter((kw) => transcriptNorm.includes(kw)).length;
  const keywordRatio = intentKeywords.length > 0 ? keywordHits / intentKeywords.length : 0;

  if (keywordRatio >= 0.35 || transcript.split(/\s+/).length >= 3) {
    return {
      isCorrect: true,
      feedback: 'Boa! Você se comunicou de forma clara.',
      correctedSentence: params.expectedLine,
    };
  }

  return {
    isCorrect: false,
    feedback: 'A resposta não parece comunicar a intenção. Ouça de novo e tente outra formulação.',
    correctedSentence: params.expectedLine,
  };
}

export async function evaluateFreeResponse(
  params: EvaluateFreeResponseParams,
): Promise<EvaluateFreeResponseResult> {
  try {
    return evaluateLocally(params);
  } catch (err) {
    console.error('[evaluateFreeResponse] Error:', err);
    return {
      isCorrect: false,
      feedback: 'Houve um erro ao analisar sua resposta. Tente novamente.',
      error: 'EVALUATION_FAILED',
    };
  }
}
