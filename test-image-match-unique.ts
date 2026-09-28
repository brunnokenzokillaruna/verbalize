/**
 * Smoke tests: image-match options must never show the same photo twice.
 * Run: npx tsx test-image-match-unique.ts
 */
import {
  buildImageMatchExercise,
  buildImageMatchFromReviewWords,
  canonicalImageKey,
  distinctPtBrTranslation,
} from './utils/imageMatchBuilder';
import type { VocabImageResult } from './types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`OK: ${message}`);
}

assert(
  canonicalImageKey(
    'https://images.pexels.com/photos/123456/pexels-photo-123456.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  ) ===
    canonicalImageKey(
      'https://images.pexels.com/photos/123456/pexels-photo-123456.jpeg?auto=compress&cs=tinysrgb&h=350&w=500',
    ),
  'Pexels URLs with different size params map to the same photo key',
);

assert(
  canonicalImageKey('https://images.pexels.com/photos/1/a.jpeg') !==
    canonicalImageKey('https://images.pexels.com/photos/2/b.jpeg'),
  'different Pexels photo IDs stay distinct',
);

const samePhotoLarge =
  'https://images.pexels.com/photos/999001/pexels-photo-999001.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
const samePhotoSmall =
  'https://images.pexels.com/photos/999001/pexels-photo-999001.jpeg?auto=compress&cs=tinysrgb&h=350&w=500';

const pool = [
  { word: 'choisir', translation: 'escolher', imageUrl: samePhotoLarge },
  { word: 'doigt', translation: 'dedo', imageUrl: samePhotoSmall },
  { word: 'eau', translation: 'água', imageUrl: 'https://images.pexels.com/photos/111/a.jpeg?h=650' },
  { word: 'sortie', translation: 'saída', imageUrl: 'https://images.pexels.com/photos/222/b.jpeg?h=650' },
  { word: 'livre', translation: 'livro', imageUrl: 'https://images.pexels.com/photos/333/c.jpeg?h=650' },
];

const reviewExercise = buildImageMatchFromReviewWords('choisir', pool);
assert(reviewExercise !== null, 'builds review exercise when enough distinct photos exist');
assert(reviewExercise!.type === 'image-match', 'review exercise is image-match');

const reviewKeys = reviewExercise!.data.options.map((o) => canonicalImageKey(o.imageUrl));
assert(
  new Set(reviewKeys).size === reviewKeys.length,
  'review options never reuse the same Pexels photo (even with different query params)',
);
assert(
  !reviewExercise!.data.options.some((o) => o.word === 'doigt'),
  'skips distractor that shares the target photo identity',
);

const exactDupPool = [
  { word: 'chat', translation: 'gato', imageUrl: 'https://img/same.jpg' },
  { word: 'chien', translation: 'cão', imageUrl: 'https://img/same.jpg' },
  { word: 'oiseau', translation: 'pássaro', imageUrl: 'https://img/2.jpg' },
  { word: 'maison', translation: 'casa', imageUrl: 'https://img/3.jpg' },
];
assert(
  buildImageMatchFromReviewWords('chat', exactDupPool) === null,
  'returns null when fewer than 3 distractors have distinct image identities',
);

const targetImage: VocabImageResult = {
  imageUrl: samePhotoLarge,
  imageAlt: 'choisir',
};
const lessonExercise = buildImageMatchExercise(
  'choisir',
  targetImage,
  'escolher',
  [
    { word: 'doigt', imageUrl: samePhotoSmall, wordType: 'noun' },
    { word: 'eau', imageUrl: 'https://images.pexels.com/photos/111/a.jpeg?h=650', wordType: 'noun' },
    { word: 'sortie', imageUrl: 'https://images.pexels.com/photos/222/b.jpeg?h=650', wordType: 'noun' },
    { word: 'livre', imageUrl: 'https://images.pexels.com/photos/333/c.jpeg?h=650', wordType: 'noun' },
  ],
);
assert(lessonExercise !== null, 'lesson builder fills distractors with distinct photos');
assert(
  lessonExercise?.type === 'image-match' && lessonExercise.data.translation === 'escolher',
  'image-match keeps the PT-BR translation for post-answer feedback',
);
assert(distinctPtBrTranslation('Livre', 'Livro') === 'Livro', 'shows a real PT-BR translation');
assert(distinctPtBrTranslation('Livre', '  livre  ') === null, 'hides a translation that only repeats the target word');
assert(distinctPtBrTranslation('Livre', '   ') === null, 'hides an empty translation');
const lessonKeys = lessonExercise!.data.options.map((o) => canonicalImageKey(o.imageUrl));
assert(
  new Set(lessonKeys).size === lessonKeys.length,
  'lesson options never reuse the same Pexels photo',
);

console.log('\nAll image-match uniqueness tests passed.');
