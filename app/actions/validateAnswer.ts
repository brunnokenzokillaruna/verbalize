'use server';

import { callGeminiJSON } from '@/services/gemini';

interface ValidationResult {
  accepted: boolean;
  note?: string;
}

export async function validateReverseTranslation(
  userAnswer: string,
  expectedAnswer: string,
  portugueseSentence: string,
  language: string,
): Promise<ValidationResult> {
  const prompt = `Você está validando um exercício de tradução de português para ${language}.

Frase em português: "${portugueseSentence}"
Tradução esperada: "${expectedAnswer}"
Resposta do aluno: "${userAnswer}"

A resposta do aluno está CORRETA? Considere correto se:
- Tem o mesmo significado da frase em português
- É gramaticalmente válida em ${language}
- Pode usar formação de pergunta diferente (inversão, est-ce que, entonação)
- Pode usar pronome sujeito diferente (il/elle/on) ou omiti-lo quando válido
- Pode usar sinônimos com significado equivalente

Responda APENAS com JSON: {"accepted": true/false, "note": "motivo em português se rejeitado, vazio se aceito"}`;

  try {
    const result = await callGeminiJSON<ValidationResult>(prompt, undefined, 80);
    return { accepted: !!result.accepted, note: result.note };
  } catch {
    // On error, be lenient and accept (avoid false negatives)
    return { accepted: true };
  }
}
