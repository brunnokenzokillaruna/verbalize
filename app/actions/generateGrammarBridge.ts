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
    const systemPrompt = `Você é um amigo brasileiro fera em ${LANG_LABEL[language]} explicando gramática de um jeito que qualquer pessoa entende, sem parecer robô ou professor formal.
Regras de Humanidade:
- ZERO "IA-ismos": nada de "Certamente", "Aqui está seu guia", "Entender a nuance é essencial".
- Use gírias leves e naturais (tipo, né, olha só, a gente).
- Seja curto e grosso: se dá pra explicar em 5 palavras, não use 10.
- Use emojis SPARINGLY para dar um toque humano (ex: 😉, 🚀).
Respond with ONLY valid JSON, no markdown, no explanation.`;

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
- verbSpotlight.idiomaticExpressions: FORNEÇA 1-2 expressões fixas reais, não invente. Se não houver expressão canônica com esse verbo, deixe como array vazio []. NUNCA misture palavras em português nos textos da língua-alvo (ex: "jouer avec le feu", NUNCA "jouer avec o feu").
- verbSpotlight.personality e frequencyNote: linguagem SIMPLES, frases curtas, como amigo explicando.`
      : '';

    const prompt = `Explique o padrão gramatical "${grammarFocus}" para um brasileiro aprendendo ${LANG_LABEL[language]}.

Contexto do diálogo:
"${dialogue}"

Você está falando com um falante nativo de português brasileiro. Use isso a seu favor: compare diretamente com o português, aponte os erros clássicos que brasileiros cometem e explique POR QUÊ a estrutura funciona diferente.

⚠️ MISSÃO CENTRAL: ENSINO INTUITIVO E PROFUNDO ⚠️
O objetivo aqui NÃO é ser curto por ser curto. O objetivo é que o aluno REALMENTE ENTENDA a regra.
Você DEVE:
- Explicar com calma, usando comparações diretas com o português ("No português a gente faz X, mas no ${LANG_LABEL[language]} faz Y porque...").
- Dar MÚLTIPLOS exemplos paralelos (PT-BR → ${LANG_LABEL[language]}) para que o aluno veja o padrão se repetindo.
- Usar analogias do dia a dia quando possível ("É como se...", "Pensa assim:").
- Incluir equivalências explícitas: para cada conceito, mostrar COMO se diz em português e COMO se diz na língua-alvo.
Mas NUNCA escreva como um livro acadêmico ou uma tese de doutorado. Escreva como um amigo paciente explicando.

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
  "insight": "1-2 frases de impacto em PT-BR SIMPLES — a sacada central da regra. Pode começar com 'Em português...', 'No francês...', 'A gente...' ou similar. Linguagem de conversa, não de livro.",
  "explanation": "CAMPO PRINCIPAL DE ENSINO. Escreva 3-6 frases (ou um array de strings se forem tópicos distintos) em PT-BR SIMPLES explicando a regra DE VERDADE. Inclua: (1) como funciona na prática com exemplo concreto lado a lado (PT → língua-alvo), (2) por que brasileiros erram (com o exemplo errado e o certo), (3) quando usar e quando NÃO usar, (4) uma analogia ou comparação direta com o português se possível. Não economize: o aluno precisa ENTENDER, não apenas memorizar. Mas escreva de forma intuitiva, como um amigo explicando na mesa do bar. Proibido usar as palavras da lista acima.",
  "survivalTip": "Dica de sobrevivência ultra rápida, prática e direta ao ponto que o aluno possa memorizar imediatamente na língua-alvo. Em PT-BR amigável. MAX 12 palavras.",
  "culturalNote": "Um detalhe, curiosidade cultural ou hábito social real de uso na língua-alvo (ex: se nativos usam de um jeito especial no dia a dia, nível de formalidade, etc.). Em PT-BR amigável. MAX 15 palavras.",
  "usageContext": "Descreva em 1-3 palavras a 'vibe' social (ex: 'Casual/Amigos', 'Polidez/Formal', 'Dia-a-dia').",
  "brazilianTrap": "O 'Erro de Brasileiro' — explique em 2-3 frases o erro mais comum que brasileiros cometem com essa estrutura. Mostre o que o brasileiro diria errado e como corrigir. Ex: 'A gente tenta traduzir direto do português e fala X, mas o certo é Y. Isso acontece porque no português a gente faz Z, mas na língua-alvo funciona diferente.'",
  "patterns": [
    { "label": "Eu falo", "target": "I speak", "portuguese": "Eu falo" },
    { "label": "Ela fala", "target": "She speaks", "portuguese": "Ela fala" },
    { "label": "Nós falamos", "target": "We speak", "portuguese": "Nós falamos" }
  ],
  "bridge": {
    "portuguese": "Use ^^ para destacar a parte da frase que gera a regra em PT-BR. ex: 'Eu ^^falo^^'",
    "target": "Use ^^ para destacar a parte equivalente. ex: 'I ^^speak^^'",
    "difference": "Explique a diferença chave em PT-BR. Sem jargão."
  },
  "items": [
    { "target": "Expressão 1", "portuguese": "Tradução PT-BR", "logic": "A pequena sacada por trás deste item — linguagem simples (OPCIONAL)" }
  ],
  "dialogueExample": {
    "target": "Frase do diálogo acima que melhor ilustra '${grammarFocus}' — VERBATIM, não inventada",
    "portuguese": "Tradução natural PT-BR dessa frase"
  },
  "additionalExamples": [
    { "target": "Exemplo extra 1", "portuguese": "Equivalente PT-BR" },
    { "target": "Exemplo extra 2", "portuguese": "Equivalente PT-BR" },
    { "target": "Exemplo extra 3", "portuguese": "Equivalente PT-BR" }
  ]${verbSpotlightBlock}
}
${verbRulesBlock}

Regras Cruciais:
1. Se o tema for uma REGRA SISTÊMICA (ex: Plural, Passado), use o campo 'bridge' e preencha 'patterns' com 2-3 variações. Deixe 'items' como null.
2. Se o tema for uma LISTA de expressões, preencha o campo 'items'. Deixe 'bridge' e 'patterns' como null.
3. brazilianTrap: FOQUE no erro clássico. Mostre o que o brasileiro tentaria dizer e a versão correta. Linguagem direta e amigável.
4. Destaque Visual: Use ^^ envolta das palavras-chave em bridge.target e bridge.portuguese para criar o mapeamento visual.
5. explanation: Este é o CORAÇÃO da lição. O aluno vai ler isso com calma. Explique de verdade, com comparações e exemplos paralelos. Tom de amigo, não de livro.
6. dialogueExample.target: DEVE ser uma linha real do diálogo acima.
7. additionalExamples: 2-3 exemplos extras mostrando o padrão em diferentes contextos do dia a dia.
8. Todo texto em PT-BR exceto as frases na língua-alvo.
9. ANTES DE RESPONDER: releia 'insight', 'explanation', 'brazilianTrap' e 'bridge.difference'. Se usou qualquer palavra da lista proibida OU se um brasileiro com ensino fundamental teria dificuldade, REESCREVA mais simples.
10. IDIOMA 100% PURO NA LÍNGUA-ALVO: Nos campos destinados à língua-alvo (como target, additionalExamples.target, verbSpotlight.idiomaticExpressions.target), NUNCA misture palavras do português (como "o", "a", "com"). Por exemplo, em francês escreva "jouer avec le feu", NUNCA "jouer avec o feu" ou "jouer avec com feu". O texto na língua-alvo deve ser 100% puro e gramaticalmente correto no idioma em questão.`;

    return await callGeminiJSON<GrammarBridgeResult>(prompt, systemPrompt, 3500);
  } catch (err) {
    console.error('[generateGrammarBridge] Error:', err);
    return null;
  }
}
