import type { GrammarBridgeResult, LessonTag, SupportedLanguage } from '@/types';
import { normalizeGrammarBridgeResult } from '@/lib/schemas/grammarBridge';
import { shouldIncludeSynthesis } from '@/lib/grammarBridgeDedup';
import { attachPhaseIndices } from '@/lib/grammarBridge/helpers';
import {
  pushApplyBlocks,
  pushCuidadoStep,
  pushFixarSteps,
  pushFormulaStep,
  pushRegraStep,
} from '@/lib/grammarBridge/stepBuilders';
import type { GrammarStep, StepDraft } from '@/lib/grammarBridge/types';

/**
 * Pedagogical journey v3:
 * regra → formula → aplicar* → cuidado → âncora → quiz
 * (Understand → structure → apply → avoid error → anchor → produce)
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

  // Verb intro stays in compreender (mental model) before structuring
  if (isVerb && bridge.verbSpotlight?.infinitive) {
    drafts.push({
      id: 'verb-intro',
      type: 'verb-intro',
      label: 'Verbo em destaque',
      phase: 'compreender',
      data: bridge.verbSpotlight,
    });
  }

  pushFormulaStep(drafts, bridge, tag);
  pushApplyBlocks(drafts, bridge, language, tag);
  pushCuidadoStep(drafts, bridge);

  const includeSynthesis = shouldIncludeSynthesis(bridge);
  pushFixarSteps(drafts, bridge, sacadaHasCulture, includeSynthesis);

  return attachPhaseIndices(drafts);
}
