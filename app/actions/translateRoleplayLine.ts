'use server';

import { callGeminiJSON } from '@/services/gemini';
import { LANG_LABEL } from '@/lib/practiceExercises/constants';
import { NATURAL_PT_BR_RULE_COMPACT, normalizeToEverydayPtBr } from '@/lib/naturalPtBr';
import type { SupportedLanguage } from '@/types';

export interface TranslateRoleplayLineParams {
  text: string;
  language: SupportedLanguage;
}

export interface TranslateRoleplayLineResult {
  translationPt: string;
  error?: string;
}

const SYSTEM_PROMPT = `You translate foreign-language dialogue lines into natural Brazilian Portuguese (PT-BR) for language learners.

Rules:
- Return ONLY valid JSON: { "translationPt": string }
- Keep meaning, tone, and register (casual café chat stays casual).
- Be concise — one line matching the original length roughly.
- Do not add explanations, notes, or quotation marks around the whole sentence.
- ${NATURAL_PT_BR_RULE_COMPACT}`;

export async function translateRoleplayLine(
  params: TranslateRoleplayLineParams,
): Promise<TranslateRoleplayLineResult> {
  const text = params.text.trim();
  if (!text || text === '…' || text.startsWith('(')) {
    return { translationPt: '' };
  }

  try {
    const lang = LANG_LABEL[params.language];
    const result = await callGeminiJSON<{ translationPt: string }>(
      `Source language: ${lang}\nLine to translate to Brazilian Portuguese:\n"${text}"`,
      SYSTEM_PROMPT,
      256,
      0,
      'lightweight',
    );

    const translationPt = result.translationPt?.trim() ?? '';
    if (!translationPt) {
      return { translationPt: '', error: 'EMPTY' };
    }

    return { translationPt: normalizeToEverydayPtBr(translationPt) };
  } catch (err) {
    console.warn('[translateRoleplayLine] failed:', err);
    return { translationPt: '', error: 'TRANSLATE_FAILED' };
  }
}
