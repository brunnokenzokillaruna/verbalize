/**
 * Smoke tests for SRS interval math.
 * Run: npx tsx test-srs.ts
 */
import { calculateNextReview, getSrsIntervalDays } from './lib/srs';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`OK: ${message}`);
}

const fromZero = calculateNextReview(0, true);
assert(fromZero.newLevel === 1, 'correct at level 0 → 1');
assert(fromZero.nextReview instanceof Date && !Number.isNaN(fromZero.nextReview.getTime()), 'nextReview is a valid Date');

const fromUndefined = calculateNextReview(undefined as unknown as number, true);
assert(fromUndefined.newLevel === 1, 'undefined srsLevel is treated as 0');
assert(!Number.isNaN(fromUndefined.nextReview.getTime()), 'undefined srsLevel still yields a valid nextReview');

const fromNaN = calculateNextReview(Number.NaN, false);
assert(fromNaN.newLevel === 0, 'NaN srsLevel is treated as 0');
assert(!Number.isNaN(fromNaN.nextReview.getTime()), 'NaN srsLevel still yields a valid nextReview');

assert(getSrsIntervalDays(1) === 3, 'level 1 interval is 3 days');

console.log('\nAll SRS tests passed.');
