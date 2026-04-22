'use server';

import { callGemini } from '@/services/gemini';
import type { Exercise, SupportedLanguage } from '@/types';

const LANG_LABEL: Record<SupportedLanguage, string> = {
  fr: 'francês',
  en: 'inglês',
};

/**
 * Generates a short explanation (1-2 sentences in Brazilian Portuguese) of
 * why the correct answer is correct, to be shown after a wrong answer.
 * Returns null on error or for exercise types that don't need AI explanation.
 */
export async function explainWrongAnswer(
  exercise: Exercise,
  language: SupportedLanguage,
): Promise<string | null> {
  const lang = LANG_LABEL[language];
  let prompt = '';

  switch (exercise.type) {
    case 'context-choice': {
      const { sentence, blankWord, translation } = exercise.data;
      prompt = `Um aluno errou um exercício de vocabulário em ${lang}.
Frase: "${sentence}"
Tradução: "${translation}"
Resposta correta: "${blankWord}"
Explique em 1-2 frases diretas em português por que "${blankWord}" é a palavra correta neste contexto.`;
      break;
    }
    case 'reverse-translation': {
      const { portuguese_sentence, target_translation } = exercise.data;
      prompt = `Um aluno errou uma tradução do português para o ${lang}.
Frase em português: "${portuguese_sentence}"
Tradução correta: "${target_translation}"
Explique em 1-2 frases em português o motivo gramatical ou lexical desta tradução estar correta.`;
      break;
    }
    case 'audio-dictation': {
      const { text } = exercise.data;
      prompt = `Um aluno errou um ditado em ${lang}.
Frase correta: "${text}"
Explique em 1-2 frases em português um ponto de atenção gramatical ou ortográfico importante nesta frase.`;
      break;
    }
    default:
      return null;
  }

  try {
    const result = await callGemini(prompt, undefined, 120);
    return result?.trim() ?? null;
  } catch {
    return null;
  }
}
