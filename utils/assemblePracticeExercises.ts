import type { Exercise, LessonTag } from '@/types';
import { enforceVariety, pinTagExclusiveFirst } from '@/utils/exerciseVariety';

const TAG_EXCLUSIVE: Partial<Record<LessonTag, Exercise['type']>> = {
  GRAM: 'grammar-trap',
  PRON: 'minimal-pair',
  VERB: 'conjugation-speed',
};

export function skipGrammarTrapIfQuizPassed(
  exercises: Exercise[],
  tag: LessonTag,
  bridgeQuizPassed: boolean,
): Exercise[] {
  if (!bridgeQuizPassed || tag !== 'GRAM') return exercises;
  const idx = exercises.findIndex((e) => e.type === 'grammar-trap');
  if (idx !== 0) return exercises;
  const result = [...exercises];
  result.splice(idx, 1);
  return result;
}

export function injectImageMatchIntoPool(
  exercises: Exercise[],
  imageMatch: Exercise | null,
): Exercise[] {
  if (!imageMatch || imageMatch.type !== 'image-match') return exercises;

  const hasImageMatch = exercises.some((e) => e.type === 'image-match');
  if (hasImageMatch) return exercises;

  const result = [...exercises];
  const replaceIdx = result.findIndex(
    (e, i) => i > 0 && e.type === 'context-choice',
  );
  if (replaceIdx >= 0) {
    result[replaceIdx] = imageMatch;
  } else if (result.length < 6) {
    result.push(imageMatch);
  }
  return result;
}

export function assemblePracticeSession(
  aiExercises: Exercise[],
  clientExercises: Exercise[],
  tag: LessonTag,
  bridgeQuizPassed: boolean,
): Exercise[] {
  const tagExclusive = TAG_EXCLUSIVE[tag] ?? null;

  let merged = [...aiExercises, ...clientExercises];
  merged = skipGrammarTrapIfQuizPassed(merged, tag, bridgeQuizPassed);
  merged = pinTagExclusiveFirst(merged, tagExclusive);

  const types = new Set(merged.map((e) => e.type));
  merged = enforceVariety(merged, [...types] as Exercise['type'][], tagExclusive);

  return merged;
}
