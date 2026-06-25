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
    case 'bridge-choice':
    case 'grammar-trap': {
      const explanation =
        exercise.type === 'bridge-choice'
          ? exercise.data.explanation
          : exercise.data.explanation;
      return explanation?.slice(0, 200) ?? null;
    }
    case 'word-bank-translation': {
      const { portuguese_sentence, correctOrder } = exercise.data;
      prompt = `Um aluno errou ao montar a tradução em ${lang}.
Frase em português: "${portuguese_sentence}"
Ordem correta: "${correctOrder.join(' ')}"
Explique em 1-2 frases a ordem natural das palavras.
${accessibilityRule}`;
      break;
    }
    case 'listen-and-select': {
      const { audioText, translation } = exercise.data;
      prompt = `Um aluno errou ao identificar o que ouviu em ${lang}.
Frase correta: "${audioText}"
Tradução: "${translation}"
Dê uma dica rápida de escuta.
${accessibilityRule}`;
      break;
    }
    case 'listen-and-respond': {
      const { contextPt, promptLine, exampleResponse, evaluationCriteria } = exercise.data;
      prompt = `Um aluno errou ao responder oralmente em ${lang} num diálogo.
Situação: "${contextPt}"
Pergunta ouvida: "${promptLine}"
Exemplo de resposta adequada: "${exampleResponse}"
Critério: "${evaluationCriteria}"
Explique em 1-2 frases o que uma boa resposta deveria comunicar nesta situação.
${accessibilityRule}`;
      break;
    }
    case 'free-roleplay': {
      return exercise.data.explanation?.slice(0, 220) ?? `Resposta modelo: ${exercise.data.exampleResponse}`;
    }
    case 'micro-message': {
      const { context, incomingMessage, exampleResponse, evaluationCriteria } = exercise.data;
      prompt = `Um aluno errou ao responder uma mensagem informal em ${lang}.
Contexto: "${context}"
Mensagem recebida: "${incomingMessage}"
Resposta modelo: "${exampleResponse}"
Critério: "${evaluationCriteria}"
Explique em 1-2 frases como responder de forma natural e informal.
${accessibilityRule}`;
      break;
    }
    case 'paraphrase': {
      const { source_sentence, source_translation, target_paraphrase } = exercise.data;
      prompt = `Um aluno errou ao parafrasear uma frase em ${lang}.
Frase original: "${source_sentence}"
Significado: "${source_translation}"
Paráfrase modelo: "${target_paraphrase}"
Explique em 1-2 frases como dizer a mesma coisa com palavras diferentes.
${accessibilityRule}`;
      break;
    }
    case 'fill-gap-production': {
      const { sentence, blankWord, translation } = exercise.data;
      prompt = `Um aluno errou ao completar uma lacuna em ${lang}.
Frase: "${sentence}"
Tradução: "${translation}"
Palavra correta: "${blankWord}"
Explique em 1-2 frases por que "${blankWord}" completa a frase.
${accessibilityRule}`;
      break;
    }
    case 'minimal-pair-production': {
      const { sentenceContext, correctWord, wordA, wordB, tip } = exercise.data;
      const wrongWord = correctWord === wordA ? wordB : wordA;
      prompt = `Um aluno errou ao falar a palavra correta em um par mínimo em ${lang}.
Contexto: "${sentenceContext}"
Palavra correta: "${correctWord}" (não "${wrongWord}")
Dica: "${tip}"
Explique em 1-2 frases como distinguir os dois sons na fala.
${accessibilityRule}`;
      break;
    }
    case 'shadowing': {
      const { text, translation, tip } = exercise.data;
      prompt = `Um aluno errou um exercício de shadowing em ${lang}.
Frase: "${text}"
Tradução: "${translation}"
${tip ? `Dica de ritmo: "${tip}"` : ''}
Explique em 1-2 frases como acompanhar o ritmo e a entonação nativa.
${accessibilityRule}`;
      break;
    }
    case 'translation-with-constraint': {
      const { portuguese_sentence, required_chunk, target_translation, constraint_explanation } = exercise.data;
      prompt = `Um aluno errou ao traduzir com restrição em ${lang}.
Frase PT: "${portuguese_sentence}"
Deve incluir: "${required_chunk}"
Tradução modelo: "${target_translation}"
${constraint_explanation ? `Explicação: "${constraint_explanation}"` : ''}
Explique em 1-2 frases por que "${required_chunk}" é necessário nesta tradução.
${accessibilityRule}`;
      break;
    }
    case 'voicemail-dictation': {
      const { audioText, contextPt, expected_summary } = exercise.data;
      prompt = `Um aluno errou ao resumir um correio de voz em ${lang}.
Contexto: "${contextPt}"
Mensagem ouvida: "${audioText}"
Resumo esperado: "${expected_summary}"
Explique em 1-2 frases quais informações principais deveriam aparecer no resumo.
${accessibilityRule}`;
      break;
    }
    case 'inference-tone': {
      const { questionPt, targetTonePt, audioTextA, audioTextB, labelA, labelB, correctOption, explanationPt } = exercise.data;
      prompt = `Um aluno errou ao identificar o tom de uma fala em ${lang}.
Pergunta: "${questionPt}"
Tom alvo: "${targetTonePt}"
Áudio A (${labelA}): "${audioTextA}"
Áudio B (${labelB}): "${audioTextB}"
Resposta correta: ${correctOption}
Explique em 1-2 frases: ${explanationPt}
${accessibilityRule}`;
      break;
    }
    case 'connected-speech': {
      const { phenomenonPt, segmentedForm, linkedForm, expected_transcription, explanationPt } = exercise.data;
      prompt = `Um aluno errou ao transcrever uma frase com fala conectada em ${lang}.
Fenômeno: "${phenomenonPt}"
Forma segmentada: "${segmentedForm}"
Como soa ligado: "${linkedForm}"
Transcrição esperada: "${expected_transcription}"
Explique em 1-2 frases: ${explanationPt}
${accessibilityRule}`;
      break;
    }
    case 'story-continuation': {
      const { storyOpening, promptPt, exampleContinuation, evaluationCriteria, explanationPt } = exercise.data;
      prompt = `Um aluno errou ao continuar uma micro-história em ${lang}.
Início: "${storyOpening}"
Tarefa: "${promptPt}"
Continuação modelo: "${exampleContinuation}"
Critério: "${evaluationCriteria}"
Explique em 1-2 frases: ${explanationPt}
${accessibilityRule}`;
      break;
    }
    case 'spot-the-register': {
      const { context, dialogueLines, wrongLineIndex, registerIssuePt, correctedLine, explanationPt } = exercise.data;
      const wrongLine = dialogueLines[wrongLineIndex] ?? '';
      prompt = `Um aluno errou ao corrigir o registro de uma fala em ${lang}.
Contexto: "${context}"
Diálogo: ${dialogueLines.map((l, i) => `${i + 1}. "${l}"`).join(' ')}
Fala problemática: "${wrongLine}"
Problema: "${registerIssuePt}"
Correção modelo: "${correctedLine}"
Explique em 1-2 frases: ${explanationPt}
${accessibilityRule}`;
      break;
    }
    case 'prompted-monologue': {
      const { promptPt, exampleMonologue, evaluationCriteria, explanationPt } = exercise.data;
      prompt = `Um aluno errou um mini-monólogo em ${lang}.
Tema: "${promptPt}"
Monólogo modelo: "${exampleMonologue}"
Critério: "${evaluationCriteria}"
Explique em 1-2 frases: ${explanationPt}
${accessibilityRule}`;
      break;
    }
    case 'image-match': {
      return `A imagem certa era a de «${exercise.data.targetWord}» (${exercise.data.translation}).`;
    }
    default:
      return null;
  }

  try {
    const result = await callGemini(prompt, undefined, 120, undefined, 'lightweight');
    return result?.trim() ?? null;
  } catch {
    return null;
  }
}
