import type { GrammarBridgeResult, SupportedLanguage } from '@/types';
import type {
  ConjugationStep,
  FormulaExample,
  FormulaStep,
  GrammarPhase,
  GrammarStep,
  StepDraft,
  SynthesisStep,
} from '@/lib/grammarBridge/types';

const FR_SINGULAR = new Set(['je', 'tu', 'il', 'elle', 'on']);
const FR_PLURAL = new Set(['nous', 'vous', 'ils', 'elles']);
const EN_SINGULAR = new Set(['I', 'you', 'he', 'she', 'it']);
const EN_PLURAL = new Set(['we', 'they']);

export function attachPhaseIndices(drafts: StepDraft[]): GrammarStep[] {
  const phaseTotals = new Map<GrammarPhase, number>();
  for (const d of drafts) {
    phaseTotals.set(d.phase, (phaseTotals.get(d.phase) ?? 0) + 1);
  }

  const phaseCounters = new Map<GrammarPhase, number>();

  return drafts.map((draft) => {
    const idx = (phaseCounters.get(draft.phase) ?? 0) + 1;
    phaseCounters.set(draft.phase, idx);
    return {
      ...draft,
      phaseIndex: idx,
      phaseTotal: phaseTotals.get(draft.phase) ?? 1,
    } as GrammarStep;
  });
}

export function splitConjugationSteps(
  infinitive: string,
  preview: Array<{ pronoun: string; form: string }>,
  language: SupportedLanguage,
): ConjugationStep['data'][] {
  if (preview.length <= 5) {
    return [{ infinitive, forms: preview }];
  }

  const singularSet = language === 'fr' ? FR_SINGULAR : EN_SINGULAR;
  const pluralSet = language === 'fr' ? FR_PLURAL : EN_PLURAL;

  const singular = preview.filter((c) => singularSet.has(c.pronoun));
  const plural = preview.filter((c) => pluralSet.has(c.pronoun));

  if (singular.length > 0 && plural.length > 0) {
    return [
      { infinitive, forms: singular, partLabel: language === 'fr' ? 'Singular' : 'Singular' },
      { infinitive, forms: plural, partLabel: language === 'fr' ? 'Plural' : 'Plural' },
    ];
  }

  const mid = Math.ceil(preview.length / 2);
  return [
    { infinitive, forms: preview.slice(0, mid), partLabel: 'Parte 1' },
    { infinitive, forms: preview.slice(mid), partLabel: 'Parte 2' },
  ];
}

export function getTrap(bridge: GrammarBridgeResult) {
  if (typeof bridge.brazilianTrap === 'object' && bridge.brazilianTrap) {
    return bridge.brazilianTrap;
  }
  if (typeof bridge.brazilianTrap === 'string') {
    return { wrong: '', right: '', explanation: bridge.brazilianTrap };
  }
  return null;
}

export function buildSynthesisData(bridge: GrammarBridgeResult): SynthesisStep['data'] {
  const trap = getTrap(bridge);
  const formula =
    bridge.structureFormulas?.[0]?.formula ?? bridge.structureFormula ?? undefined;

  return {
    insight: bridge.insight,
    survivalTip: bridge.survivalTip,
    formula,
    trap:
      trap?.wrong && trap?.right
        ? {
            wrong: trap.wrong,
            right: trap.right,
            wrongPortuguese: trap.wrongPortuguese,
            rightPortuguese: trap.rightPortuguese,
          }
        : undefined,
  };
}

export function inferChangeHint(
  left: { target: string; label: string },
  right: { target: string; label: string },
): string | undefined {
  const leftNorm = left.label.toLowerCase();
  const rightNorm = right.label.toLowerCase();
  if (leftNorm.includes('afirm') && rightNorm.includes('neg')) {
    return 'Na negação, ajuste o artigo partitivo';
  }
  if (leftNorm.includes('neg') && rightNorm.includes('afirm')) {
    return 'Na afirmação, use a forma positiva';
  }
  return undefined;
}

export function stripHighlights(text: string): string {
  return text.replace(/\^\^/g, '');
}

export function collectFormulaFallbackExamples(bridge: GrammarBridgeResult): FormulaExample[] {
  const examples: FormulaExample[] = [];
  const seen = new Set<string>();

  const push = (ex?: FormulaExample) => {
    if (!ex?.target?.trim()) return;
    const key = ex.target.trim().toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    examples.push(ex);
  };

  push(bridge.formulaExample);
  bridge.structureFormulas?.forEach((f) => push(f.example));
  push(bridge.dialogueExample);
  bridge.patterns?.forEach((p) => push(p));
  bridge.additionalExamples?.forEach((ex) => push(ex));
  if (bridge.bridge?.target && bridge.bridge?.portuguese) {
    push({
      target: stripHighlights(bridge.bridge.target),
      portuguese: stripHighlights(bridge.bridge.portuguese),
    });
  }

  return examples;
}

export function resolveFormulaStepData(bridge: GrammarBridgeResult): FormulaStep['data'] {
  const fallbacks = collectFormulaFallbackExamples(bridge);

  if (bridge.structureFormulas?.length) {
    return {
      structureFormulas: bridge.structureFormulas.map((formula, i) => ({
        ...formula,
        example: formula.example ?? fallbacks[i] ?? fallbacks[0],
      })),
    };
  }

  return {
    structureFormula: bridge.structureFormula,
    formulaExample: bridge.formulaExample ?? fallbacks[0],
  };
}
