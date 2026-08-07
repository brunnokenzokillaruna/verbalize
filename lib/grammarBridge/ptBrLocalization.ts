import type { GrammarBridgeResult, SupportedLanguage } from '@/types';

/** Duration: FR pendant → PT-BR "durante" (not literal "por") as the primary bridge equivalent. */
const PT_DURATION_POR_PATTERN =
  /\bpor\s+(?:(?:um|uma|dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez|\d+)\s+(?:hora|horas|minuto|minutos|dia|dias|semana|semanas|m[eê]s|meses|ano|anos))\b/gi;

/** Target-language cues that legitimately map to PT "por sua vez". */
const TARGET_POR_SUA_VEZ_EQUIVALENTS =
  /\b(pour sa part|pour leur part|à son tour|a son tour|en revanche|quant à (lui|elle|eux|elles)|for (his|her|their) part|in turn)\b/i;

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

/**
 * Strip invented PT discourse pads that add meaning absent from the target sentence.
 * Classic failure: "Lui, il ne veut pas venir." → "Ele, por sua vez, não quer vir."
 * Left-dislocation (Lui,) is emphasis, not "por sua vez".
 */
export function stripInventedPorSuaVez(
  portuguese: string,
  target: string | undefined,
): string {
  if (!/\bpor sua vez\b/i.test(portuguese)) return portuguese;
  if (target && TARGET_POR_SUA_VEZ_EQUIVALENTS.test(target)) return portuguese;

  return portuguese
    .replace(/,?\s*por sua vez,?\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+,/g, ',')
    .replace(/^,\s*/, '')
    .replace(/,\s*,/g, ',')
    .trim();
}

function localizePortugueseField(
  text: string | undefined,
  shouldFixDuration: boolean,
  target?: string,
): string | undefined {
  if (!text?.trim()) return text;
  let next = stripInventedPorSuaVez(text, target);
  if (shouldFixDuration) next = preferDuranteInPortuguese(next);
  return next;
}

function localizeExamplePair<T extends { portuguese?: string; target?: string }>(
  pair: T | undefined,
  shouldFixDuration: boolean,
): T | undefined {
  if (!pair) return pair;
  const portuguese = localizePortugueseField(
    pair.portuguese,
    shouldFixDuration,
    pair.target,
  );
  if (portuguese === pair.portuguese) return pair;
  return { ...pair, portuguese };
}

function localizeExampleList<T extends { portuguese?: string; target?: string }>(
  list: T[] | undefined,
  shouldFixDuration: boolean,
): T[] | undefined {
  if (!list?.length) return list;
  let changed = false;
  const next = list.map((item) => {
    const portuguese = localizePortugueseField(
      item.portuguese,
      shouldFixDuration,
      item.target,
    );
    if (portuguese === item.portuguese) return item;
    changed = true;
    return { ...item, portuguese };
  });
  return changed ? next : list;
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
 * Brazilian equivalents and do not invent meaning absent from the target.
 */
export function applyPtBrLocalizationFixes(
  data: GrammarBridgeResult,
  grammarFocus: string,
  language: SupportedLanguage,
): GrammarBridgeResult {
  const shouldFixDuration = language === 'fr' && teachesFrenchDuration(grammarFocus);

  const bridge = data.bridge
    ? {
        ...data.bridge,
        portuguese:
          localizePortugueseField(
            data.bridge.portuguese,
            shouldFixDuration,
            data.bridge.target,
          ) ?? data.bridge.portuguese,
        ...(shouldFixDuration
          ? { difference: enrichPendantDifference(data.bridge.difference) }
          : {}),
      }
    : data.bridge;

  const trap =
    typeof data.brazilianTrap === 'object' && data.brazilianTrap
      ? {
          ...data.brazilianTrap,
          wrongPortuguese: localizePortugueseField(
            data.brazilianTrap.wrongPortuguese,
            shouldFixDuration,
            data.brazilianTrap.wrong,
          ),
          rightPortuguese: localizePortugueseField(
            data.brazilianTrap.rightPortuguese,
            shouldFixDuration,
            data.brazilianTrap.right,
          ),
        }
      : data.brazilianTrap;

  return {
    ...data,
    bridge,
    brazilianTrap: trap,
    patterns: localizeExampleList(data.patterns, shouldFixDuration),
    dialogueExample: localizeExamplePair(data.dialogueExample, shouldFixDuration),
    formulaExample: localizeExamplePair(data.formulaExample, shouldFixDuration),
    additionalExamples: localizeExampleList(data.additionalExamples, shouldFixDuration),
    structureFormulas: data.structureFormulas?.map((item) => ({
      ...item,
      example: localizeExamplePair(item.example, shouldFixDuration),
    })),
    items: localizeExampleList(data.items, shouldFixDuration),
    verbSpotlight: data.verbSpotlight
      ? {
          ...data.verbSpotlight,
          idiomaticExpressions: localizeExampleList(
            data.verbSpotlight.idiomaticExpressions,
            shouldFixDuration,
          ),
        }
      : data.verbSpotlight,
    explanation: Array.isArray(data.explanation)
      ? data.explanation.map(
          (line) => localizePortugueseField(line, shouldFixDuration) ?? line,
        )
      : localizePortugueseField(data.explanation, shouldFixDuration) ?? data.explanation,
  };
}

export function buildPtBrLocalizationPromptBlock(): string {
  return `
⚠️ TRADUÇÃO PT-BR FIEL E NATURAL ⚠️
- bridge.portuguese, patterns.portuguese, dialogueExample.portuguese, additionalExamples.portuguese e demais campos PT: use o jeito que um brasileiro FALA — natural, mas FIEL ao sentido da frase na língua-alvo.
- NÃO invente conectores ou ênfase que a frase-alvo NÃO tem. Errado: "Lui, il ne veut pas venir." → "Ele, por sua vez, não quer vir." Certo: "Ele não quer vir." (ou "Ele, não quer vir." se quiser ecoar a ênfase de "Lui,").
- "Lui/Moi/Toi + vírgula" = ênfase/destaque do sujeito — NÃO é "por sua vez", "já", "então" nem "por outro lado", a menos que a frase-alvo tenha pour sa part / en revanche / à son tour / quant à…
- additionalExamples DEVEM ilustrar o grammarFocus da lição (mesmo padrão), com vocabulário diferente — NÃO jogue frases aleatórias de outra regra.
- Duração com "pendant" + tempo: exemplo principal em PT-BR com "durante + período" (ex: "Eu trabalhei ^^durante^^ duas horas"). Evite usar só "por" como equivalente principal.
- bridge.difference: cite "durante" como equivalente natural de "pendant"; pode mencionar que "por" também existe em português, mas "durante" espelha melhor a regra francesa.
- Para outras preposição/regras: escolha o equivalente brasileiro mais natural, e mencione calques comuns no brazilianTrap quando fizer sentido.`;
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
