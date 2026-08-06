import type { GrammarBridgeResult, LessonTag, SupportedLanguage } from '@/types';
import { normalizeConjugationPreview } from '@/utils/conjugationHelper';
import {
  canComparePatterns,
  filterUniqueExplanation,
  shouldIncludeTransfer,
} from '@/lib/grammarBridgeDedup';
import {
  buildSynthesisData,
  getTrap,
  inferChangeHint,
  resolveFormulaStepData,
  splitConjugationSteps,
} from '@/lib/grammarBridge/helpers';
import type { StepDraft } from '@/lib/grammarBridge/types';

export function pushRegraStep(
  drafts: StepDraft[],
  bridge: GrammarBridgeResult,
  tag?: LessonTag,
): void {
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
      analogy: bridge.analogy,
      usageContext: bridge.usageContext,
      culturalNote: sacadaHasCulture ? bridge.culturalNote : undefined,
      bridge: hasBridge ? bridge.bridge : undefined,
      explanationItems,
    },
  });
}

/** Radar de erro — only after the learner understands the rule. */
export function pushCuidadoStep(drafts: StepDraft[], bridge: GrammarBridgeResult): void {
  const trap = getTrap(bridge);

  if (trap && (trap.wrong || trap.right || trap.explanation)) {
    drafts.push({
      id: 'cuidado',
      type: 'cuidado',
      label: 'Radar de erro',
      phase: 'evitar_erro',
      data: { trap },
    });
  }
}

export function pushFormulaStep(
  drafts: StepDraft[],
  bridge: GrammarBridgeResult,
  tag?: LessonTag,
): void {
  const hasFormula = Boolean(bridge.structureFormulas?.length || bridge.structureFormula);
  if (!hasFormula || tag === 'VOC' || tag === 'EXPR') return;

  drafts.push({
    id: 'formula',
    type: 'formula',
    label: 'Fórmula da estrutura',
    phase: 'estruturar',
    data: resolveFormulaStepData(bridge),
  });
}

export function pushPatternSteps(drafts: StepDraft[], bridge: GrammarBridgeResult): void {
  const patterns = bridge.patterns?.slice(0, 3) ?? [];

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
    // Third pattern (if any) as standalone after the compare pair
    if (patterns[2]) {
      drafts.push({
        id: 'pattern-2',
        type: 'pattern',
        label: patterns[2].label || 'Padrão de uso',
        phase: 'aplicar',
        data: patterns[2],
      });
    }
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

export function pushApplyBlocks(
  drafts: StepDraft[],
  bridge: GrammarBridgeResult,
  language: SupportedLanguage,
  tag?: LessonTag,
): void {
  const isVerb = tag === 'VERB';

  if (isVerb && bridge.verbSpotlight?.infinitive) {
    // verb-intro is pushed in buildGrammarSteps (compreender); conjugations + idioms here
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

  const transfers = bridge.additionalExamples?.slice(0, 2) ?? [];
  const patternTargets = (bridge.patterns ?? []).map((p) => p.target);
  const usedTargets = new Set<string>();

  transfers.forEach((transfer, i) => {
    if (!shouldIncludeTransfer(transfer, patternTargets, bridge.dialogueExample?.target)) return;
    const key = transfer.target.trim().toLowerCase();
    if (usedTargets.has(key)) return;
    usedTargets.add(key);
    drafts.push({
      id: `transfer-${i}`,
      type: 'transfer',
      label: 'Generalize',
      phase: 'aplicar',
      data: transfer,
    });
  });
}

export function pushFixarSteps(
  drafts: StepDraft[],
  bridge: GrammarBridgeResult,
  sacadaHasCulture: boolean,
  includeSynthesis = true,
): void {
  if (includeSynthesis) {
    const synthesisData = buildSynthesisData(bridge);
    const hasSynthesis = Boolean(
      synthesisData.survivalTip ||
        synthesisData.formulas?.length ||
        synthesisData.formula,
    );

    if (hasSynthesis) {
      drafts.push({
        id: 'synthesis',
        type: 'synthesis',
        label: 'Âncora',
        phase: 'fixar',
        data: synthesisData,
      });
    }
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
