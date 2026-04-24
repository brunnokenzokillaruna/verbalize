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

  const accessibilityRule = `
LINGUAGEM: Escreva como se fosse um amigo explicando, NÃO como livro didático. O público inclui brasileiros com baixa escolaridade.
- Frases curtas, palavras simples. Pode usar "você", "a gente", "tipo".
- PROIBIDO usar jargão: "lexical", "semântico", "conjugação", "flexão", "locução", "substantivo/adjetivo/advérbio", "ortográfico", "estrutura sintática", "nuance", "distinção".
- Prefira mostrar um exemplo ou dar a dica direta em vez de nomear a regra gramatical.`;

  switch (exercise.type) {
    case 'context-choice': {
      const { sentence, blankWord, translation } = exercise.data;
      prompt = `Um aluno errou um exercício de vocabulário em ${lang}.
Frase: "${sentence}"
Tradução: "${translation}"
Resposta correta: "${blankWord}"
Explique em 1-2 frases simples por que "${blankWord}" é a palavra certa aqui.
${accessibilityRule}`;
      break;
    }
    case 'reverse-translation': {
      const { portuguese_sentence, target_translation } = exercise.data;
      prompt = `Um aluno errou uma tradução do português para o ${lang}.
Frase em português: "${portuguese_sentence}"
Tradução correta: "${target_translation}"
Explique em 1-2 frases simples por que essa é a forma certa de dizer em ${lang}.
${accessibilityRule}`;
      break;
    }
    case 'audio-dictation': {
      const { text } = exercise.data;
      prompt = `Um aluno errou um ditado em ${lang}.
Frase correta: "${text}"
Dê em 1-2 frases simples uma dica de atenção (escrita ou pronúncia) nessa frase.
${accessibilityRule}`;
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
