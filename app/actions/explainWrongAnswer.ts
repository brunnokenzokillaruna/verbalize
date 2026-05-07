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
LINGUAGEM HUMANA: Escreva como se fosse um amigo dando um toque, com empatia, NÃO como um robô corrigindo.
- Comece de um jeito natural: "Essa é pegadinha!", "Quase lá!", "Dica de ouro:", "Olha só:", "O segredo aqui é:".
- PROIBIDO usar palavras de IA: "essencial", "crucial", "fundamental", "nuance", "distinção", "unificar".
- Frases curtas (máximo 12 palavras). Sem jargão técnico.
- Se o erro for comum, console o aluno: "Normal confundir, mas...", "Até eu errava essa no começo!"`;

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
