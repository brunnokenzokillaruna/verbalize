import { getSrsIntervalDays } from '@/lib/srs';
import { isVocabularyProduced } from '@/lib/vocabKnowledgeMode';
import type { UserVocabularyDocument } from '@/types';

/** Roadmap target: produced vocabulary retains ≥15% longer intervals than passive-only. */
export const VOCAB_RETENTION_UPLIFT_GOAL = 15;

export type VocabRetentionComparison = {
  producedCount: number;
  passiveOnlyCount: number;
  avgIntervalProducedDays: number | null;
  avgIntervalPassiveDays: number | null;
  upliftPercent: number | null;
  goalMet: boolean;
  hasEnoughData: boolean;
};

function averageIntervalDays(items: UserVocabularyDocument[]): number | null {
  if (items.length === 0) return null;
  const total = items.reduce((sum, item) => sum + getSrsIntervalDays(item.srsLevel ?? 0), 0);
  return total / items.length;
}

export function computeVocabRetentionComparison(
  items: UserVocabularyDocument[],
): VocabRetentionComparison {
  const produced = items.filter(isVocabularyProduced);
  const passiveOnly = items.filter(
    (item) => !isVocabularyProduced(item) && (item.srsLevel ?? 0) >= 2,
  );

  const avgIntervalProducedDays = averageIntervalDays(produced);
  const avgIntervalPassiveDays = averageIntervalDays(passiveOnly);

  let upliftPercent: number | null = null;
  if (
    avgIntervalProducedDays !== null &&
    avgIntervalPassiveDays !== null &&
    avgIntervalPassiveDays > 0
  ) {
    upliftPercent = Math.round(
      ((avgIntervalProducedDays - avgIntervalPassiveDays) / avgIntervalPassiveDays) * 100,
    );
  }

  const hasEnoughData = produced.length >= 3 && passiveOnly.length >= 3;

  return {
    producedCount: produced.length,
    passiveOnlyCount: passiveOnly.length,
    avgIntervalProducedDays,
    avgIntervalPassiveDays,
    upliftPercent,
    goalMet: upliftPercent !== null && upliftPercent >= VOCAB_RETENTION_UPLIFT_GOAL,
    hasEnoughData,
  };
}
