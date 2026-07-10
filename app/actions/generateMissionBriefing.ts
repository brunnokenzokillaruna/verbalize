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
 * Generates a mission briefing for MISS lessons — scenario, objectives, and key
 * phrases aligned with the hook dialogue that powers the role-play.
 */
export async function generateMissionBriefing(
  params: GenerateMissionBriefingParams,
): Promise<MissionBriefingResult | null> {
  const { grammarFocus, theme, uiTitle, language, dialogue } = params;

  try {
    const systemPrompt = `You write engaging mission briefings in Brazilian Portuguese for learners of ${LANG_LABEL[language]}. Respond with ONLY valid JSON, no markdown, no explanation.`;

    const dialogueAnchor = dialogue
      ? `PRIMARY SOURCE — the role-play dialogue the student will perform:
"${dialogue}"

The briefing MUST describe the EXACT same situation, setting, characters, and goals as this dialogue.
- scenario: summarize what is happening in the dialogue (who, where, why it matters).
- objectives: the 3 concrete things "Você" must accomplish in THIS dialogue (in order).
- keyPhrases: 3 phrases "Você" will actually say or need to say during THIS dialogue — in ${LANG_LABEL[language]}.
- Do NOT invent a different trip, hotel, café, or airport scenario if the dialogue is about something else (e.g. weekend, work, friends).
`
      : `No dialogue yet — derive the scenario strictly from Theme "${theme ?? ''}" and Scenario "${uiTitle ?? ''}".
Match the lesson focus ("${grammarFocus}") — e.g. weekend storytelling, ranking favorites, asking about Monday plans.
Do NOT default to generic travel/hotel/airport scenes unless the theme explicitly calls for travel.
`;

    const prompt = `Create a mission briefing for a Brazilian student learning ${LANG_LABEL[language]}.

Lesson focus: "${grammarFocus}"
${theme ? `Theme: "${theme}"\n` : ''}${uiTitle ? `Scenario title: "${uiTitle}"\n` : ''}
${dialogueAnchor}

Write EVERYTHING in the second person ("Você") so the student feels like the protagonist.
- objectives MUST be imperative actions in PT-BR that match what Você does in the dialogue.
- keyPhrases MUST be in ${LANG_LABEL[language]} — phrases Você will SAY, not what locals say.

Output ONLY this JSON:
{
  "scenario": "1-2 sentence vivid scene-setter in PT-BR, written to 'Você'. Must match the dialogue situation.",
  "timePressure": "short PT-BR urgency label — 2 to 5 words max (e.g., 'Antes da reunião começar', 'Só 10 minutos', 'Urgente').",
  "stakes": "1 short PT-BR sentence (max 14 words) describing what happens if Você falha — concrete and specific.",
  "objectives": [
    "Specific PT-BR objective 1 — imperative action Você must accomplish in the role-play",
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
- keyPhrases: target language only (no Portuguese)
- EXACTLY 3 objectives and 3 keyPhrases
- Objectives must be actionable and aligned with the dialogue turns
- keyPhrases must reflect the lesson grammar focus and the actual role-play`;

    return await callGeminiJSON<MissionBriefingResult>(prompt, systemPrompt, 1200, 0, 'standard');
  } catch (err) {
    console.error('[generateMissionBriefing] Error:', err);
    return null;
  }
}
