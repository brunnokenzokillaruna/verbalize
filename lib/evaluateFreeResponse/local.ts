import { similarity, normalizeText } from '@/components/lesson/mission-roleplay/utils';
import type { EvaluateFreeResponseParams, EvaluateFreeResponseResult } from './types';

const PT_STOP_WORDS = new Set([
  'a', 'o', 'e', 'de', 'da', 'do', 'em', 'um', 'uma', 'que', 'se', 'na', 'no',
  'para', 'por', 'com', 'como', 'voce', 'você', 'eu', 'ele', 'ela', 'isso', 'diga',
  'dizer', 'fale', 'peça', 'peca', 'pergunte', 'sugira', 'the', 'to', 'and', 'uma',
  'responda', 'resposta', 'falar', 'dizer', 'comunicar',
]);

function extractKeywords(text: string): string[] {
  return normalizeText(text)
    .split(' ')
    .filter((w) => w.length > 3 && !PT_STOP_WORDS.has(w));
}

function themeKeywordHits(transcriptNorm: string, themes: string[]): number {
  if (themes.length === 0) return 0;
  let hits = 0;
  for (const theme of themes) {
    const keywords = extractKeywords(theme);
    if (keywords.length === 0) continue;
    const matched = keywords.filter((kw) => transcriptNorm.includes(kw)).length;
    if (matched / keywords.length >= 0.34) hits += 1;
  }
  return hits;
}

export function evaluateFreeResponseLocal(
  params: EvaluateFreeResponseParams,
): EvaluateFreeResponseResult {
  const transcript = params.transcript.trim();
  if (!transcript || transcript.length < 2) {
    return {
      isCorrect: false,
      feedback: 'Não ouvimos sua fala. Tente falar mais perto do microfone.',
      evaluator: 'local',
    };
  }

  if (params.expectedLine) {
    const score = similarity(params.expectedLine, transcript);
    if (score >= 0.55) {
      return {
        isCorrect: true,
        feedback:
          score >= 0.75
            ? 'Perfeito! Comunicou a ideia muito bem.'
            : 'Boa! A ideia ficou clara.',
        evaluator: 'local',
      };
    }
    if (score >= 0.4) {
      return {
        isCorrect: true,
        feedback: 'Quase lá — a ideia passou, mas dá para polir a frase.',
        // Do NOT use expectedLine here — it is a canned example, not a polish
        // of the learner's words (e.g. hill vs museum).
        evaluator: 'local',
      };
    }
  }

  const rubricText = [params.intent, params.evaluationCriteria ?? ''].filter(Boolean).join(' ');
  const intentKeywords = extractKeywords(rubricText);
  const transcriptNorm = normalizeText(transcript);
  const keywordHits = intentKeywords.filter((kw) => transcriptNorm.includes(kw)).length;
  const keywordRatio = intentKeywords.length > 0 ? keywordHits / intentKeywords.length : 0;

  const themeHits = themeKeywordHits(transcriptNorm, params.acceptableThemes ?? []);
  const themeRatio =
    (params.acceptableThemes?.length ?? 0) > 0
      ? themeHits / (params.acceptableThemes?.length ?? 1)
      : 0;

  const wordCount = transcript.split(/\s+/).filter(Boolean).length;

  if (keywordRatio >= 0.35 || themeRatio >= 0.5 || wordCount >= 4) {
    return {
      isCorrect: true,
      feedback: 'Boa! Você se comunicou de forma clara.',
      evaluator: 'local',
    };
  }

  if (wordCount >= 3 && keywordRatio >= 0.2) {
    return {
      isCorrect: true,
      feedback: 'A ideia passou — com um pouco mais de detalhe ficaria ainda melhor.',
      evaluator: 'local',
    };
  }

  return {
    isCorrect: false,
    feedback:
      'A resposta não parece comunicar a intenção. Ouça de novo e tente outra formulação.',
    correctedSentence: params.expectedLine,
    evaluator: 'local',
  };
}
