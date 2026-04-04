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
  "insight": "1 frase de impacto em PT-BR — a sacada central da regra. Comece com 'Em português...' ou 'Ao contrário do português...' ou similar. MAX 20 palavras.",
  "explanation": "2-4 frases em PT-BR explicando a regra com profundidade. Cubra: (1) como a estrutura funciona na língua-alvo, (2) por que difere do português e qual o erro típico de brasileiro, (3) qualquer nuance ou exceção importante. Tom de professor parceiro, não de livro didático.",
  "bridge": {
    "portuguese": "A frase-núcleo como um brasileiro diria naturalmente em PT-BR",
    "target": "O equivalente correto em ${LANG_LABEL[language]}",
    "difference": "1 frase em PT-BR apontando a diferença estrutural chave. MAX 15 palavras."
  },
  "dialogueExample": {
    "target": "Frase do diálogo acima que melhor ilustra '${grammarFocus}' — VERBATIM, não inventada",
    "portuguese": "Tradução natural PT-BR dessa frase"
  },
  "additionalExamples": [
    { "target": "Exemplo 2 em ${LANG_LABEL[language]} com contexto diferente do diálogo", "portuguese": "Equivalente PT-BR" },
    { "target": "Exemplo 3 em ${LANG_LABEL[language]} — preferencialmente um erro comum de brasileiro corrigido", "portuguese": "Como o brasileiro tentaria dizer (errado ou literal)" }
  ]
}

Regras:
- insight: 1 frase, max 20 palavras, em PT-BR
- explanation: 2-4 frases, sem jargão acadêmico, focado em brasileiros
- bridge.difference: exatamente 1 frase, max 15 palavras, em PT-BR
- dialogueExample.target: DEVE ser uma linha real do diálogo acima
- additionalExamples: exatamente 2 itens
- Todo texto em PT-BR exceto as frases na língua-alvo`;

    return await callGeminiJSON<GrammarBridgeResult>(prompt, systemPrompt, 1400);
  } catch (err) {
    console.error('[generateGrammarBridge] Error:', err);
    return null;
  }
}
