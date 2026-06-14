import type { GrammarBridgeResult, LessonTag, SupportedLanguage } from '@/types';
import { normalizeGrammarBridgeResult } from '@/lib/schemas/grammarBridge';
import { normalizeConjugationPreview } from '@/utils/conjugationHelper';
import { shouldIncludeTransfer } from '@/lib/grammarBridgeDedup';
import { attachPhaseIndices, splitConjugationSteps } from '@/lib/grammarBridge/helpers';
import {
  pushApplyBlocks,
  pushCuidadoStep,
  pushFixarSteps,
  pushFormulaStep,
  pushPatternSteps,
  pushRegraStep,
} from '@/lib/grammarBridge/stepBuilders';
import type { GrammarStep, StepDraft } from '@/lib/grammarBridge/types';

/**
 * Builds a pedagogically ordered grammar journey (v2).
 * Order: regra → cuidado → formula → aplicar* → synthesis → quiz
 */
export function buildGrammarSteps(
  raw: GrammarBridgeResult,
  language: SupportedLanguage,
  tag?: LessonTag,
): GrammarStep[] {
  const bridge = normalizeGrammarBridgeResult(raw, language);
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
      if (shouldIncludeTransfer(transfer, patternTargets, bridge.dialogueExample?.target)) {
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
