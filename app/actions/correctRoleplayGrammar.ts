'use server';

import { callGeminiJSON } from '@/services/gemini';
import { LANG_LABEL } from '@/lib/practiceExercises/constants';
import type {
  CorrectRoleplayGrammarParams,
  CorrectRoleplayGrammarResult,
} from '@/features/roleplay-chat/types';

const SYSTEM_PROMPT = `You are a gentle grammar coach for Brazilian Portuguese speakers learning a foreign language in a spoken roleplay.

Rules:
- Feedback MUST be in Brazilian Portuguese (PT-BR), 1 short sentence, encouraging.
- Only flag real mistakes that matter for communication at the learner's level.
- Ignore filler words, false starts, and minor pronunciation artifacts from speech-to-text.
- If the utterance is already natural for the level, set hasIssues=false and give brief praise.
- correctedSentence must stay in the TARGET language and preserve the learner's meaning.
- issueTags: 0-3 short PT-BR labels (e.g. "concordância", "artigo", "tempo verbal").

Return ONLY valid JSON:
{ "hasIssues": boolean, "correctedSentence": string (optional), "feedbackPt": string, "issueTags": string[] (optional) }`;

export async function correctRoleplayGrammar(
  params: CorrectRoleplayGrammarParams,
): Promise<CorrectRoleplayGrammarResult> {
  const transcript = params.transcript.trim();
  if (!transcript || transcript.length < 2) {
    return {
      hasIssues: false,
      feedbackPt: 'Continue falando — estou acompanhando.',
    };
  }

  try {
    const lang = LANG_LABEL[params.language];
    const context =
      params.recentContext.length > 0
        ? params.recentContext.slice(-6).map((l) => `- ${l}`).join('\n')
        : '(início da conversa)';

    const prompt = `Target language: ${lang}
CEFR level: ${params.level}
Scenario: ${params.scenarioTitle}

Recent dialogue:
${context}

Learner just said (${lang}): "${transcript}"

Analyze grammar/word choice for a spoken roleplay turn.`;

    const result = await callGeminiJSON<{
      hasIssues: boolean;
      correctedSentence?: string;
      feedbackPt: string;
      issueTags?: string[];
    }>(prompt, SYSTEM_PROMPT, 320, 0, 'lightweight');

    if (typeof result.hasIssues !== 'boolean' || typeof result.feedbackPt !== 'string') {
      return {
        hasIssues: false,
        feedbackPt: 'Não consegui analisar agora — continue a conversa.',
        error: 'INVALID_RESPONSE',
      };
    }

    return {
      hasIssues: result.hasIssues,
      correctedSentence: result.correctedSentence?.trim() || undefined,
      feedbackPt: result.feedbackPt.trim(),
      issueTags: Array.isArray(result.issueTags)
        ? result.issueTags.filter((t) => typeof t === 'string').slice(0, 3)
        : undefined,
    };
  } catch (err) {
    console.warn('[correctRoleplayGrammar] failed:', err);
    return {
      hasIssues: false,
      feedbackPt: 'Correção temporariamente indisponível.',
      error: 'GRAMMAR_FAILED',
    };
  }
}
