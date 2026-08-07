'use server';

import { callGeminiJSON } from '@/services/gemini';
import { normalizeGrammarBridgeResult } from '@/lib/schemas/grammarBridge';
import {
  buildDurationGrammarFocusGuidance,
  buildPtBrLocalizationPromptBlock,
} from '@/lib/grammarBridge/ptBrLocalization';
import { buildFocusCompletenessPromptBlock } from '@/lib/grammarBridge/focusCompleteness';
import {
  formatIssuesForRegen,
  gateGrammarBridge,
} from '@/lib/grammarBridge/verifyGrammarBridge';
import { filterUniqueSurvivalTip } from '@/lib/grammarBridgeDedup';
import type { SupportedLanguage, GrammarBridgeResult, LessonTag } from '@/types';

const MAX_REGEN_ATTEMPTS = 2;

function buildTagBridgeGuidance(tag: LessonTag | undefined): string {
  switch (tag) {
    case 'GRAM':
      return 'PRIORIDADE: bridge + structureFormulas (quando houver 2+ usos/termos) + patterns (2-3) + additionalExamples (até 2) + brazilianTrap. Garanta COMPLETUDE: todo termo/uso do grammarFocus deve aparecer em insight, explanation e structureFormulas/patterns.';
    case 'VERB':
      return 'PRIORIDADE: verbSpotlight completo + patterns (1-2 exemplos de uso do verbo) + brazilianTrap. NÃO omita patterns.';
    case 'EXPR':
    case 'VOC':
      return 'PRIORIDADE: items (UM item por termo do tema — se o foco for "Amener e Emmener", items DEVE ter os dois) + dialogueExample + additionalExamples. Se o tema for par de confusão/lista, NÃO ensine só o primeiro termo. bridge/patterns podem ser null.';
    case 'DIAL':
    case 'CULT':
      return 'PRIORIDADE: usageContext + culturalNote + additionalExamples + dialogueExample.';
    default:
      return 'Use bridge + patterns para regras sistêmicas, ou items para listas de expressões.';
  }
}

function buildGrammarFocusGuidance(grammarFocus: string, language: SupportedLanguage): string {
  const focus = grammarFocus.toLowerCase();

  if (
    language === 'fr' &&
    (focus.includes('pronomes tônicos') ||
      focus.includes('pronomes tonicos') ||
      focus.includes('tonic') ||
      /\bmoi\b.*\btoi\b/i.test(grammarFocus))
  ) {
    return `
⚠️ PRONOMES TÔNICOS (moi, toi, lui, elle, nous, vous, eux, elles) — COMPLETUDE OBRIGATÓRIA ⚠️
Esta regra tem DOIS usos distintos que o aluno PRECISA sair sabendo:
1. ÊNFASE/CONTRASTE no sujeito → pronome no INÍCIO + vírgula + sujeito + verbo (ex: "Moi, je préfère le café.")
2. DEPOIS DE PREPOSIÇÃO → pronome APÓS pour/avec/chez/sans/de (ex: "Je fais ça pour toi.", "Viens avec moi.")

OBRIGATÓRIO no JSON:
- structureFormulas: EXATAMENTE 2 itens, um por uso, cada um com label, hint, formula e example.
  - Item 1 — label: "Ênfase no início" | hint: "Pra destacar quem fala ou contrastar, tipo 'quanto a mim...'" | formula: "[Pronome tônico] + , + [Sujeito] + [Verbo]"
  - Item 2 — label: "Depois de preposição" | hint: "Quando fala de alguém depois de pour, avec, chez etc. — o pronome vai DEPOIS da preposição." | formula: "[Verbo] + [pour/avec/chez] + [Pronome tônico]"
- insight: mencionar os DOIS usos em no máximo 2 frases (não só o início).
- explanation: item 1 = uso 1; item 2 = uso 2.
- survivalTip: cobrir os dois casos (ex: "Início com vírgula = ênfase; depois de pour/avec = outra pessoa.").
- brazilianTrap: erro clássico do uso 1 (pronome no início sem sujeito clítico: "Moi aime" → "Moi, j'aime").
- bridge: ilustrar preferencialmente o uso 1 (ênfase no início), pois é o erro mais comum do brasileiro.
`;
  }

  return '';
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

function buildSystemPrompt(language: SupportedLanguage): string {
  return `Você é um amigo brasileiro fera em ${LANG_LABEL[language]} explicando gramática de um jeito que qualquer pessoa entende, sem parecer robô ou professor formal.
Regras de Humanidade:
- ZERO "IA-ismos": nada de "Certamente", "Aqui está seu guia", "Entender a nuance é essencial".
- Use gírias leves e naturais (tipo, né, olha só, a gente).
- Seja CLARO E SUFICIENTE: frases curtas, mas explique o mecanismo com profundidade — o aluno precisa REALMENTE entender.
- Use emojis SPARINGLY para dar um toque humano (ex: 😉, 🚀).
Respond with ONLY valid JSON, no markdown, no explanation.`;
}

function buildVerbBlocks(grammarFocus: string, language: SupportedLanguage, isVerbLesson: boolean) {
  if (!isVerbLesson) return { verbSpotlightBlock: '', verbRulesBlock: '' };

  const verbSpotlightBlock = `,
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
  }`;

  const verbRulesBlock = `
REGRAS EXTRA PARA LIÇÃO DE VERBO:
- verbSpotlight.infinitive: use o pronome/marcador correto da língua (ex: em FR é 'être', não 'to be'; em EN é 'to be').
- verbSpotlight.conjugationPreview: forneça as formas do PRESENTE na língua-alvo. ${
    language === 'fr'
      ? "Para francês use separadamente exatamente: 'je, tu, il, elle, on, nous, vous, ils, elles'."
      : "Para inglês use separadamente exatamente: 'I, you, he, she, it, we, they'."
  }
- verbSpotlight.idiomaticExpressions: FORNEÇA 1-2 expressões fixas reais, não invente. Se não houver expressão canônica com esse verbo, deixe como array vazio []. NUNCA misture palavras em português nos textos da língua-alvo (ex: "jouer avec le feu", NUNCA "jouer avec o feu").
- verbSpotlight.personality e frequencyNote: linguagem SIMPLES, frases curtas, como amigo explicando.`;

  return { verbSpotlightBlock, verbRulesBlock };
}

function buildUserPrompt(params: {
  dialogue: string;
  grammarFocus: string;
  language: SupportedLanguage;
  tag?: LessonTag;
  verbSpotlightBlock: string;
  verbRulesBlock: string;
  correctionBlock?: string;
}): string {
  const {
    dialogue,
    grammarFocus,
    language,
    tag,
    verbSpotlightBlock,
    verbRulesBlock,
    correctionBlock,
  } = params;

  const tagGuidance = buildTagBridgeGuidance(tag);
  const focusGuidance = buildGrammarFocusGuidance(grammarFocus, language);
  const durationGuidance = buildDurationGrammarFocusGuidance(grammarFocus, language);
  const completenessGuidance = buildFocusCompletenessPromptBlock(grammarFocus);
  const ptBrLocalizationBlock = buildPtBrLocalizationPromptBlock();
  const isGram = tag === 'GRAM' || !tag;

  return `Explique o padrão gramatical "${grammarFocus}" para um brasileiro aprendendo ${LANG_LABEL[language]}.

Contexto do diálogo:
"${dialogue}"

ORIENTAÇÃO POR TIPO DE LIÇÃO (tag: ${tag ?? 'GRAM'}):
${tagGuidance}
${focusGuidance}
${completenessGuidance}
${durationGuidance}
${ptBrLocalizationBlock}
${correctionBlock ?? ''}

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

⚠️ FORMATO DE EXIBIÇÃO — JORNADA PEDAGÓGICA v3 ⚠️
Ordem cognitiva no app: Sacada → Fórmula → Exemplos → Radar de erro → Âncora → Quiz.
Cada campo do JSON tem uma FUNÇÃO COGNITIVA distinta. NÃO repita a mesma sacada em campos diferentes.
- insight = modelo mental (1 ideia de impacto)
- analogy = opcional, 1 frase "pensa assim…" (analogia do dia a dia) — NÃO repita o insight
- bridge.difference = diferença estrutural do exemplo principal (1 frase)
- explanation = mecanismo/como montar + por quê${isGram ? ' — OBRIGATÓRIO em lições GRAM (1-2 itens)' : ' — omita se redundante'}
- patterns = 2-3 variações (contraste quando possível: Afirmação/Negação etc.)
- dialogueExample = frase verbatim do diálogo acima
- additionalExamples = até 2 itens, vocabulário DIFERENTE dos patterns, para generalização
- brazilianTrap = erro que brasileiro cometeria (só aparece DEPOIS da regra no app)
- survivalTip = âncora memorizável — NÃO reexplica a regra; é o mnemônico curto
- retentionCheck = preferência: "Como você diria X?" com 2-3 opções

⚠️ MISSÃO CENTRAL: ENSINO INTUITIVO E PROFUNDO ⚠️
O objetivo é que o aluno REALMENTE ENTENDA a regra — claro e suficiente, não raso.
Você DEVE:
- Explicar com calma, usando comparações diretas com o português ("No português a gente faz X, mas no ${LANG_LABEL[language]} faz Y porque...").
- Dar MÚLTIPLOS exemplos paralelos (PT-BR → ${LANG_LABEL[language]}) para que o aluno veja o padrão se repetindo.
- Usar analogias do dia a dia quando ajudar (campo analogy).
- Incluir equivalências explícitas: para cada conceito, mostrar COMO se diz em português e COMO se diz na língua-alvo.
Mas NUNCA escreva como um livro acadêmico. Escreva como um amigo paciente explicando.

⚠️ PRECISÃO LINGUÍSTICA — CRÍTICO (não ensine errado; ensinar errado é pior do que não ensinar) ⚠️
- Toda frase na língua-alvo (bridge.target, patterns.target, formula examples, brazilianTrap.right, opção correta do quiz, conjugações) DEVE ser gramaticalmente correta e natural.
- Toda tradução PT-BR (*.portuguese) DEVE ser FIEL ao sentido da frase-alvo correspondente: mesmo sujeito, verbo, negação e complementos. NÃO acrescente conectores inventados ("por sua vez", "já", "então", "por outro lado") se a frase-alvo não tiver equivalente.
- Exemplo proibido: target "Lui, il ne veut pas venir." → portuguese "Ele, por sua vez, não quer vir." Correto: "Ele não quer vir."
- brazilianTrap.wrong é o ÚNICO lugar permitido para frase errada — e deve ser o erro clássico do brasileiro, NÃO um "certo" disfarçado.
- insight/explanation NÃO podem afirmar regra falsa (gênero, contração, ordem, conjugação inventada).
- additionalExamples devem ilustrar "${grammarFocus}" — não frases de outra regra gramatical.
- ANTES DE FECHAR O JSON: checklist mental — "cada campo marcado como certo está certo de verdade? cada portuguese diz a mesma coisa que o target?"

⚠️ LINGUAGEM ACESSÍVEL — REGRA CRÍTICA ⚠️
O público inclui brasileiros com baixa escolaridade. Escreva como se estivesse explicando para um amigo que nunca estudou gramática, não como livro didático.

PALAVRAS E EXPRESSÕES PROIBIDAS (substitua por alternativas simples):
- "estados permanentes e temporários" → dê exemplos concretos como "ser brasileiro" vs "estar cansado"
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
- Exemplos concretos > descrições abstratas.
- Tom de amigo: "você", "a gente", "tipo", "né", "sacou".
- Prefira "você usa X" em vez de "X é usado".

EXEMPLO RUIM (NÃO escreva assim):
"O verbo 'être' é o equivalente direto de ser e estar, eliminando a distinção que fazemos entre estados permanentes e temporários."

EXEMPLO BOM (escreva assim):
"Em francês, 'être' serve pros dois verbos do português: ser e estar. 'Eu sou brasileiro' e 'eu estou cansado' usam o mesmo verbo lá."

Output ONLY este JSON (sem markdown):
{
  "insight": "1-2 frases de impacto em PT-BR SIMPLES — a sacada central da regra.",
  "analogy": "Opcional. 1 frase tipo 'Pensa assim: ...' — analogia do dia a dia. MAX 20 palavras. null se não ajudar.",
  "explanation": [
    "Item 1 (MAX 15 palavras): como montar a frase na prática, com exemplo PT → língua-alvo.",
    "Item 2 (MAX 15 palavras): por que brasileiros erram nesse ponto OU segundo uso da regra."
  ],
  "survivalTip": "Âncora memorizável (mnemônico), NÃO reexplica a regra. MAX 12 palavras.",
  "culturalNote": "Detalhe cultural real de uso. MAX 15 palavras.",
  "structureFormula": "fórmula única quando há só UMA construção. Use colchetes e '+'. null se usar structureFormulas.",
  "formulaExample": { "target": "Frase real que instancia a fórmula única", "portuguese": "Tradução natural PT-BR" },
  "structureFormulas": [
    {
      "label": "Opção A (ex: necessidade geral)",
      "hint": "QUANDO usar esta construção. MAX 20 palavras.",
      "formula": "[il faut] + [verbo no infinitivo]",
      "example": { "target": "Il faut ranger.", "portuguese": "É preciso organizar." }
    },
    {
      "label": "Opção B (ex: obrigação pessoal)",
      "hint": "QUANDO usar esta construção. MAX 20 palavras.",
      "formula": "[Sujeito] + [devoir conjugado] + [verbo no infinitivo]",
      "example": { "target": "Je dois ranger.", "portuguese": "Eu preciso organizar." }
    }
  ],
  "usageContext": "Vibe social em 1-3 palavras (ex: 'Casual/Amigos').",
  "brazilianTrap": {
    "wrong": "frase errada que um brasileiro diria/pensaria ao traduzir direto",
    "right": "frase CORRETA na língua-alvo",
    "wrongPortuguese": "tradução PT-BR do que o brasileiro pensaria",
    "rightPortuguese": "tradução PT-BR da frase correta",
    "subtitle": "Subtítulo curto do erro",
    "explanation": "só o motivo do erro clássico. MAX 2 frases curtas."
  },
  "retentionCheck": {
    "question": "Prefira 'Como você diria X?' em PT-BR",
    "options": ["opção errada plausível", "opção correta"],
    "correctIndex": 1
  },
  "patterns": [
    { "label": "Afirmação", "target": "I speak", "portuguese": "Eu falo" },
    { "label": "Negação", "target": "I do not speak", "portuguese": "Eu não falo" },
    { "label": "Outra variação (opcional)", "target": "...", "portuguese": "..." }
  ],
  "bridge": {
    "portuguese": "Use ^^ para destacar. ex: 'Eu ^^falo^^'",
    "target": "Use ^^ para destacar. ex: 'I ^^speak^^'",
    "difference": "Diferença estrutural em 1 frase. MAX 15 palavras."
  },
  "items": [
    { "target": "Expressão 1", "portuguese": "Tradução PT-BR", "logic": "Sacada curta (OPCIONAL)" }
  ],
  "dialogueExample": {
    "target": "Frase do diálogo acima que ilustra '${grammarFocus}' — VERBATIM",
    "portuguese": "Tradução natural PT-BR"
  },
  "additionalExamples": [
    { "target": "Exemplo extra 1 com vocabulário diferente", "portuguese": "Equivalente PT-BR" },
    { "target": "Exemplo extra 2 com vocabulário diferente", "portuguese": "Equivalente PT-BR" }
  ]${verbSpotlightBlock}
}
${verbRulesBlock}

Regras Cruciais:
1. Se o tema for uma REGRA SISTÊMICA (ex: Plural, Passado), use 'bridge' e 'patterns' (2-3). Deixe 'items' como null.
2. Se o tema for uma LISTA de expressões, preencha 'items' (máx. 3). Deixe 'bridge' e 'patterns' como null.
3. brazilianTrap: FOQUE no erro clássico. SEMPRE preencha wrongPortuguese e rightPortuguese. right DEVE estar correto na língua-alvo.
4. Destaque Visual: Use ^^ em bridge.target e bridge.portuguese.
5. explanation: array de 1-2 strings em GRAM. Nunca repita insight nem bridge.difference.
5b. structureFormulas: use quando a regra tiver 2+ construções. Cada item com label + hint + formula + example.
5b2. formulaExample: quando usar structureFormula única, inclua 1 frase real + tradução PT-BR.
5c. retentionCheck: prefira "Como você diria X?". correctIndex aponta para a opção certa de verdade.
6. dialogueExample.target: DEVE ser uma linha real do diálogo acima.
7. additionalExamples: até 2 exemplos com vocabulário diferente dos patterns, SEMPRE ilustrando o mesmo grammarFocus; portuguese fiel ao target (sem inventar "por sua vez").
8. Todo texto em PT-BR exceto as frases na língua-alvo.
9. ANTES DE RESPONDER: releia insight, explanation, brazilianTrap.explanation e bridge.difference. Se usou palavra proibida OU um brasileiro com ensino fundamental teria dificuldade, REESCREVA mais simples.
10. IDIOMA 100% PURO NA LÍNGUA-ALVO: zero português em campos target.
11. EVITE REPETIÇÕES:
    - insight: modelo mental (A Sacada)
    - analogy: analogia diferente do insight
    - bridge.difference: só estrutura do exemplo
    - explanation: como/por quê
    - brazilianTrap.explanation: só o motivo do erro
    - survivalTip: só mnemônico (não repete insight)
12. ESTRUTURA E COMPLETUDE EM FRANCÊS: preposições + artigos → cobrir au / à la / aux / à l' quando aplicável.
13. COMPLETUDE EM REGRAS COM MÚLTIPLOS USOS/TERMOS: se o grammarFocus nomeia 2+ itens (ex: "Amener e Emmener", "X VS Y"), ensine TODOS — structureFormulas/items/patterns + insight. Omitir um termo = conteúdo inválido.`;
}

function finalizeBridge(
  bridge: GrammarBridgeResult,
  language: SupportedLanguage,
  grammarFocus: string,
): GrammarBridgeResult {
  const normalized = normalizeGrammarBridgeResult(bridge, language, grammarFocus);
  if (!normalized) return bridge;

  const tip = filterUniqueSurvivalTip(normalized.survivalTip, normalized);
  if (tip !== normalized.survivalTip) {
    normalized.survivalTip = tip;
  }
  return normalized;
}

/**
 * Generates a Grammar Bridge using the Portuguese Bridge Method.
 * Runs local + Gemini accuracy gate; regenerates with feedback on core issues.
 * Returns null only if generation fails or retries are exhausted (safer than teaching wrong).
 */
export async function generateGrammarBridge(
  params: GenerateGrammarBridgeParams,
): Promise<GrammarBridgeResult | null> {
  const { dialogue, grammarFocus, language, tag } = params;

  try {
    const systemPrompt = buildSystemPrompt(language);
    const isVerbLesson = tag === 'VERB';
    const { verbSpotlightBlock, verbRulesBlock } = buildVerbBlocks(
      grammarFocus,
      language,
      isVerbLesson,
    );

    let correctionBlock: string | undefined;
    let lastRaw: GrammarBridgeResult | null = null;

    for (let attempt = 0; attempt <= MAX_REGEN_ATTEMPTS; attempt++) {
      const prompt = buildUserPrompt({
        dialogue,
        grammarFocus,
        language,
        tag,
        verbSpotlightBlock,
        verbRulesBlock,
        correctionBlock,
      });

      const raw = await callGeminiJSON<GrammarBridgeResult>(
        prompt,
        systemPrompt,
        3500,
        undefined,
        'standard',
      );
      lastRaw = raw;

      const normalized = finalizeBridge(raw, language, grammarFocus);
      if (!normalized) continue;

      const gate = await gateGrammarBridge(normalized, language, grammarFocus);

      if (gate.ok) {
        return gate.sanitized ?? normalized;
      }

      console.warn(
        `[generateGrammarBridge] Attempt ${attempt + 1} failed accuracy gate:`,
        gate.issues.map((i) => `${i.field}: ${i.problem}`).join('; '),
      );

      if (attempt >= MAX_REGEN_ATTEMPTS) break;

      correctionBlock = `
⚠️ CORREÇÃO OBRIGATÓRIA — a versão anterior tinha erros de precisão. Reescreva o JSON completo corrigindo:
${formatIssuesForRegen(gate.issues)}

JSON anterior (corrija o necessário, mantenha o que estiver certo):
${JSON.stringify(normalized)}
`;
    }

    console.error(
      '[generateGrammarBridge] Exhausted regen attempts — returning null (will skip grammar phase)',
      lastRaw ? '(last raw had content)' : '(no raw)',
    );
    return null;
  } catch (err) {
    console.error('[generateGrammarBridge] Error:', err);
    return null;
  }
}
