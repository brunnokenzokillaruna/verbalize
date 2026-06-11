import type { GrammarBridgeResult, LessonTag, SupportedLanguage } from '@/types';
import { normalizeGrammarBridgeResult } from '@/lib/schemas/grammarBridge';
import { normalizeConjugationPreview } from '@/utils/conjugationHelper';
import {
  canComparePatterns,
  filterUniqueExplanation,
  shouldIncludeTransfer,
} from '@/lib/grammarBridgeDedup';

export type GrammarPhase = 'compreender' | 'evitar_erro' | 'estruturar' | 'aplicar' | 'fixar';

export const GRAMMAR_PHASE_LABELS: Record<GrammarPhase, string> = {
  compreender: 'Compreender',
  evitar_erro: 'Evitar erro',
  estruturar: 'Estruturar',
  aplicar: 'Aplicar',
  fixar: 'Fixar',
};

export type GrammarStepType =
  | 'regra'
  | 'cuidado'
  | 'formula'
  | 'compare'
  | 'pattern'
  | 'verb-intro'
  | 'conjugation'
  | 'idiomatic'
  | 'item'
  | 'dialogue'
  | 'transfer'
  | 'cultura'
  | 'synthesis'
  | 'quiz';

export interface GrammarStepBase {
  id: string;
  type: GrammarStepType;
  label: string;
  phase: GrammarPhase;
  phaseIndex: number;
  phaseTotal: number;
}

export interface RegraStep extends GrammarStepBase {
  type: 'regra';
  data: {
    insight: string;
    usageContext?: string;
    culturalNote?: string;
    bridge?: NonNullable<GrammarBridgeResult['bridge']>;
    explanationItems: string[];
  };
}

export interface CuidadoStep extends GrammarStepBase {
  type: 'cuidado';
  data: {
    trap: {
      wrong: string;
      right: string;
      explanation: string;
      subtitle?: string;
      wrongPortuguese?: string;
      rightPortuguese?: string;
    };
    survivalTip?: string;
  };
}

export interface FormulaStep extends GrammarStepBase {
  type: 'formula';
  data: {
    structureFormula?: string;
    structureFormulas?: Array<{ label: string; formula: string }>;
  };
}

export interface CompareStep extends GrammarStepBase {
  type: 'compare';
  data: {
    left: { label: string; target: string; portuguese: string };
    right: { label: string; target: string; portuguese: string };
    changeHint?: string;
  };
}

export interface PatternStep extends GrammarStepBase {
  type: 'pattern';
  data: { label: string; target: string; portuguese: string };
}

export interface VerbIntroStep extends GrammarStepBase {
  type: 'verb-intro';
  data: NonNullable<GrammarBridgeResult['verbSpotlight']>;
}

export interface ConjugationStep extends GrammarStepBase {
  type: 'conjugation';
  data: {
    infinitive: string;
    forms: Array<{ pronoun: string; form: string }>;
    partLabel?: string;
  };
}

export interface IdiomaticStep extends GrammarStepBase {
  type: 'idiomatic';
  data: {
    infinitive: string;
    expressions: Array<{ target: string; portuguese: string }>;
  };
}

export interface ItemStep extends GrammarStepBase {
  type: 'item';
  data: { target: string; portuguese: string; logic?: string; index: number; total: number };
}

export interface DialogueStep extends GrammarStepBase {
  type: 'dialogue';
  data: NonNullable<GrammarBridgeResult['dialogueExample']>;
}

export interface TransferStep extends GrammarStepBase {
  type: 'transfer';
  data: { target: string; portuguese: string };
}

export interface CulturaStep extends GrammarStepBase {
  type: 'cultura';
  data: { culturalNote: string };
}

export interface SynthesisStep extends GrammarStepBase {
  type: 'synthesis';
  data: {
    insight?: string;
    survivalTip?: string;
    formula?: string;
    trap?: {
      wrong: string;
      right: string;
      wrongPortuguese?: string;
      rightPortuguese?: string;
    };
  };
}

export interface QuizStep extends GrammarStepBase {
  type: 'quiz';
  data: NonNullable<GrammarBridgeResult['retentionCheck']>;
  feedback?: {
    survivalTip?: string;
    trapExplanation?: string;
  };
}

export type GrammarStep =
  | RegraStep
  | CuidadoStep
  | FormulaStep
  | CompareStep
  | PatternStep
  | VerbIntroStep
  | ConjugationStep
  | IdiomaticStep
  | ItemStep
  | DialogueStep
  | TransferStep
  | CulturaStep
  | SynthesisStep
  | QuizStep;

type StepDraft = Omit<GrammarStep, 'phaseIndex' | 'phaseTotal'>;

const FR_SINGULAR = new Set(['je', 'tu', 'il', 'elle', 'on']);
const FR_PLURAL = new Set(['nous', 'vous', 'ils', 'elles']);
const EN_SINGULAR = new Set(['I', 'you', 'he', 'she', 'it']);
const EN_PLURAL = new Set(['we', 'they']);

function attachPhaseIndices(drafts: StepDraft[]): GrammarStep[] {
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

function splitConjugationSteps(
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

function getTrap(bridge: GrammarBridgeResult) {
  if (typeof bridge.brazilianTrap === 'object' && bridge.brazilianTrap) {
    return bridge.brazilianTrap;
  }
  if (typeof bridge.brazilianTrap === 'string') {
    return { wrong: '', right: '', explanation: bridge.brazilianTrap };
  }
  return null;
}

function buildSynthesisData(bridge: GrammarBridgeResult): SynthesisStep['data'] {
  const trap = getTrap(bridge);
  const formula =
    bridge.structureFormulas?.[0]?.formula ??
    bridge.structureFormula ??
    undefined;

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

function inferChangeHint(
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

function pushRegraStep(drafts: StepDraft[], bridge: GrammarBridgeResult, tag?: LessonTag): void {
  const sacadaHasCulture = tag === 'DIAL' || tag === 'CULT';
  const hasInsight = Boolean(bridge.insight || bridge.usageContext);
  const hasBridge = Boolean(bridge.bridge?.portuguese && bridge.bridge?.target);

  if (!hasInsight && !hasBridge) return;

  const explanationItems = filterUniqueExplanation(
    bridge.insight,
    bridge.bridge?.difference,
    bridge.explanation,
  );

  drafts.push({
    id: 'regra',
    type: 'regra',
    label: 'A regra',
    phase: 'compreender',
    data: {
      insight: bridge.insight ?? '',
      usageContext: bridge.usageContext,
      culturalNote: sacadaHasCulture ? bridge.culturalNote : undefined,
      bridge: hasBridge ? bridge.bridge : undefined,
      explanationItems,
    },
  });
}

function pushCuidadoStep(drafts: StepDraft[], bridge: GrammarBridgeResult): void {
  const trap = getTrap(bridge);

  if (trap && (trap.wrong || trap.right || trap.explanation)) {
    drafts.push({
      id: 'cuidado',
      type: 'cuidado',
      label: 'Radar de erro',
      phase: 'evitar_erro',
      data: { trap, survivalTip: bridge.survivalTip },
    });
  } else if (bridge.survivalTip) {
    drafts.push({
      id: 'cuidado',
      type: 'cuidado',
      label: 'Dica de sobrevivência',
      phase: 'evitar_erro',
      data: {
        trap: { wrong: '', right: '', explanation: bridge.survivalTip },
        survivalTip: undefined,
      },
    });
  }
}

function pushFormulaStep(drafts: StepDraft[], bridge: GrammarBridgeResult, tag?: LessonTag): void {
  const hasFormula = Boolean(bridge.structureFormulas?.length || bridge.structureFormula);
  if (!hasFormula || tag === 'VOC' || tag === 'EXPR') return;

  drafts.push({
    id: 'formula',
    type: 'formula',
    label: 'Fórmula da estrutura',
    phase: 'estruturar',
    data: {
      structureFormula: bridge.structureFormula,
      structureFormulas: bridge.structureFormulas,
    },
  });
}

function pushPatternSteps(drafts: StepDraft[], bridge: GrammarBridgeResult): void {
  const patterns = bridge.patterns?.slice(0, 2) ?? [];

  if (patterns.length >= 2 && canComparePatterns(patterns)) {
    drafts.push({
      id: 'compare',
      type: 'compare',
      label: 'Compare os padrões',
      phase: 'aplicar',
      data: {
        left: patterns[0],
        right: patterns[1],
        changeHint: inferChangeHint(patterns[0], patterns[1]),
      },
    });
    return;
  }

  patterns.forEach((p, i) => {
    drafts.push({
      id: `pattern-${i}`,
      type: 'pattern',
      label: p.label || 'Padrão de uso',
      phase: 'aplicar',
      data: p,
    });
  });
}

function pushApplyBlocks(
  drafts: StepDraft[],
  bridge: GrammarBridgeResult,
  language: SupportedLanguage,
  tag?: LessonTag,
): void {
  const isVerb = tag === 'VERB';

  if (isVerb && bridge.verbSpotlight?.infinitive) {
    drafts.push({
      id: 'verb-intro',
      type: 'verb-intro',
      label: 'Verbo em destaque',
      phase: 'aplicar',
      data: bridge.verbSpotlight,
    });

    const preview = bridge.verbSpotlight.conjugationPreview
      ? normalizeConjugationPreview(bridge.verbSpotlight.conjugationPreview, language)
      : [];

    splitConjugationSteps(bridge.verbSpotlight.infinitive, preview, language).forEach(
      (part, i) => {
        drafts.push({
          id: `conjugation-${i}`,
          type: 'conjugation',
          label: part.partLabel ? `Conjugação — ${part.partLabel}` : 'Conjugação',
          phase: 'aplicar',
          data: part,
        });
      },
    );

    if (bridge.verbSpotlight.idiomaticExpressions?.length) {
      drafts.push({
        id: 'idiomatic',
        type: 'idiomatic',
        label: 'Expressões fixas',
        phase: 'aplicar',
        data: {
          infinitive: bridge.verbSpotlight.infinitive,
          expressions: bridge.verbSpotlight.idiomaticExpressions.slice(0, 2),
        },
      });
    }
  }

  if (tag !== 'VOC' && tag !== 'EXPR') {
    pushPatternSteps(drafts, bridge);
  }

  const items = bridge.items?.slice(0, 3) ?? [];
  items.forEach((item, i) => {
    drafts.push({
      id: `item-${i}`,
      type: 'item',
      label: 'Expressão chave',
      phase: 'aplicar',
      data: { ...item, index: i + 1, total: items.length },
    });
  });

  if (bridge.dialogueExample) {
    drafts.push({
      id: 'dialogue',
      type: 'dialogue',
      label: 'Frase do diálogo',
      phase: 'aplicar',
      data: bridge.dialogueExample,
    });
  }

  const transfer = bridge.additionalExamples?.[0];
  if (transfer) {
    const patternTargets = (bridge.patterns ?? []).map((p) => p.target);
    if (
      shouldIncludeTransfer(transfer, patternTargets, bridge.dialogueExample?.target)
    ) {
      drafts.push({
        id: 'transfer',
        type: 'transfer',
        label: 'Generalize',
        phase: 'aplicar',
        data: transfer,
      });
    }
  }
}

function pushFixarSteps(
  drafts: StepDraft[],
  bridge: GrammarBridgeResult,
  sacadaHasCulture: boolean,
): void {
  const synthesisData = buildSynthesisData(bridge);
  const hasSynthesis =
    synthesisData.insight ||
    synthesisData.survivalTip ||
    synthesisData.formula ||
    synthesisData.trap;

  if (hasSynthesis) {
    drafts.push({
      id: 'synthesis',
      type: 'synthesis',
      label: 'Síntese',
      phase: 'fixar',
      data: synthesisData,
    });
  }

  if (bridge.retentionCheck) {
    const trap = getTrap(bridge);
    drafts.push({
      id: 'quiz',
      type: 'quiz',
      label: 'Teste rápido',
      phase: 'fixar',
      data: bridge.retentionCheck,
      feedback: {
        survivalTip: bridge.survivalTip,
        trapExplanation: trap?.explanation,
      },
    } as StepDraft);
  } else if (bridge.culturalNote && !sacadaHasCulture) {
    drafts.push({
      id: 'cultura',
      type: 'cultura',
      label: 'Toque cultural',
      phase: 'fixar',
      data: { culturalNote: bridge.culturalNote },
    });
  }
}

/**
 * Builds a pedagogically ordered grammar journey (v2).
 * Order: regra → cuidado → formula → aplicar* → synthesis → quiz
 */
export function buildGrammarSteps(
  raw: GrammarBridgeResult,
  language: SupportedLanguage,
  tag?: LessonTag,
): GrammarStep[] {
  const bridge = normalizeGrammarBridgeResult(raw);
  if (!bridge) return [];

  const drafts: StepDraft[] = [];
  const sacadaHasCulture = tag === 'DIAL' || tag === 'CULT';
  const isVerb = tag === 'VERB';

  pushRegraStep(drafts, bridge, tag);

  if (isVerb && bridge.verbSpotlight?.infinitive) {
    drafts.push({
      id: 'verb-intro',
      type: 'verb-intro',
      label: 'Verbo em destaque',
      phase: 'compreender',
      data: bridge.verbSpotlight,
    });
  }

  pushCuidadoStep(drafts, bridge);
  pushFormulaStep(drafts, bridge, tag);

  if (isVerb && bridge.verbSpotlight?.infinitive) {
    const preview = bridge.verbSpotlight.conjugationPreview
      ? normalizeConjugationPreview(bridge.verbSpotlight.conjugationPreview, language)
      : [];

    splitConjugationSteps(bridge.verbSpotlight.infinitive, preview, language).forEach(
      (part, i) => {
        drafts.push({
          id: `conjugation-${i}`,
          type: 'conjugation',
          label: part.partLabel ? `Conjugação — ${part.partLabel}` : 'Conjugação',
          phase: 'aplicar',
          data: part,
        });
      },
    );

    if (bridge.verbSpotlight.idiomaticExpressions?.length) {
      drafts.push({
        id: 'idiomatic',
        type: 'idiomatic',
        label: 'Expressões fixas',
        phase: 'aplicar',
        data: {
          infinitive: bridge.verbSpotlight.infinitive,
          expressions: bridge.verbSpotlight.idiomaticExpressions.slice(0, 2),
        },
      });
    }

    pushPatternSteps(drafts, bridge);

    if (bridge.dialogueExample) {
      drafts.push({
        id: 'dialogue',
        type: 'dialogue',
        label: 'Frase do diálogo',
        phase: 'aplicar',
        data: bridge.dialogueExample,
      });
    }

    const transfer = bridge.additionalExamples?.[0];
    if (transfer) {
      const patternTargets = (bridge.patterns ?? []).map((p) => p.target);
      if (
        shouldIncludeTransfer(transfer, patternTargets, bridge.dialogueExample?.target)
      ) {
        drafts.push({
          id: 'transfer',
          type: 'transfer',
          label: 'Generalize',
          phase: 'aplicar',
          data: transfer,
        });
      }
    }
  } else {
    pushApplyBlocks(drafts, bridge, language, tag);
  }

  pushFixarSteps(drafts, bridge, sacadaHasCulture);

  return attachPhaseIndices(drafts);
}
