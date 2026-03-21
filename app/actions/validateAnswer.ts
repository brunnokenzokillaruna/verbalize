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
Tradução esperada (referência): "${expectedAnswer}"
Resposta do aluno: "${userAnswer}"

A resposta do aluno está CORRETA? O critério principal é: a resposta do aluno é uma tradução válida e gramaticalmente correta da frase em português? Considere CORRETO se:
- Tem o mesmo significado da frase em português (mesmo que seja mais completa ou mais curta que a referência)
- É gramaticalmente válida em ${language}
- Pode usar formação de pergunta diferente (inversão, est-ce que, entonação, forma elíptica)
- Pode usar pronome sujeito diferente (il/elle/on/ils) ou omiti-lo quando válido
- Pode usar sinônimos com significado equivalente (ex: avoir/posséder, grand/gros, etc.)
- Pode ser gramaticalmente MAIS completa que a referência (ex: adicionar pronome ou verbo que estava implícito)
- Pode ser gramaticalmente MAIS curta/elíptica que a referência, desde que seja natural em ${language}

Considere ERRADO APENAS se:
- Traduz algo diferente da frase em português
- Tem erros gramaticais graves que mudam o sentido
- Usa palavras completamente erradas

Responda APENAS com JSON: {"accepted": true/false, "note": "motivo em português se rejeitado, vazio se aceito"}`;

  try {
    const result = await callGeminiJSON<ValidationResult>(prompt, undefined, 80);
    return { accepted: !!result.accepted, note: result.note };
  } catch {
    // On error, be lenient and accept (avoid false negatives)
    return { accepted: true };
  }
}
