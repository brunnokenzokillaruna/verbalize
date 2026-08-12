import type { Exercise, LessonTag, ProficiencyLevel } from '@/types';
import { getTagExclusiveType, PRACTICE_EXERCISE_COUNT } from '@/lib/practiceExercises/constants';
import { sessionHasProduction } from '@/lib/practiceExercises/productionTypes';
import { devLog } from '@/lib/devLog';
import { pinTagExclusiveFirst } from '@/utils/exerciseVariety';

export function skipGrammarTrapIfQuizPassed(
  exercises: Exercise[],
  _tag: LessonTag,
  _bridgeQuizPassed: boolean,
): Exercise[] {
  // Always return full AI exercises array (5 exercises) so total session has 5 AI + 5 visual = 10 exercises.
  return exercises;
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
  } else if (result.length < PRACTICE_EXERCISE_COUNT + 1) {
    result.push(imageMatch);
  }
  return result;
}

export function assemblePracticeSession(
  aiExercises: Exercise[],
  clientExercises: Exercise[],
  tag: LessonTag,
  bridgeQuizPassed: boolean,
  level?: ProficiencyLevel,
): Exercise[] {
  const tagExclusive = getTagExclusiveType(tag, level);

  let merged = [...aiExercises];
  merged = skipGrammarTrapIfQuizPassed(merged, tag, bridgeQuizPassed);
  merged = pinTagExclusiveFirst(merged, tagExclusive);

  for (const clientEx of clientExercises) {
    if (clientEx.type === 'image-match') {
      merged = injectImageMatchIntoPool(merged, clientEx);
    } else {
      merged.push(clientEx);
    }
  }

  if (merged.length > PRACTICE_EXERCISE_COUNT) {
    merged = merged.slice(0, PRACTICE_EXERCISE_COUNT);
  }

  if (!sessionHasProduction(merged)) {
    devLog(`[assemblePracticeSession] Warning: merged session has no production exercise (tag=${tag})`);
  }

  return merged;
}
