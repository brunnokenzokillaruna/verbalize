'use server';

import { callGeminiJSON } from '@/services/gemini';
import { normalizeGrammarBridgeResult } from '@/lib/schemas/grammarBridge';
import type { SupportedLanguage, GrammarBridgeResult, LessonTag } from '@/types';

function buildTagBridgeGuidance(tag: LessonTag | undefined): string {
  switch (tag) {
    case 'GRAM':
      return 'PRIORIDADE: bridge + patterns (2-3) + brazilianTrap. structureFormulas se houver 2 construções alternativas.';
    case 'VERB':
      return 'PRIORIDADE: verbSpotlight completo + patterns (1-2 exemplos de uso do verbo) + brazilianTrap. NÃO omita patterns.';
    case 'EXPR':
    case 'VOC':
      return 'PRIORIDADE: items (lista de expressões) + dialogueExample + additionalExamples. bridge/patterns podem ser null.';
    case 'DIAL':
    case 'CULT':
      return 'PRIORIDADE: usageContext + culturalNote + additionalExamples + dialogueExample.';
    default:
      return 'Use bridge + patterns para regras sistêmicas, ou items para listas de expressões.';
  }
}

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
 * Output maps directly to GrammarBridgeFlow step builder.
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
    "conjugationPreview": ${
      language === 'fr'
        ? `[
      { "pronoun": "je", "form": "conjugação presente — ex: 'je donne'" },
      { "pronoun": "tu", "form": "ex: 'tu donnes'" },
      { "pronoun": "il", "form": "ex: 'il donne'" },
      { "pronoun": "elle", "form": "ex: 'elle donne'" },
      { "pronoun": "on", "form": "ex: 'on donne'" },
      { "pronoun": "nous", "form": "ex: 'nous donnons'" },
      { "pronoun": "vous", "form": "ex: 'vous donnez'" },
      { "pronoun": "ils", "form": "ex: 'ils donnent'" },
      { "pronoun": "elles", "form": "ex: 'elles donnent'" }
    ]`
        : `[
      { "pronoun": "I", "form": "present conjugation — ex: 'I give'" },
      { "pronoun": "you", "form": "ex: 'you give'" },
      { "pronoun": "he", "form": "ex: 'he gives'" },
      { "pronoun": "she", "form": "ex: 'she gives'" },
      { "pronoun": "it", "form": "ex: 'it gives'" },
      { "pronoun": "we", "form": "ex: 'we give'" },
      { "pronoun": "they", "form": "ex: 'they give'" }
    ]`
    }
  }`
      : '';

    const verbRulesBlock = isVerbLesson
      ? `
REGRAS EXTRA PARA LIÇÃO DE VERBO:
- verbSpotlight.infinitive: use o pronome/marcador correto da língua (ex: em FR é 'être', não 'to be'; em EN é 'to be').
- verbSpotlight.conjugationPreview: forneça as formas do PRESENTE na língua-alvo. ${
          language === 'fr'
            ? "Para francês use separadamente exatamente: 'je, tu, il, elle, on, nous, vous, ils, elles'."
            : "Para inglês use separadamente exatamente: 'I, you, he, she, it, we, they'."
        }
- verbSpotlight.idiomaticExpressions: FORNEÇA 1-2 expressões fixas reais, não invente. Se não houver expressão canônica com esse verbo, deixe como array vazio []. NUNCA misture palavras em português nos textos da língua-alvo (ex: "jouer avec le feu", NUNCA "jouer avec o feu").
- verbSpotlight.personality e frequencyNote: linguagem SIMPLES, frases curtas, como amigo explicando.`
      : '';

    const tagGuidance = buildTagBridgeGuidance(tag);

    const prompt = `Explique o padrão gramatical "${grammarFocus}" para um brasileiro aprendendo ${LANG_LABEL[language]}.

Contexto do diálogo:
"${dialogue}"

ORIENTAÇÃO POR TIPO DE LIÇÃO (tag: ${tag ?? 'GRAM'}):
${tagGuidance}

Você está falando com um falante nativo de português brasileiro. Use isso a seu favor: compare diretamente com o português, aponte os erros clássicos que brasileiros cometem e explique POR QUÊ a estrutura funciona diferente.

⚠️ CAMPO bridge — FRASES EXEMPLO, NUNCA META-EXPLICAÇÃO ⚠️
bridge.portuguese e bridge.target são EXCLUSIVAMENTE um par de frases exemplo paralelas (PT-BR ↔ ${LANG_LABEL[language]}).
A explicação comparativa vai em insight, bridge.difference e explanation — NUNCA dentro de bridge.portuguese ou bridge.target.

ERRADO (meta-explicação — rejeitado pelo app):
{ "portuguese": "No português, a gente omite o objeto. No francês, você substitui pelo 'en'.", "target": "Em português, a gente omite. Em francês, você insere o 'en' antes do verbo." }

CERTO (frases concretas ilustrando a regra):
{ "portuguese": "Eu ^^quero mais^^", "target": "J'^^en^^ veux plus", "difference": "O francês exige 'en' para retomar o objeto; o português permite omitir." }

Regras do bridge:
- portuguese: frase curta em PT-BR como alguém falaria (pode omitir objeto se a regra for omissão).
- target: tradução/equivalente 100% em ${LANG_LABEL[language]} — zero português neste campo.
- difference: única frase explicando a diferença estrutural entre as duas frases acima.

⚠️ FORMATO DE EXIBIÇÃO — JORNADA PEDAGÓGICA v2 ⚠️
Cada campo do JSON tem uma FUNÇÃO COGNITIVA distinta. NÃO repita a mesma sacada em campos diferentes.
- insight = modelo mental (1 frase impacto)
- bridge.difference = diferença estrutural do exemplo principal (1 frase)
- explanation = mecanismo/procedimento SOMENTE se insight+difference não cobrirem — omita ou use [] se redundante
- patterns = par contrastante quando possível (labels: "Afirmação" e "Negação", ou equivalente)
- dialogueExample = frase verbatim do diálogo acima
- additionalExamples = MÁXIMO 1 item, vocabulário DIFERENTE dos patterns, para generalização
- brazilianTrap = erro que brasileiro cometeria em conversa espontânea
- retentionCheck = pergunta de produção mental ("Como você diria X?") quando possível

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
  "explanation": [
    "Item 1 (MAX 15 palavras): como montar a frase na prática, com exemplo PT → língua-alvo.",
    "Item 2 (MAX 15 palavras): por que brasileiros erram nesse ponto."
  ],
  "survivalTip": "Dica de sobrevivência ultra rápida, prática e direta ao ponto que o aluno possa memorizar imediatamente. Em PT-BR amigável. MAX 12 palavras.",
  "culturalNote": "Um detalhe, curiosidade cultural ou hábito social real de uso na língua-alvo. Em PT-BR amigável. MAX 15 palavras.",
  "structureFormula": "fórmula única quando há só UMA construção. Use colchetes e '+' como separador. Deixe null se usar structureFormulas.",
  "formulaExample": { "target": "Frase real que instancia a fórmula única", "portuguese": "Tradução natural PT-BR" },
  "structureFormulas": [
    {
      "label": "Opção A (ex: necessidade geral)",
      "formula": "[il faut] + [verbo no infinitivo]",
      "example": { "target": "Il faut ranger.", "portuguese": "É preciso organizar." }
    },
    {
      "label": "Opção B (ex: obrigação pessoal)",
      "formula": "[Sujeito] + [devoir conjugado] + [verbo no infinitivo]",
      "example": { "target": "Je dois ranger.", "portuguese": "Eu preciso organizar." }
    }
  ],
  "usageContext": "Descreva em 1-3 palavras a 'vibe' social (ex: 'Casual/Amigos', 'Polidez/Formal', 'Dia-a-dia').",
  "brazilianTrap": {
    "wrong": "frase errada que um brasileiro diria/pensaria ao traduzir direto",
    "right": "frase correta na língua-alvo",
    "wrongPortuguese": "tradução natural em PT-BR do que o brasileiro pensaria (ex: 'Eu espero por você.')",
    "rightPortuguese": "tradução natural em PT-BR da frase correta (ex: 'Eu te espero.')",
    "subtitle": "Subtítulo curto do erro (ex: 'Evite a tradução direta do português' ou 'Cuidado com a ordem das palavras')",
    "explanation": "explicação muito curta e direta de por que isso é um erro. MAX 2 frases curtas."
  },
  "retentionCheck": {
    "question": "Pergunta de 2 opções em PT-BR testando a sacada central (ex: 'Qual expressa obrigação pessoal?')",
    "options": ["opção errada plausível", "opção correta"],
    "correctIndex": 1
  },
  "patterns": [
    { "label": "Afirmação", "target": "I speak", "portuguese": "Eu falo" },
    { "label": "Negação", "target": "I do not speak", "portuguese": "Eu não falo" }
  ],
  "bridge": {
    "portuguese": "Use ^^ para destacar a parte da frase que gera a regra em PT-BR. ex: 'Eu ^^falo^^'",
    "target": "Use ^^ para destacar a parte equivalente. ex: 'I ^^speak^^'",
    "difference": "Explique a diferença estrutural de forma GERAL (não apenas para o gênero/exemplo atual). Sem jargão. MAX 15 palavras."
  },
  "items": [
    { "target": "Expressão 1", "portuguese": "Tradução PT-BR", "logic": "A pequena sacada por trás deste item — linguagem simples (OPCIONAL)" }
  ],
  "dialogueExample": {
    "target": "Frase do diálogo acima que melhor ilustra '${grammarFocus}' — VERBATIM, não inventada",
    "portuguese": "Tradução natural PT-BR dessa frase"
  },
  "additionalExamples": [
    { "target": "Exemplo extra com vocabulário diferente", "portuguese": "Equivalente PT-BR" }
  ]${verbSpotlightBlock}
}
${verbRulesBlock}

Regras Cruciais:
1. Se o tema for uma REGRA SISTÊMICA (ex: Plural, Passado), use o campo 'bridge' e preencha 'patterns' com no máximo 2 variações. Deixe 'items' como null.
2. Se o tema for uma LISTA de expressões, preencha o campo 'items' (máx. 3). Deixe 'bridge' e 'patterns' como null.
3. brazilianTrap: FOQUE no erro clássico. Mostre o que o brasileiro tentaria dizer e a versão correta no objeto estruturado. SEMPRE preencha wrongPortuguese e rightPortuguese com traduções naturais em PT-BR das frases wrong e right.
4. Destaque Visual: Use ^^ envolta das palavras-chave em bridge.target and bridge.portuguese para criar o mapeamento visual.
5. explanation: array de 0-2 strings. OMITA se insight + bridge.difference já explicam a regra. Nunca repita insight nem bridge.difference.
5b. structureFormulas: use quando a regra tiver 2+ construções alternativas (ex: il faut vs devoir). Cada item com label descritivo e example (frase real + tradução PT-BR que instancia aquela fórmula). Deixe structureFormula e formulaExample null nesse caso.
5b2. formulaExample: quando usar structureFormula única, inclua 1 frase real + tradução PT-BR que mostra a fórmula aplicada na prática (ex: fórmula [Sujeito] + [réponds] + [à/au/aux] + [resposta] → target: "Je réponds à la question.", portuguese: "Eu respondo à pergunta.").
5c. retentionCheck: pergunta de 2 opções; prefira "Como você diria X?" quando possível. correctIndex deve apontar para a opção certa.
6. dialogueExample.target: DEVE ser uma linha real do diálogo acima.
7. additionalExamples: no máximo 1 exemplo com vocabulário diferente dos patterns (generalização).
8. Todo texto em PT-BR exceto as frases na língua-alvo.
9. ANTES DE RESPONDER: releia 'insight', 'explanation', 'brazilianTrap.explanation' e 'bridge.difference'. Se usou qualquer palavra da lista proibida OU se um brasileiro com ensino fundamental teria dificuldade, REESCREVA mais simples.
10. IDIOMA 100% PURO NA LÍNGUA-ALVO: Nos campos destinados à língua-alvo (como target, additionalExamples.target, verbSpotlight.idiomaticExpressions.target), NUNCA misture palavras do português (como "o", "a", "com"). Por exemplo, em francês escreva "jouer avec le feu", NUNCA "jouer avec o feu" ou "jouer avec com feu". O texto na língua-alvo deve ser 100% puro e gramaticalmente correto no idioma em questão.
11. EVITE REPETIÇÕES: Garanta que as explicações em 'insight', 'explanation', 'bridge.difference' e 'brazilianTrap.explanation' não repitam as mesmas informações com as mesmas ou outras palavras. Divida o conteúdo de forma lógica:
    - 'insight': Foco no modelo mental básico (A Sacada).
    - 'bridge.difference': Foco na diferença estrutural direta do exemplo principal (PT-BR vs Língua-alvo) em 1 frase curta.
    - 'explanation': Explicação profunda e conceitual do padrão.
    - 'brazilianTrap.explanation': Foco estritamente no motivo por trás do erro clássico do brasileiro.
12. ESTRUTURA E COMPLETUDE EM FRANCÊS: Se o foco for francês e envolver preposições + artigos (ex: contrações para dor, direção, lugares, etc.), você DEVE incluir nos padrões ('patterns') ou exemplos adicionais a contração antes de vogal/H mudo ('à l\''), além de cobrir o masculino ('au'), feminino ('à la') e plural ('aux').`;

    const raw = await callGeminiJSON<GrammarBridgeResult>(prompt, systemPrompt, 3500);
    return normalizeGrammarBridgeResult(raw, language);
  } catch (err) {
    console.error('[generateGrammarBridge] Error:', err);
    return null;
  }
}
