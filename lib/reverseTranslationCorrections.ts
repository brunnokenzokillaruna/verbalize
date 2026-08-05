import { fixableCorrectionSegments, type CorrectionSegment } from '@/lib/reverseTranslationDiff';

export interface TranslationCorrection extends CorrectionSegment {
  /** Short PT-BR reason, when the model supplied one. */
  why?: string;
}

export interface RawModelCorrection {
  learner?: string;
  correct?: string;
  why?: string;
}

const MAX_CORRECTIONS = 5;

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[.,!?;:"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Drops entries the model invented. A "learner" span that is not in the answer
 * cannot be pointed at, and is usually a quote from the reference translation.
 */
function sanitizeModelCorrections(
  raw: RawModelCorrection[] | undefined,
  learnerAnswer: string,
): TranslationCorrection[] {
  if (!Array.isArray(raw)) return [];
  const answer = normalizeForMatch(learnerAnswer);

  return raw
    .map((entry) => ({
      learner: entry.learner?.trim() ?? '',
      correct: entry.correct?.trim() ?? '',
      why: entry.why?.trim() || undefined,
    }))
    .filter((entry) => {
      if (!entry.correct && !entry.learner) return false;
      if (!entry.learner) return true; // omission — nothing to locate
      return answer.includes(normalizeForMatch(entry.learner));
    });
}

function isCovered(
  segment: CorrectionSegment,
  corrections: TranslationCorrection[],
  feedback: string,
): boolean {
  const learner = normalizeForMatch(segment.learner);
  const correct = normalizeForMatch(segment.correct);
  const feedbackText = normalizeForMatch(feedback);

  if (learner) {
    if (feedbackText.includes(learner)) return true;
    return corrections.some((entry) => {
      const entryLearner = normalizeForMatch(entry.learner);
      return (
        entryLearner && (entryLearner.includes(learner) || learner.includes(entryLearner))
      );
    });
  }

  if (!correct) return true;
  if (feedbackText.includes(correct)) return true;
  return corrections.some((entry) => {
    const entryCorrect = normalizeForMatch(entry.correct);
    return entryCorrect && (entryCorrect.includes(correct) || correct.includes(entryCorrect));
  });
}

/**
 * Model corrections first, since they carry the reasoning, then any diff segment
 * the model failed to mention. Coverage becomes structural instead of depending
 * on the model deciding which mistakes are worth naming.
 */
export function buildTranslationCorrections(params: {
  learnerAnswer: string;
  correctedSentence: string;
  feedback: string;
  modelCorrections?: RawModelCorrection[];
}): TranslationCorrection[] {
  const modelCorrections = sanitizeModelCorrections(
    params.modelCorrections,
    params.learnerAnswer,
  );

  const segments = fixableCorrectionSegments(params.learnerAnswer, params.correctedSentence);
  const missing = segments.filter(
    (segment) => !isCovered(segment, modelCorrections, params.feedback),
  );

  if (missing.length > 0) {
    console.warn(
      `[reverseTranslation] Model skipped ${missing.length} difference(s): ${missing
        .map((segment) => `${segment.learner || '∅'} → ${segment.correct || '∅'}`)
        .join('; ')}`,
    );
  }

  return [...modelCorrections, ...missing].slice(0, MAX_CORRECTIONS);
}
