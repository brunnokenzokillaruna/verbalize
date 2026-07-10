import type { GrammarBridgeResult, SupportedLanguage } from '@/types';

/** Duration: FR pendant → PT-BR "durante" (not literal "por") as the primary bridge equivalent. */
const PT_DURATION_POR_PATTERN =
  /\bpor\s+(?:(?:um|uma|dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez|\d+)\s+(?:hora|horas|minuto|minutos|dia|dias|semana|semanas|m[eê]s|meses|ano|anos))\b/gi;

function teachesFrenchDuration(grammarFocus: string): boolean {
  const focus = grammarFocus.toLowerCase();
  return (
    focus.includes('pendant') ||
    focus.includes('duração') ||
    focus.includes('duracao') ||
    focus.includes('durée') ||
    focus.includes('tempo decorrido')
  );
}

function preferDuranteInPortuguese(text: string): string {
  return text.replace(PT_DURATION_POR_PATTERN, (match) =>
    match.replace(/^por\b/i, 'durante'),
  );
}

function localizePortugueseField(text: string | undefined, shouldFixDuration: boolean): string | undefined {
  if (!text?.trim() || !shouldFixDuration) return text;
  return preferDuranteInPortuguese(text);
}

function localizeExamplePair<T extends { portuguese?: string; target?: string }>(
  pair: T | undefined,
  shouldFixDuration: boolean,
): T | undefined {
  if (!pair) return pair;
  const portuguese = localizePortugueseField(pair.portuguese, shouldFixDuration);
  if (portuguese === pair.portuguese) return pair;
  return { ...pair, portuguese };
}

function localizeExampleList<T extends { portuguese?: string }>(
  list: T[] | undefined,
  shouldFixDuration: boolean,
): T[] | undefined {
  if (!list?.length || !shouldFixDuration) return list;
  return list.map((item) => {
    const portuguese = localizePortugueseField(item.portuguese, shouldFixDuration);
    return portuguese === item.portuguese ? item : { ...item, portuguese };
  });
}

function enrichPendantDifference(difference: string | undefined): string {
  const text = difference?.trim() ?? '';
  if (!text) {
    return "No francês usamos 'pendant'; em português o equivalente mais natural é 'durante'.";
  }
  if (/durante/i.test(text)) return text;
  if (/\bpor\b/i.test(text)) {
    return text.replace(/\bpor\b/i, 'durante');
  }
  return `${text} Em português, o equivalente mais natural é "durante".`;
}

/**
 * Post-processes AI grammar-bridge output so PT-BR examples use natural
 * Brazilian equivalents (e.g. "durante duas horas" for pendant, not "por").
 */
export function applyPtBrLocalizationFixes(
  data: GrammarBridgeResult,
  grammarFocus: string,
  language: SupportedLanguage,
): GrammarBridgeResult {
  const shouldFixDuration = language === 'fr' && teachesFrenchDuration(grammarFocus);
  if (!shouldFixDuration) return data;

  const bridge = data.bridge
    ? {
        ...data.bridge,
        portuguese: localizePortugueseField(data.bridge.portuguese, true) ?? data.bridge.portuguese,
        difference: enrichPendantDifference(data.bridge.difference),
      }
    : data.bridge;

  return {
    ...data,
    bridge,
    patterns: localizeExampleList(data.patterns, true),
    dialogueExample: localizeExamplePair(data.dialogueExample, true),
    formulaExample: localizeExamplePair(data.formulaExample, true),
    additionalExamples: localizeExampleList(data.additionalExamples, true),
    structureFormulas: data.structureFormulas?.map((item) => ({
      ...item,
      example: localizeExamplePair(item.example, true),
    })),
    items: localizeExampleList(data.items, true),
    explanation: Array.isArray(data.explanation)
      ? data.explanation.map((line) => localizePortugueseField(line, true) ?? line)
      : localizePortugueseField(data.explanation, true) ?? data.explanation,
  };
}

export function buildPtBrLocalizationPromptBlock(): string {
  return `
⚠️ TRADUÇÃO LOCALIZADA EM PT-BR (NÃO CALQUE LITERAL) ⚠️
- bridge.portuguese, patterns.portuguese, dialogueExample.portuguese e demais exemplos em português: use o jeito que um brasileiro FALA de verdade — não tradução palavra por palavra do dicionário.
- Duração com "pendant" + tempo: exemplo principal em PT-BR com "durante + período" (ex: "Eu trabalhei ^^durante^^ duas horas"). Evite usar só "por" como equivalente principal.
- bridge.difference: cite "durante" como equivalente natural de "pendant"; pode mencionar que "por" também existe em português, mas "durante" espelha melhor a regra francesa.
- Para outras preposição/regras: escolha sempre o equivalente brasileiro mais natural (o que se ouve na rua), e mencione calques comuns no brazilianTrap quando fizer sentido.`;
}

export function buildDurationGrammarFocusGuidance(
  grammarFocus: string,
  language: SupportedLanguage,
): string {
  if (language !== 'fr' || !teachesFrenchDuration(grammarFocus)) return '';

  return `
⚠️ PENDANT / DURAÇÃO — LOCALIZAÇÃO PT-BR OBRIGATÓRIA ⚠️
- bridge.portuguese: "J'ai travaillé pendant deux heures" → PT-BR "Eu ^^trabalhei^^ ^^durante^^ duas horas" (NÃO "por duas horas" como exemplo principal).
- bridge.difference: explique que "pendant" ≈ "durante" em português; pode citar que "por" também aparece, mas "durante" é o paralelo mais fiel.
- patterns, formulaExample, dialogueExample.portuguese: mesma regra — "durante + período".
- explanation: se falar do português, inclua "durante" (não cite só "por" ou omissão).
- brazilianTrap: erro típico = omitir a preposição ("Trabalhei duas horas") ou confundir com "para".`;
}
