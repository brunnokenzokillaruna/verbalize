'use server';

import { callGeminiJSON } from '@/services/gemini';
import type { SupportedLanguage, MissionBriefingResult } from '@/types';

const LANG_LABEL: Record<SupportedLanguage, string> = {
  fr: 'French',
  en: 'English',
};

interface GenerateMissionBriefingParams {
  grammarFocus: string;
  theme?: string;
  uiTitle?: string;
  language: SupportedLanguage;
  dialogue?: string;
}

/**
 * Generates a mission briefing for MISS lessons — a Brazilian-in-France/UK scenario
 * with 3 objectives and 3 key phrases. Fires in parallel with the minimal hook.
 */
export async function generateMissionBriefing(
  params: GenerateMissionBriefingParams,
): Promise<MissionBriefingResult | null> {
  const { grammarFocus, theme, uiTitle, language, dialogue } = params;

  try {
    const systemPrompt = `You write engaging mission briefings in Brazilian Portuguese for learners of ${LANG_LABEL[language]}. Respond with ONLY valid JSON, no markdown, no explanation.`;

    const prompt = `Create a mission briefing for a Brazilian student learning ${LANG_LABEL[language]}.

 Lesson focus: "${grammarFocus}"
 ${theme ? `Theme: "${theme}"\n` : ''}${uiTitle ? `Scenario: "${uiTitle}"\n` : ''}${dialogue ? `Dialogue context:\n"${dialogue}"\n` : ''}

 The scenario MUST describe a Brazilian visiting a ${language === 'fr' ? 'French' : 'English'}-speaking country who URGENTLY needs to accomplish something — high-stakes and practical. Write EVERYTHING in the second person ("Você") so the student feels like the protagonist.

- The scenario MUST match the Theme "${theme}" and the Scenario title "${uiTitle}" strictly.
- objectives MUST be things the STUDENT (Você) has to do, written as imperative actions in PT-BR.
- keyPhrases MUST be phrases the STUDENT will actually SAY (or need to say) — written in ${LANG_LABEL[language]}. Not what locals say to them.
 Examples of good scenarios:
- "Você acabou de chegar em Paris e precisa fazer o check-in no hotel, mas o recepcionista não fala português. É sua primeira vez falando francês de verdade!"
- "Você está com fome no centro de Londres e só tem 20 minutos antes do próximo metrô. Precisa pedir comida num café movimentado."

Output ONLY this JSON:
{
  "scenario": "1-2 sentence vivid scene-setter in PT-BR, written to 'Você'. Brazilian visiting a ${language === 'fr' ? 'French' : 'English'}-speaking country with an urgent real-world need.",
  "timePressure": "short PT-BR urgency label — 2 to 5 words max (e.g., 'Antes do trem sair', 'Só 10 minutos', 'Urgente', 'Sem conexão de internet', 'Chuva caindo'). Must feel like a concrete constraint.",
  "stakes": "1 short PT-BR sentence (max 14 words) describing what happens if Você falha — concrete and specific (ex: 'Você perde a reserva e dorme na rua', 'Você fica sem almoço antes do voo', 'Você perde o último metrô e volta a pé').",
  "objectives": [
    "Specific PT-BR objective 1 — imperative action Você must accomplish (ex: 'Confirmar a reserva no nome correto')",
    "Specific PT-BR objective 2",
    "Specific PT-BR objective 3"
  ],
  "keyPhrases": [
    "Critical phrase in ${LANG_LABEL[language]} Você will SAY — #1",
    "Critical phrase in ${LANG_LABEL[language]} Você will SAY — #2",
    "Critical phrase in ${LANG_LABEL[language]} Você will SAY — #3"
  ]
}

Rules:
- scenario, objectives, stakes, timePressure: PT-BR only
- keyPhrases: target language only (no Portuguese) — always from the STUDENT's mouth
- EXACTLY 3 objectives and 3 keyPhrases
- Objectives must be actionable ("Pedir um café sem leite", not "aprender sobre café")
- keyPhrases must match the lesson's grammar focus
- stakes must be a REAL consequence, never vague ("Você fica perdido", "Você perde o ingresso")`;

    return await callGeminiJSON<MissionBriefingResult>(prompt, systemPrompt, 1200, 0);
  } catch (err) {
    console.error('[generateMissionBriefing] Error:', err);
    return null;
  }
}
