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
 
 The scenario MUST describe a Brazilian visiting a ${language === 'fr' ? 'French' : 'English'}-speaking country who URGENTLY needs to accomplish something — high-stakes and practical.
 
- The scenario MUST match the Theme "${theme}" and the Scenario title "${uiTitle}" strictly.
 Examples of good scenarios:
- "Você acabou de chegar em Paris e precisa fazer o check-in no hotel, mas o recepcionista não fala português. É sua primeira vez falando francês de verdade!"
- "Você está com fome no centro de Londres e só tem 20 minutos antes do próximo metrô. Precisa pedir comida num café movimentado."

Output ONLY this JSON:
{
  "scenario": "1-2 sentence vivid scene-setter in PT-BR. Brazilian visiting a ${language === 'fr' ? 'French' : 'English'}-speaking country with an urgent real-world need.",
  "objectives": [
    "Specific PT-BR objective 1 — what the student must accomplish",
    "Specific PT-BR objective 2",
    "Specific PT-BR objective 3"
  ],
  "keyPhrases": [
    "Critical phrase in ${LANG_LABEL[language]} #1",
    "Critical phrase in ${LANG_LABEL[language]} #2",
    "Critical phrase in ${LANG_LABEL[language]} #3"
  ]
}

Rules:
- scenario, objectives: PT-BR only
- keyPhrases: target language only (no Portuguese)
- EXACTLY 3 objectives and 3 keyPhrases
- Objectives must be actionable ("Pedir um café sem leite", not "aprender sobre café")
- keyPhrases must match the lesson's grammar focus`;

    return await callGeminiJSON<MissionBriefingResult>(prompt, systemPrompt, 1000, 0);
  } catch (err) {
    console.error('[generateMissionBriefing] Error:', err);
    return null;
  }
}
