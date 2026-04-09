'use server';

import { callGeminiJSON } from '@/services/gemini';
import type { SupportedLanguage, GrammarBridgeResult } from '@/types';

const LANG_LABEL: Record<SupportedLanguage, string> = {
  fr: 'French',
  en: 'English',
};

interface GenerateGrammarBridgeParams {
  dialogue: string;
  grammarFocus: string;
  language: SupportedLanguage;
}

/**
 * Generates a Grammar Bridge explanation using the Portuguese Bridge Method (Prompt #2).
 * Output maps directly to GrammarBridgeCard props.
 * Returns null on any error.
 */
export async function generateGrammarBridge(
  params: GenerateGrammarBridgeParams,
): Promise<GrammarBridgeResult | null> {
  const { dialogue, grammarFocus, language } = params;

  try {
    const systemPrompt = `You are an expert language teacher using the Portuguese Bridge Method for Brazilian Portuguese speakers learning ${LANG_LABEL[language]}. Respond with ONLY valid JSON, no markdown, no explanation.`;

    const prompt = `Explique o padrão gramatical "${grammarFocus}" para um brasileiro aprendendo ${LANG_LABEL[language]}.

Contexto do diálogo:
"${dialogue}"

Você está falando com um falante nativo de português brasileiro. Use isso a seu favor: compare diretamente com o português, aponte os erros clássicos que brasileiros cometem e explique POR QUÊ a estrutura funciona diferente.

Output ONLY este JSON (sem markdown):
{
  "insight": "1 frase de impacto em PT-BR — a sacada central da regra. Comece com 'Em português...' ou 'Ao contrário do português...' ou similar. MAX 20 words.",
  "explanation": "2-4 frases em PT-BR. Explique: (1) como a estrutura funciona, (2) por que brasileiros costumam errar e (3) qualquer nuance importante. SE o tema tiver múltiplos tópicos/conceitos distintos (ex: Qui, Que, Combien), use um ARRAY de strings, uma para cada conceito.",
  "usageContext": "Descreva em 1-2 palavras a 'vibe' social (ex: 'Casual/Amigos', 'Polidez/Formal', 'Dia-a-dia').",
  "brazilianTrap": "Explique o 'Erro de Brasileiro' clássico aqui em 1 frase curta e direta.",
  "patterns": [
    { "label": "Eu falo", "target": "I speak", "portuguese": "Eu falo" },
    { "label": "Ela fala", "target": "She speaks", "portuguese": "Ela fala" }
  ],
  "bridge": {
    "portuguese": "Use ^^ para destacar a parte da frase que gera a regra em PT-BR. ex: 'Eu ^^falo^^'",
    "target": "Use ^^ para destacar a parte equivalente. ex: 'I ^^speak^^'",
    "difference": "1 frase em PT-BR apontando a diferença estrutural chave. MAX 15 words."
  },
  "items": [
    { "target": "Expressão 1", "portuguese": "Tradução PT-BR", "logic": "A pequena 'sacada' por trás deste item específico (OPCIONAL)" }
  ],
  "dialogueExample": {
    "target": "Frase do diálogo acima que melhor ilustra '${grammarFocus}' — VERBATIM, não inventada",
    "portuguese": "Tradução natural PT-BR dessa frase"
  },
  "additionalExamples": [
    { "target": "Exemplo 2", "portuguese": "Equivalente PT-BR" }
  ]
}

Regras Cruciais:
1. Se o tema for uma REGRA SISTÊMICA (ex: Plural, Passado), use o campo 'bridge' e preencha 'patterns' com 2-3 variações. Deixe 'items' como null.
2. Se o tema for uma LISTA de expressões, preencha o campo 'items'. Deixe 'bridge' e 'patterns' como null.
3. brazilianTrap: FOQUE no erro de interferência do Português. Seja direto: "Não esqueça de...", "Evite dizer...".
4. Destaque Visual: Use ^^ envolta das palavras-chave em bridge.target e bridge.portuguese para criar o mapeamento visual.
5. explanation: Tom de professor parceiro, direto ao ponto.
6. dialogueExample.target: DEVE ser uma linha real do diálogo acima.
7. additionalExamples: exatamente 1-2 itens extras.
8. Todo texto em PT-BR exceto as frases na língua-alvo.`;

    return await callGeminiJSON<GrammarBridgeResult>(prompt, systemPrompt, 1400);
  } catch (err) {
    console.error('[generateGrammarBridge] Error:', err);
    return null;
  }
}
