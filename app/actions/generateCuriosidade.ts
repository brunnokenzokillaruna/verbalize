'use server';

import { callGeminiJSON } from '@/services/gemini';
import type { SupportedLanguage } from '@/types';

const LANG_LABEL: Record<SupportedLanguage, string> = {
  fr: 'French',
  en: 'English',
};

interface GenerateCuriosidadeParams {
  grammarFocus: string;
  language: SupportedLanguage;
}

/**
 * Generates a short, engaging PT-BR fun fact about the lesson's grammar focus.
 * Shown on the intro screen as a "Você sabia que…" callout.
 * Fires in parallel with the minimal hook so it arrives while the user reads intro.
 */
export async function generateCuriosidade(
  params: GenerateCuriosidadeParams,
): Promise<string | null> {
  const { grammarFocus, language } = params;

  try {
    const systemPrompt = `Você é aquele amigo que sabe todas as curiosidades inúteis e legais e conta pra todo mundo no bar. Seu objetivo é fazer o aluno dizer "Nossa, que massa!".
Regras de Humanidade:
- Use gírias naturais (tipo, né, caraca, bizarro, papo reto).
- Evite explicações secas.
- Proibido usar "Certamente", "Aqui está", "Fato curioso".
Respond with ONLY valid JSON, no markdown, no explanation.`;

    const prompt = `Write a short fun/surprising fact in casual Brazilian Portuguese about the grammar topic "${grammarFocus}" in ${LANG_LABEL[language]}.

Rules:
- 1-2 sentences maximum
- Must be ENGAGING — surprising, counterintuitive, or funny
- NEVER dry or academic
- Make the student think "Nossa, que legal!"
- Use casual PT-BR (não use linguagem formal)
- Can mention comparisons with Portuguese, quirky facts, or historical trivia

Examples of the right tone:
- "O R francês não vibra na ponta da língua como o nosso — ele nasce lá no fundo da garganta. Bizarro, né? Mas você vai dominar isso hoje!"
- "Em francês, dizer 'não' usa DUAS palavras ao mesmo tempo — ne...pas. É como se em PT-BR você tivesse que dizer 'não...nada'!"

Output ONLY this JSON:
{
  "curiosidade": "your fun fact here"
}`;

    const result = await callGeminiJSON<{ curiosidade: string }>(prompt, systemPrompt, 600, 0);
    return result?.curiosidade?.trim() || null;
  } catch (err) {
    console.error('[generateCuriosidade] Error:', err);
    return null;
  }
}
