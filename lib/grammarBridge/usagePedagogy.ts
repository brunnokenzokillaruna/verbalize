import type { SupportedLanguage } from '@/types';

/**
 * Universal + focus-specific prompt blocks so Grammar Bridge teaches
 * WHEN/WHY to use a form in real life — not only how to assemble it.
 */

/** Detect tense/mood formation lessons that often collapse into morphology drills. */
export function isTenseOrMoodFormationFocus(grammarFocus: string): boolean {
  const f = grammarFocus.toLowerCase();
  return (
    f.includes('formação') ||
    f.includes('formacao') ||
    f.includes('formation') ||
    /\bimparfait\b/.test(f) ||
    f.includes('plus-que-parfait') ||
    f.includes('plusqueparfait') ||
    f.includes('subjonctif') ||
    f.includes('futur antérieur') ||
    f.includes('futur anterieur') ||
    f.includes('passé composé') ||
    f.includes('passe compose') ||
    f.includes('past continuous') ||
    f.includes('present perfect') ||
    f.includes('present continuous') ||
    f.includes('conditionnel') ||
    f.includes('futur simple')
  );
}

/** Which conjugation paradigm verbSpotlight should preview (never default blindly to present). */
export function resolveConjugationPreviewTense(
  grammarFocus: string,
  language: SupportedLanguage,
): string {
  const f = grammarFocus.toLowerCase();

  if (language === 'fr') {
    if (f.includes('imparfait')) return 'imparfait';
    if (f.includes('plus-que-parfait') || f.includes('plusqueparfait')) {
      return 'plus-que-parfait';
    }
    if (f.includes('subjonctif')) return 'subjonctif présent';
    if (f.includes('futur antérieur') || f.includes('futur anterieur')) {
      return 'futur antérieur';
    }
    if (f.includes('conditionnel passé')) return 'conditionnel passé';
    if (f.includes('conditionnel')) return 'conditionnel présent';
    if (f.includes('passé composé') || f.includes('passe compose')) {
      return 'passé composé';
    }
    if (f.includes('futur simple') || (f.includes('futur') && !f.includes('proche'))) {
      return 'futur simple';
    }
    if (f.includes('futuro próximo') || f.includes('futur proche') || f.includes('aller +')) {
      return 'futur proche (aller + infinitif)';
    }
    return 'présent';
  }

  if (f.includes('past continuous')) return 'past continuous';
  if (f.includes('present perfect continuous')) return 'present perfect continuous';
  if (f.includes('present perfect')) return 'present perfect';
  if (f.includes('present continuous') || f.includes('present progressive')) {
    return 'present continuous';
  }
  if (f.includes('simple past') || f.includes('past simple')) return 'simple past';
  if (f.includes('future continuous')) return 'future continuous';
  if (f.includes('going to') || f.includes('futuro próximo')) return 'going to future';
  if (f.includes('will') || f.includes('simple future')) return 'will future';
  return 'present simple';
}

/** Always injected — every lesson must answer "when do I use this in real life?". */
export function buildUsageFirstPromptBlock(): string {
  return `
⚠️ USO NA VIDA REAL — OBRIGATÓRIO (não é decoreba) ⚠️
O aluno precisa sair sabendo QUANDO usar na conversa real, não só COMO montar a fórmula.
- insight: DEVE nomear a situação da vida real (gatilho concreto: hábito, ação em andamento, pedido, contraste, descrição…). PROIBIDO insight que só descreve morfologia ("tira o -ons", "pega o radical", "adiciona -ais").
- explanation: item 1 = como montar na prática; item 2 = QUANDO escolher esta forma (ou o erro de timing do brasileiro).
- structureFormula (única): a fórmula sozinha NÃO basta — insight + explanation cobrem o "quando".
- structureFormulas: cada "hint" é OBRIGATÓRIO e responde só isto: "quando usar esta opção" (MAX 20 palavras).
- patterns: preferir contraste de USO (ex: hábito vs ação pontual; pedido vs ordem) quando fizer sentido — não só afirmação/negação mecânica.
- retentionCheck: preferir pergunta de escolha de situação ("Em qual momento você usaria X?") ou "Como você diria X [neste contexto]?". Evite quiz só de conjugação solta.
- survivalTip: âncora do gatilho de uso ("se era costume → imparfait"), não passo a passo de formação.
- usageContext: continua sendo só rótulo de 1-3 palavras — NÃO substitui insight.
`;
}

function buildImparfaitGuidance(): string {
  return `
⚠️ IMPARFAIT — FORMAÇÃO + USO (mesmo se o título for "Formação") ⚠️
Não ensine só a receita morfológica. O brasileiro precisa saber QUANDO falar no imparfait.
Três gatilhos obrigatórios (use structureFormulas com EXATAMENTE 3 itens, cada um com hint):
1. label: "Em andamento" | hint: "Quando algo ESTAVA acontecendo no passado." | fórmula do imparfait + exemplo tipo "Je rangeais…"
2. label: "Hábito antigo" | hint: "Quando era costume / rotina no passado." | exemplo tipo infância ou rotina
3. label: "Cenário / descrição" | hint: "Quando descreve como as coisas ERAM (clima, lugar, pessoa)." | exemplo descritivo
- insight: em 1-2 frases, diga que o imparfait pinta o fundo do passado (andamento, hábito ou descrição) — NÃO comece pela receita "-ais/-ait".
- explanation[0]: como formar em 1 frase simples (radical de nous + terminações).
- explanation[1]: quando NÃO é o foco desta lição aprofundar vs passé composé — só 1 frase: ação pontual/acabada usa outro passado.
- bridge: exemplo de andamento ou descrição (PT "estava + gerúndio" ou "era/tinha" ↔ FR imparfait).
- brazilianTrap: erro clássico = usar passé composé onde cabe hábito/descrição, OU montar "être en train de" desnecessário calqueando "estava + gerúndio".
- Se houver conjugationPreview: conjugue no IMPARFAIT, nunca no présent.
`;
}

function buildPlusQueParfaitGuidance(): string {
  return `
⚠️ PLUS-QUE-PARFAIT — FORMAÇÃO + USO ⚠️
Ensine QUANDO usar junto com a formação (avoir/être no imparfait + participe).
- structureFormulas: 2 itens com hint — (1) ação anterior a outra no passado ("já tinha feito quando…"); (2) relato do que tinha acontecido antes do momento da história.
- insight: gatilho = "ainda mais no passado" / "já tinha…".
- NÃO fique só na receita auxiliaire + participe.
`;
}

function buildSubjonctifGuidance(grammarFocus: string): string {
  const f = grammarFocus.toLowerCase();
  const formationOnly =
    f.includes('formação') || f.includes('formacao') || f.includes('regulares') || f.includes('irregulares');

  if (formationOnly) {
    return `
⚠️ SUBJONCTIF — FORMAÇÃO SEM DECOREBA ⚠️
Mostre a formação, MAS amarre a 1-2 gatilhos de uso reais (vontade, necessidade, emoção, dúvida) com exemplos.
- insight: "aparece depois de querer/precisar/emocionar-se + que…", não só "termine em -e/-es".
- structureFormulas: pelo menos 2 — uma de formação rápida, outra de gatilho de uso com hint "quando…".
- Deixe os usos finos (concessão, sans que…) para as lições específicas; aqui o aluno já deve sentir POR QUE o modo existe.
`;
  }

  return `
⚠️ SUBJONCTIF — USO NA VIDA REAL ⚠️
Priorize o gatilho desta lição (vontade, dúvida, emoção, etc.): QUANDO o brasileiro deve trocar o indicativo pelo subjonctif.
- insight + structureFormulas[].hint = situação concreta.
- Inclua 1 contraste curto: frase com indicativo (fato) vs subjonctif (desejo/dúvida/emoção) se couber no foco.
`;
}

function buildFuturAnterieurGuidance(): string {
  return `
⚠️ FUTUR ANTÉRIEUR — FORMAÇÃO + USO ⚠️
- Gatilho principal: ação que JÁ terá terminado antes de outro momento no futuro ("quando você chegar, eu já terei…").
- insight e hint obrigatórios com esse gatilho; formação (futur de avoir/être + participe) vem em segundo.
`;
}

function buildPastContinuousGuidance(): string {
  return `
⚠️ PAST CONTINUOUS — FORMAÇÃO + USO ⚠️
Mesmo com foco em was/were + -ing, ensine QUANDO usar:
- structureFormulas: 2–3 com hint — (1) ação em andamento no passado; (2) fundo de uma história enquanto outra coisa aconteceu; (3) interrupção (I was X when Y happened) se couber.
- insight: situação real, não só a receita was/were + -ing.
- Contraste fino com Simple Past pode ser breve; lições "VS" aprofundam depois.
`;
}

/**
 * Focus-specific blocks (imparfait, subjonctif, etc.) + legacy special cases.
 * Empty string when no dedicated block applies (universal block still applies).
 */
export function buildGrammarFocusGuidance(
  grammarFocus: string,
  language: SupportedLanguage,
): string {
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

  if (language === 'fr' && focus.includes('imparfait')) {
    return buildImparfaitGuidance();
  }

  if (
    language === 'fr' &&
    (focus.includes('plus-que-parfait') || focus.includes('plusqueparfait'))
  ) {
    return buildPlusQueParfaitGuidance();
  }

  if (language === 'fr' && focus.includes('subjonctif')) {
    return buildSubjonctifGuidance(grammarFocus);
  }

  if (
    language === 'fr' &&
    (focus.includes('futur antérieur') || focus.includes('futur anterieur'))
  ) {
    return buildFuturAnterieurGuidance();
  }

  if (language === 'en' && focus.includes('past continuous')) {
    return buildPastContinuousGuidance();
  }

  if (isTenseOrMoodFormationFocus(grammarFocus)) {
    return `
⚠️ TEMPO/MODO — NÃO ENSINE SÓ A RECEITA ⚠️
Mesmo que o título fale em "formação" ou "conjugação", o insight DEVE dizer em que situação da vida real o aluno usa este tempo/modo.
- structureFormula ou structureFormulas com hint(s) de QUANDO usar.
- explanation: formar + gatilho de uso.
- survivalTip: âncora do gatilho, não só da terminação.
`;
  }

  return '';
}

/** Soft local signal: insight looks like pure morphology with no usage cue. */
export function insightLooksLikeMorphologyOnly(insight: string | undefined): boolean {
  const text = insight?.trim().toLowerCase() ?? '';
  if (!text) return false;

  const morphology =
    /\b(tira|tire|remove|pega|pegue|radical|termina(ção|ções)?|terminaison|adiciona|acrescente|sufixo|desinência|-ais|-ait|-ions|-iez|conjug)\b/.test(
      text,
    );
  const usage =
    /\b(quando|pra|para|situação|situacao|hábito|habito|costume|descrev|andament|enquanto|já tinha|vontade|dúvida|duvida|pedido|conversa|vida real|no passado|no futuro)\b/.test(
      text,
    );

  return morphology && !usage;
}
