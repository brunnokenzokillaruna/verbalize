'use server';

import { callGeminiJSON } from '@/services/gemini';
import type { SupportedLanguage, GrammarBridgeResult, LessonTag } from '@/types';

const LANG_LABEL: Record<SupportedLanguage, string> = {
  fr: 'French',
  en: 'English',
};

interface GenerateGrammarBridgeParams {
  dialogue: string;
  grammarFocus: string;
  language: SupportedLanguage;
  tag?: LessonTag;
}

/**
 * Generates a Grammar Bridge explanation using the Portuguese Bridge Method (Prompt #2).
 * Output maps directly to GrammarBridgeCard props.
 * Returns null on any error.
 */
export async function generateGrammarBridge(
  params: GenerateGrammarBridgeParams,
): Promise<GrammarBridgeResult | null> {
  const { dialogue, grammarFocus, language, tag } = params;

  try {
    const systemPrompt = `You are an expert language teacher using the Portuguese Bridge Method for Brazilian Portuguese speakers learning ${LANG_LABEL[language]}. Respond with ONLY valid JSON, no markdown, no explanation.`;

    const isVerbLesson = tag === 'VERB';

    const verbSpotlightBlock = isVerbLesson
      ? `,
  "verbSpotlight": {
    "infinitive": "o verbo-alvo em infinitivo (ex: 'être', 'avoir', 'to be'). DEVE ser extraído de '${grammarFocus}'.",
    "meaning": "significado em PT-BR, curto. ex: 'ser / estar', 'ter / haver'. MAX 6 palavras.",
    "personality": "1 frase em PT-BR SIMPLES descrevendo o 'jeito' do verbo — quando usar, que sensação passa, por que brasileiros confundem. MAX 15 palavras. Tom de amigo. Sem jargão.",
    "frequencyNote": "1 frase curtinha sobre a importância/frequência dele. ex: 'É o verbo mais usado do francês' ou 'Aparece em quase toda conversa'. MAX 12 palavras.",
    "idiomaticExpressions": [
      { "target": "1 expressão FIXA real na língua-alvo usando esse verbo (ex: 'être en train de', 'avoir faim')", "portuguese": "tradução natural em PT-BR" },
      { "target": "outra expressão comum", "portuguese": "tradução" }
    ],
    "conjugationPreview": [
      { "pronoun": "je / I", "form": "conjugação presente — pronome nativo + forma do verbo" },
      { "pronoun": "tu / you", "form": "..." },
      { "pronoun": "il/elle / he/she", "form": "..." },
      { "pronoun": "nous / we", "form": "..." },
      { "pronoun": "vous / you (pl.)", "form": "..." },
      { "pronoun": "ils/elles / they", "form": "..." }
    ]
  }`
      : '';

    const verbRulesBlock = isVerbLesson
      ? `
REGRAS EXTRA PARA LIÇÃO DE VERBO:
- verbSpotlight.infinitive: use o pronome/marcador correto da língua (ex: em FR é 'être', não 'to be'; em EN é 'to be').
- verbSpotlight.conjugationPreview: forneça as 6 formas do PRESENTE na língua-alvo. Para francês use 'je, tu, il, nous, vous, ils' (forma curta). Para inglês use 'I, you, he/she, we, you, they'.
- verbSpotlight.idiomaticExpressions: FORNEÇA 1-2 expressões fixas reais, não invente. Se não houver expressão canônica com esse verbo, deixe como array vazio [].
- verbSpotlight.personality e frequencyNote: linguagem SIMPLES, frases curtas, como amigo explicando.`
      : '';

    const prompt = `Explique o padrão gramatical "${grammarFocus}" para um brasileiro aprendendo ${LANG_LABEL[language]}.

Contexto do diálogo:
"${dialogue}"

Você está falando com um falante nativo de português brasileiro. Use isso a seu favor: compare diretamente com o português, aponte os erros clássicos que brasileiros cometem e explique POR QUÊ a estrutura funciona diferente.

⚠️ LINGUAGEM ACESSÍVEL — REGRA CRÍTICA ⚠️
O público inclui brasileiros com baixa escolaridade. Escreva como se estivesse explicando para um amigo que nunca estudou gramática, não como livro didático.

PALAVRAS E EXPRESSÕES PROIBIDAS (substitua por alternativas simples):
- "estados permanentes e temporários" → "coisas que são pra sempre e coisas passageiras" (ou melhor: dê exemplos concretos como "ser brasileiro" vs "estar cansado")
- "unificar", "unificando", "unifica os conceitos" → "junta os dois", "serve para os dois casos"
- "eliminar a distinção", "elimina a distinção" → "não separa", "não faz diferença entre"
- "equivalente direto" → "é igual a", "faz o papel de", "funciona como"
- "estrutura", "estrutura é simples" → "jeito de montar a frase", "a ordem é"
- "o contexto exige" → "quando você quer dizer", "na hora de falar de"
- "verbos auxiliares extras", "auxiliares" → "outros verbos juntos", "verbo a mais"
- "interferência do português" → "a gente tenta fazer igual ao português"
- "nuance", "distinção sutil" → "diferença pequena", "detalhe"
- "conceito", "conceitos" → "ideia", "jeito"
- "implica", "remete a", "denota" → "quer dizer", "significa"
- "portanto", "por conseguinte", "dessa forma" → "então", "aí", "por isso"
- "adjetivo", "localização", "advérbio" → dê exemplo em vez do termo técnico ("uma palavra tipo 'grande' ou 'perto'")
- "conjugado", "flexionado" → "do jeito certo pra cada pessoa (eu, você, ele...)"

ESTILO OBRIGATÓRIO:
- Frases curtas: máximo 15 palavras cada.
- Palavras simples: se tem uma palavra de 4 sílabas quando uma de 2 serve, troque.
- Exemplos concretos > descrições abstratas. Sempre que possível, mostre uma frase em vez de descrever uma regra.
- Tom de amigo, não de professor formal. Pode usar "você", "a gente", "tipo", "né", "sacou".
- Nada de voz passiva complicada. Prefira "você usa X" em vez de "X é usado".

EXEMPLO RUIM (NÃO escreva assim):
"O verbo 'être' é o equivalente direto de ser e estar, eliminando a distinção que fazemos entre estados permanentes e temporários. A estrutura é simples: Sujeito + être conjugado + adjetivo ou localização, sem precisar de verbos auxiliares extras."

EXEMPLO BOM (escreva assim):
"Em francês, 'être' serve pros dois verbos do português: ser e estar. 'Eu sou brasileiro' e 'eu estou cansado' usam o mesmo verbo lá. É só montar assim: quem + 'être' + o resto (ex: 'je suis fatigué' = eu estou cansado)."

Output ONLY este JSON (sem markdown):
{
  "insight": "1 frase de impacto em PT-BR SIMPLES — a sacada central da regra. Pode começar com 'Em português...', 'No francês...', 'A gente...' ou similar. MAX 20 palavras. Linguagem de conversa, não de livro.",
  "explanation": "2-4 frases em PT-BR SIMPLES. Explique: (1) como funciona na prática (com exemplo concreto), (2) por que brasileiros erram e (3) detalhe importante — se houver. SE o tema tiver múltiplos tópicos distintos (ex: Qui, Que, Combien), use um ARRAY de strings, uma para cada. Cada frase MAX 15 palavras. Proibido usar as palavras da lista acima.",
  "usageContext": "Descreva em 1-2 palavras a 'vibe' social (ex: 'Casual/Amigos', 'Polidez/Formal', 'Dia-a-dia').",
  "brazilianTrap": "O 'Erro de Brasileiro' clássico em 1 frase curta e DIRETA, sem jargão. Ex: 'Não tente traduzir 'estar' separado — em francês é o mesmo verbo que 'ser'.'",
  "patterns": [
    { "label": "Eu falo", "target": "I speak", "portuguese": "Eu falo" },
    { "label": "Ela fala", "target": "She speaks", "portuguese": "Ela fala" }
  ],
  "bridge": {
    "portuguese": "Use ^^ para destacar a parte da frase que gera a regra em PT-BR. ex: 'Eu ^^falo^^'",
    "target": "Use ^^ para destacar a parte equivalente. ex: 'I ^^speak^^'",
    "difference": "1 frase SIMPLES em PT-BR apontando a diferença chave. MAX 15 palavras. Sem jargão."
  },
  "items": [
    { "target": "Expressão 1", "portuguese": "Tradução PT-BR", "logic": "A pequena sacada por trás deste item — linguagem simples, MAX 12 palavras (OPCIONAL)" }
  ],
  "dialogueExample": {
    "target": "Frase do diálogo acima que melhor ilustra '${grammarFocus}' — VERBATIM, não inventada",
    "portuguese": "Tradução natural PT-BR dessa frase"
  },
  "additionalExamples": [
    { "target": "Exemplo 2", "portuguese": "Equivalente PT-BR" }
  ]${verbSpotlightBlock}
}
${verbRulesBlock}

Regras Cruciais:
1. Se o tema for uma REGRA SISTÊMICA (ex: Plural, Passado), use o campo 'bridge' e preencha 'patterns' com 2-3 variações. Deixe 'items' como null.
2. Se o tema for uma LISTA de expressões, preencha o campo 'items'. Deixe 'bridge' e 'patterns' como null.
3. brazilianTrap: FOQUE no erro clássico. Linguagem direta e simples: "Não tente...", "Evite dizer...", "Não confunda...".
4. Destaque Visual: Use ^^ envolta das palavras-chave em bridge.target e bridge.portuguese para criar o mapeamento visual.
5. explanation: Tom de amigo explicando, não de livro. Frases curtas, palavras simples, exemplos concretos.
6. dialogueExample.target: DEVE ser uma linha real do diálogo acima.
7. additionalExamples: exatamente 1-2 itens extras.
8. Todo texto em PT-BR exceto as frases na língua-alvo.
9. ANTES DE RESPONDER: releia 'insight', 'explanation', 'brazilianTrap' e 'bridge.difference'. Se usou qualquer palavra da lista proibida OU se um brasileiro com ensino fundamental teria dificuldade, REESCREVA mais simples.`;

    return await callGeminiJSON<GrammarBridgeResult>(prompt, systemPrompt, 2000, 0);
  } catch (err) {
    console.error('[generateGrammarBridge] Error:', err);
    return null;
  }
}
