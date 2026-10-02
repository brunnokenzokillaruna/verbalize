import { isUsableTeachingText, mentionsVerb } from '@/lib/grammarBridge/textClamp';
import type { LessonTag } from '@/types';

export interface RegraContentInput {
  tag?: LessonTag;
  verbInfinitive?: string;
  insight?: string;
  analogy?: string;
  usageContext?: string;
  culturalNote?: string;
  difference?: string;
  explanationItems: string[];
  hideApplyList: boolean;
}

export interface RegraContent {
  insightText: string;
  analogyText: string;
  differenceText: string;
  visibleItems: string[];
  usageContext?: string;
  culturalNote?: string;
  cultureFirst: boolean;
  /** Something worth opening. A vibe chip by itself is not a rule. */
  showRuleReveal: boolean;
  showMore: boolean;
  /** Verb insight did not name the verb, but it is the only sentence we have. */
  usedUnscopedInsight: boolean;
}

function keepVerbInsight(text: string | undefined, tag: LessonTag | undefined, infinitive?: string): string {
  const trimmed = text?.trim() ?? '';
  if (!trimmed) return '';
  if (tag === 'VERB' && !mentionsVerb(trimmed, infinitive)) return '';
  return trimmed;
}

/**
 * Decides what "A regra" can actually teach.
 * The example pair already names the verb, so the difference does not have to
 * repeat the infinitive. A social label like "Casual, Amigos" never counts as
 * the explanation behind the tap.
 */
export function resolveRegraContent(input: RegraContentInput): RegraContent {
  const scopedInsight = keepVerbInsight(input.insight, input.tag, input.verbInfinitive);
  const analogyText = isUsableTeachingText(input.analogy)
    ? keepVerbInsight(input.analogy, input.tag, input.verbInfinitive)
    : '';
  const differenceText = isUsableTeachingText(input.difference) ? input.difference!.trim() : '';

  const strictHasRule = Boolean(scopedInsight || differenceText);
  const cultureFirst =
    (input.tag === 'DIAL' || input.tag === 'CULT') && Boolean(input.culturalNote || input.usageContext);
  const visibleItems = input.hideApplyList && strictHasRule ? [] : input.explanationItems;
  const showMore = Boolean(
    analogyText || visibleItems.length > 0 || (!cultureFirst && input.culturalNote),
  );

  // Last resort: a finished sentence beats a tap that only reveals "Casual, Amigos".
  const usedUnscopedInsight =
    !strictHasRule &&
    !showMore &&
    !scopedInsight &&
    isUsableTeachingText(input.insight);
  const insightText = usedUnscopedInsight ? input.insight!.trim() : scopedInsight;

  return {
    insightText,
    analogyText,
    differenceText,
    visibleItems,
    usageContext: input.usageContext,
    culturalNote: input.culturalNote,
    cultureFirst,
    showRuleReveal: Boolean(insightText || differenceText),
    showMore,
    usedUnscopedInsight,
  };
}

/** Why a generated bridge would leave "A regra" without a real explanation. */
export function regraTeachingGap(input: RegraContentInput): string | null {
  const content = resolveRegraContent(input);
  if (!content.showRuleReveal && !content.showMore) {
    return 'A regra ficaria sem frase de explicação. usageContext é só um rótulo.';
  }
  if (content.usedUnscopedInsight) {
    return 'A sacada não cita este verbo. Reescreva insight nomeando o infinitivo ou a forma conjugada da frase.';
  }
  return null;
}
