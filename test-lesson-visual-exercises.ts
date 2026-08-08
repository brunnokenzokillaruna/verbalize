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

assert(LESSON_VISUAL_EXERCISE_COUNT === 5, 'lesson visual count is 5');
assert(MIN_VISUAL_REVIEW_ITEMS === 4, 'needs at least 4 imaged words');

const pool = [
  { word: 'chat', translation: 'gato', imageUrl: 'https://img/1.jpg', srsLevel: 1, nextReviewMs: 0 },
  { word: 'chien', translation: 'cão', imageUrl: 'https://img/2.jpg', srsLevel: 2, nextReviewMs: Date.now() + 86_400_000 },
  { word: 'oiseau', translation: 'pássaro', imageUrl: 'https://img/3.jpg', srsLevel: 0, nextReviewMs: 0 },
  { word: 'maison', translation: 'casa', imageUrl: 'https://img/4.jpg', srsLevel: 3 },
  { word: 'livre', translation: 'livro', imageUrl: 'https://img/5.jpg', srsLevel: 1, nextReviewMs: 0 },
  { word: 'pain', translation: 'pão', imageUrl: 'https://img/6.jpg', srsLevel: 4 },
];

const tooSmall = buildLessonVisualExercises({
  imagePool: pool.slice(0, 3),
  count: 5,
});
assert(tooSmall.length === 0, 'returns empty when fewer than 4 images');

const built = buildLessonVisualExercises({
  imagePool: pool,
  preferWords: ['livre'],
  count: 5,
  nowMs: Date.now(),
});
assert(built.length === 5, `builds exactly 5 visual exercises (got ${built.length})`);
assert(
  built.every((ex) => ex.type === 'image-match'),
  'all exercises are image-match',
);
assert(
  new Set(built.map((ex) => (ex.type === 'image-match' ? ex.data.targetWord : ''))).size === 5,
  'targets are unique',
);

const preferFirst = buildLessonVisualExercises({
  imagePool: pool,
  preferWords: ['livre'],
  count: 1,
  nowMs: Date.now(),
});
assert(
  preferFirst[0]?.type === 'image-match' && preferFirst[0].data.targetWord === 'livre',
  'prefers lesson vocabulary words as targets',
);

const merged = mergeLessonImagesIntoPool(
  [{ word: 'chat', translation: 'gato', imageUrl: 'https://img/1.jpg', srsLevel: 2 }],
  ['fromage'],
  { fromage: { imageUrl: 'https://img/new.jpg', imageAlt: 'fromage' } },
  { fromage: 'queijo' },
);
assert(
  merged.some((item) => item.word === 'fromage' && item.imageUrl === 'https://img/new.jpg'),
  'merges lesson images into the pool',
);

console.log('\nAll lesson visual exercise tests passed.');
