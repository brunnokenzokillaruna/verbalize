'use server';

import { callGeminiJSON } from '@/services/gemini';
import type { SupportedLanguage, PhoneticsTipResult } from '@/types';

const LANG_LABEL: Record<SupportedLanguage, string> = {
  fr: 'French',
  en: 'English',
};

interface GeneratePhoneticsTipParams {
  dialogue: string;
  grammarFocus: string;
  language: SupportedLanguage;
}

/**
 * Generates a Brazilian-friendly phonetics tip for PRON lessons.
 * Uses plain PT-BR syllable approximations instead of IPA.
 * Fires in parallel with the minimal hook.
 */
export async function generatePhoneticsTip(
  params: GeneratePhoneticsTipParams,
): Promise<PhoneticsTipResult | null> {
  const { dialogue, grammarFocus, language } = params;

  try {
    const systemPrompt = `You are a phonetics coach for Brazilian Portuguese speakers learning ${LANG_LABEL[language]}. Respond with ONLY valid JSON, no markdown, no explanation.`;

    const prompt = `The lesson's phonetic focus is "${grammarFocus}" in ${LANG_LABEL[language]}.

Dialogue for context (pick 3 real words from here):
"${dialogue}"

Generate a phonetics tip using ONLY plain Brazilian Portuguese — no IPA, no linguistics jargon. Explain sounds via body sensations and familiar comparisons.

BANNED WORDS (never use): gutural, fricativa, sonoridade, fonema, oclusiva, nasal, palatal, velar, alvéolo, laringe.
Instead use: "fundo da garganta", "ponta da língua", "biquinho de beijo", "como se fosse cuspir", "lábios arredondados", "som de Z", etc.

Output ONLY this JSON:
{
  "title": "Short catchy title in plain PT-BR — any Brazilian understands it (ex: 'O R que vem da garganta', 'O som de U com biquinho')",
  "explanation": "2-3 sentences in CASUAL PT-BR using analogies. Be fun and encouraging. Ex: 'O R francês nasce lá no fundo da garganta — imagina que você está prestes a cuspir, mas bem levinho. Nada de vibrar a pontinha da língua como a gente faz!'",
  "examples": [
    { "word": "real word from the dialogue above", "soundsLike": "Como essa palavra soa escrita em português — use sílabas do PT-BR para imitar o som. Sílabas tônicas em MAIÚSCULA. Ex: 'regarde' → 'rrr-GARD', 'bonjour' → 'bom-JUUR'. Use 'rrr' para o R francês, 'ü' para o U francês, 'gn' para o NH.", "tip": "Dica curta em PT-BR — sem termos técnicos. Ex: 'o R sai lá no fundo da garganta'" },
    { "word": "second real word from dialogue", "soundsLike": "...", "tip": "..." },
    { "word": "third real word from dialogue", "soundsLike": "...", "tip": "..." }
  ],
  "brazilianTrap": "The most common mistake Brazilians make with this sound — in plain everyday language, no jargon. Be concrete. Ex: 'A gente tende a vibrar a ponta da língua como no nosso R, mas no francês o R fica parado — é a garganta que trabalha.'"
}

Rules:
- All three example words MUST appear literally in the dialogue above
- NEVER use IPA symbols (like /ʁ/, /y/, /ɛ/)
- "soundsLike" must be readable by any Brazilian with no linguistics background`;

    return await callGeminiJSON<PhoneticsTipResult>(prompt, systemPrompt, 1500, 0);
  } catch (err) {
    console.error('[generatePhoneticsTip] Error:', err);
    return null;
  }
}
