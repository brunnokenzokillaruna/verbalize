'use server';

import { callGeminiJSON } from '@/services/gemini';
import type { HookResult, LessonTag, ProficiencyLevel, SupportedLanguage } from '@/types';

const LANG_LABEL: Record<SupportedLanguage, string> = {
  fr: 'French',
  en: 'English',
};

export interface EnrichHookMetadataParams {
  dialogue: string;
  language: SupportedLanguage;
  tag: LessonTag;
  level: ProficiencyLevel;
}

type EnrichmentPayload = Pick<HookResult, 'dialogueVerbs' | 'newChunks' | 'rolePlayConsequences'>;

/**
 * Stage-1b: extracts verbs/chunks/consequences from an existing dialogue.
 * Runs in background while the user reads vocabulary or the hook.
 */
export async function enrichHookMetadata(
  params: EnrichHookMetadataParams,
): Promise<Partial<HookResult>> {
  const { dialogue, language, tag } = params;
  const lang = LANG_LABEL[language];

  const optionalFields: string[] = ['"dialogueVerbs": ["infinitive1", "infinitive2", ...]'];
  if (tag === 'EXPR' || tag === 'CULT') {
    optionalFields.push(
      '"newChunks": [{"phrase":"...","translation":"PT-BR","entryType":"expression"}]',
    );
  }
  if (tag === 'MISS') {
    optionalFields.push(
      '"rolePlayConsequences": [{"npcLineIndex":2,"alternateText":"...","alternateTranslation":"..."}]',
    );
  }

  const systemPrompt = `You analyze ${lang} dialogues for a language-learning app. Respond with ONLY valid JSON.`;

  const prompt = `Analyze this dialogue and extract metadata.

Dialogue:
${dialogue}

Output ONLY this JSON:
{
  ${optionalFields.join(',\n  ')}
}

Rules:
- dialogueVerbs: every verb in infinitive form (lowercase)
- newChunks: only multi-word expressions actually in the dialogue (max 2)${tag === 'MISS' ? '\n- rolePlayConsequences: max 1 alternate NPC line if learner failed previous turn; npcLineIndex 0-based' : ''}`;

  try {
    const raw = await callGeminiJSON<EnrichmentPayload>(prompt, systemPrompt, 1024, 0, 'lightweight');
    const partial: Partial<HookResult> = {};

    if (raw.dialogueVerbs?.length) {
      partial.dialogueVerbs = [...new Set(
        raw.dialogueVerbs.map((v) => v.trim().toLowerCase()).filter(Boolean),
      )];
    }

    if (raw.newChunks?.length) {
      partial.newChunks = raw.newChunks
        .filter((c) => c.phrase?.trim() && c.translation?.trim())
        .map((c) => ({
          phrase: c.phrase.trim(),
          translation: c.translation.trim(),
          entryType: c.entryType ?? 'expression',
        }));
    }

    if (raw.rolePlayConsequences?.length) {
      const lines = dialogue.split('\n').filter((l) => l.trim());
      partial.rolePlayConsequences = raw.rolePlayConsequences
        .filter(
          (c) =>
            typeof c.npcLineIndex === 'number' &&
            c.npcLineIndex >= 0 &&
            c.npcLineIndex < lines.length &&
            c.alternateText?.trim(),
        )
        .map((c) => ({
          npcLineIndex: c.npcLineIndex,
          alternateText: c.alternateText.trim(),
          alternateTranslation: c.alternateTranslation?.trim(),
        }));
    }

    return partial;
  } catch (err) {
    console.error('[enrichHookMetadata] Error:', err);
    return {};
  }
}
