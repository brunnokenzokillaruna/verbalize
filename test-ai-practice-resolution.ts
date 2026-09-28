/**
 * AI practice exercises must survive a failed or partial first load.
 * Run: npx tsx test-ai-practice-resolution.ts
 */
import { isPregenPracticePayloadComplete, PRACTICE_EXERCISE_COUNT } from './lib/practiceExercises/constants';
import { resolveAiPracticeExercises } from './lib/practiceExercises/resolveAiPracticeExercises';
import type { Exercise } from './types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`OK: ${message}`);
}

function ai(type: Exercise['type'], n: number): Exercise {
  return { type, data: { n } } as unknown as Exercise;
}

async function main() {
  const five = [1, 2, 3, 4, 5].map((n) => ai('context-choice', n));

  const kept = await resolveAiPracticeExercises(five, async () => {
    throw new Error('refetch should not run');
  }, { retryDelayMs: 0 });
  assert(kept.length === PRACTICE_EXERCISE_COUNT, 'a full AI set is kept without refetch');

  let refetchCalls = 0;
  const recovered = await resolveAiPracticeExercises(null, async () => {
    refetchCalls += 1;
    return refetchCalls === 1 ? null : five;
  }, { retryDelayMs: 0 });
  assert(recovered.length === 5, 'an empty first result is replaced by a later full set');
  assert(refetchCalls === 2, 'refetch continues until the set is full');

  const imageMatch = ai('image-match', 0);
  const stripped = await resolveAiPracticeExercises(
    [imageMatch, ...five.slice(0, 2)],
    async () => five,
    { retryDelayMs: 0, maxRefetches: 1 },
  );
  assert(
    stripped.length === 5 && stripped.every((ex) => ex.type !== 'image-match'),
    'image-match does not count toward the AI block',
  );

  const short = await resolveAiPracticeExercises(five.slice(0, 2), async () => null, {
    retryDelayMs: 0,
    maxRefetches: 1,
  });
  assert(short.length === 2, 'a partial set is kept when refetch returns nothing');

  const stillEmpty = await resolveAiPracticeExercises(null, async () => [], {
    retryDelayMs: 0,
    maxRefetches: 2,
  });
  assert(stillEmpty.length === 0, 'a fully failed load stays empty so practice does not go visual-only');

  assert(
    !isPregenPracticePayloadComplete({ exercises: five.slice(0, 3) }),
    'a ready cache with fewer than 5 exercises is incomplete',
  );
  assert(
    isPregenPracticePayloadComplete({ exercises: five }),
    'a ready cache with 5 exercises is complete',
  );
  assert(
    isPregenPracticePayloadComplete({ checkpointSession: { briefing: 'ok' } }),
    'REVIEW checkpoint cache is complete without the practice pool',
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
