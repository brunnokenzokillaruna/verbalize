/**
 * Smoke tests for collecting lesson image-match results as vocabulary reviews.
 * Run: npx tsx test-lesson-visual-reviews.ts
 */
import { collectLessonVisualReviews } from './utils/lessonVisualReviews';
import type { Exercise } from './types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`OK: ${message}`);
}

function imageMatch(word: string, correct = true): Exercise {
  return {
    type: 'image-match',
    data: {
      targetWord: word,
      translation: `${word}-pt`,
      correctWord: word,
      options: [
        { word, imageUrl: `https://img/${word}.jpg`, imageAlt: word },
        { word: `${word}-d1`, imageUrl: `https://img/${word}-d1.jpg`, imageAlt: `${word}-d1` },
        { word: `${word}-d2`, imageUrl: `https://img/${word}-d2.jpg`, imageAlt: `${word}-d2` },
        { word: `${word}-d3`, imageUrl: `https://img/${word}-d3.jpg`, imageAlt: `${word}-d3` },
      ],
    },
  };
}

const chat = imageMatch('chat');
const chien = imageMatch('chien');
const oiseau = imageMatch('oiseau');

const reviews = collectLessonVisualReviews(
  [chat, chien, oiseau],
  [chien],
);

assert(reviews.length === 3, `collects 3 visual reviews (got ${reviews.length})`);
assert(reviews[0]?.word === 'chat' && reviews[0].correct === true, 'chat counted as correct review');
assert(reviews[1]?.word === 'chien' && reviews[1].correct === false, 'chien counted as incorrect review');
assert(reviews[2]?.word === 'oiseau' && reviews[2].correct === true, 'oiseau counted as correct review');
assert(reviews[0]?.translation === 'chat-pt', 'keeps translation for create-if-missing');
assert(reviews[0]?.imageUrl === 'https://img/chat.jpg', 'keeps image URL for create-if-missing');

const deduped = collectLessonVisualReviews([chat, imageMatch('Chat')]);
assert(deduped.length === 1, 'dedupes the same target word');

console.log('\nAll lesson visual review tests passed.');
