/**
 * Smoke tests for lesson visual (image-match) exercise builder.
 * Run: npx tsx test-lesson-visual-exercises.ts
 */
import {
  buildLessonVisualExercises,
  LESSON_VISUAL_EXERCISE_COUNT,
  mergeLessonImagesIntoPool,
  MIN_VISUAL_REVIEW_ITEMS,
} from './utils/imageMatchBuilder';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`OK: ${message}`);
}

function targetsOf(
  exercises: ReturnType<typeof buildLessonVisualExercises>,
): string[] {
  return exercises.map((ex) => (ex.type === 'image-match' ? ex.data.targetWord : ''));
}

assert(LESSON_VISUAL_EXERCISE_COUNT === 5, 'lesson visual count is 5');
assert(MIN_VISUAL_REVIEW_ITEMS === 4, 'needs at least 4 imaged words');

const now = Date.UTC(2026, 7, 17, 15, 0, 0);
const yesterday = now - 86_400_000;
const threeDaysAgo = now - 3 * 86_400_000;

const pool = [
  { word: 'chat', translation: 'gato', imageUrl: 'https://img/1.jpg', srsLevel: 1, nextReviewMs: 0, lastReviewMs: threeDaysAgo },
  { word: 'chien', translation: 'cão', imageUrl: 'https://img/2.jpg', srsLevel: 2, nextReviewMs: now + 86_400_000, lastReviewMs: yesterday },
  { word: 'oiseau', translation: 'pássaro', imageUrl: 'https://img/3.jpg', srsLevel: 0, nextReviewMs: 0, lastReviewMs: threeDaysAgo },
  { word: 'maison', translation: 'casa', imageUrl: 'https://img/4.jpg', srsLevel: 3, lastReviewMs: yesterday },
  { word: 'livre', translation: 'livro', imageUrl: 'https://img/5.jpg', srsLevel: 1, nextReviewMs: 0, lastReviewMs: threeDaysAgo },
  { word: 'pain', translation: 'pão', imageUrl: 'https://img/6.jpg', srsLevel: 4, lastReviewMs: yesterday },
];

const tooSmall = buildLessonVisualExercises({
  imagePool: pool.slice(0, 3),
  count: 5,
});
assert(tooSmall.length === 0, 'returns empty when fewer than 4 images');

const built = buildLessonVisualExercises({
  imagePool: pool,
  excludeTargetWords: ['livre'],
  count: 5,
  nowMs: now,
});
assert(built.length === 5, `builds exactly 5 visual exercises (got ${built.length})`);
assert(
  built.every((ex) => ex.type === 'image-match'),
  'all exercises are image-match',
);
assert(
  new Set(targetsOf(built)).size === 5,
  'targets are unique',
);
assert(
  !targetsOf(built).includes('livre'),
  'does not use current-lesson words as targets when the bank can fill the session',
);

const reviewedTodayPool = pool.map((item, index) =>
  index < 5
    ? { ...item, lastReviewMs: now }
    : item,
);
const afterToday = buildLessonVisualExercises({
  imagePool: reviewedTodayPool,
  count: 5,
  nowMs: now,
});
assert(
  targetsOf(afterToday).every((word) => word === 'pain'),
  'skips words already reviewed today and rotates to remaining bank words',
);
assert(afterToday.length === 1, `only one unreviewed-today word remains (got ${afterToday.length})`);

const neverReviewed = buildLessonVisualExercises({
  imagePool: [
    ...pool.slice(0, 4),
    { word: 'fromage', translation: 'queijo', imageUrl: 'https://img/7.jpg', srsLevel: 0 },
  ],
  count: 1,
  nowMs: now,
});
assert(
  neverReviewed[0]?.type === 'image-match' && neverReviewed[0].data.targetWord === 'fromage',
  'prefers never-reviewed bank words as targets',
);

const merged = mergeLessonImagesIntoPool(
  [{ word: 'chat', translation: 'gato', imageUrl: 'https://img/1.jpg', srsLevel: 2, lastReviewMs: yesterday }],
  ['fromage'],
  { fromage: { imageUrl: 'https://img/new.jpg', imageAlt: 'fromage' } },
  { fromage: 'queijo' },
);
assert(
  merged.some((item) => item.word === 'fromage' && item.imageUrl === 'https://img/new.jpg'),
  'merges lesson images into the pool',
);
assert(
  merged.find((item) => item.word === 'chat')?.lastReviewMs === yesterday,
  'preserves lastReviewMs when merging',
);

console.log('\nAll lesson visual exercise tests passed.');
