'use server';

import { callGeminiJSON } from '@/services/gemini';
import { voicemailCoveragePasses, voicemailPointsCovered } from '@/lib/voicemailSummary';

export async function evaluateVoicemailSummary(params: {
  summary: string;
  keyPoints: string[];
  contextPt: string;
}): Promise<{ accepted: boolean; note?: string }> {
  const points = params.keyPoints.map((point) => point.trim()).filter(Boolean);
  const covered = voicemailPointsCovered(params.summary, points);
  if (voicemailCoveragePasses(covered, points.length)) {
    return { accepted: true };
  }

  try {
    const raw = await callGeminiJSON<{ accepted?: boolean; note?: string }>(
      `Contexto: ${params.contextPt}

Pontos da mensagem (o resumo precisa cobrir pelo menos ${points.length >= 3 ? 2 : points.length}):
${points.map((point, index) => `${index + 1}. ${point}`).join('\n')}

Resumo do aluno, em português:
"${params.summary}"

Aceite se a ideia de pontos suficientes estiver no resumo, mesmo com outras palavras.
Não exija a frase modelo. Recuse se faltar o número de pontos pedido, se inventar um fato, ou se não for um resumo.

JSON: { "accepted": true|false, "note": "uma frase curta em PT-BR se recusar" }`,
      'You grade a Brazilian Portuguese summary of a voicemail. Return only JSON.',
      256,
      0,
      'lightweight',
    );
    if (typeof raw?.accepted === 'boolean') {
      return { accepted: raw.accepted, note: raw.note };
    }
  } catch (err) {
    console.error('[evaluateVoicemailSummary] Error:', err);
  }

  return {
    accepted: false,
    note: 'O resumo precisa trazer pelo menos dois pontos do que foi dito.',
  };
}
