import type { Exercise } from '@/types';

export type LessonVisualReview = {
  word: string;
  correct: boolean;
  translation: string;
  imageUrl?: string;
};

function normalizeWord(word: string): string {
  return word.trim().toLowerCase();
}

/**
 * Collects image-match practice results so they can be persisted as vocabulary reviews.
 * A target is incorrect if it appears in the lesson mistake list.
 */
export function collectLessonVisualReviews(
  exercises: Exercise[],
  mistakes: Exercise[] = [],
): LessonVisualReview[] {
  const missed = new Set(
    mistakes
      .filter((item) => item.type === 'image-match')
      .map((item) => normalizeWord(item.data.targetWord)),
  );

  const seen = new Set<string>();
  const reviews: LessonVisualReview[] = [];

  for (const exercise of exercises) {
    if (exercise.type !== 'image-match') continue;
    const word = exercise.data.targetWord;
    const key = normalizeWord(word);
    if (!key || seen.has(key)) continue;
    seen.add(key);

    const correctOption = exercise.data.options.find(
      (option) => normalizeWord(option.word) === normalizeWord(exercise.data.correctWord),
    );

    reviews.push({
      word,
      correct: !missed.has(key),
      translation: exercise.data.translation || word,
      imageUrl: correctOption?.imageUrl,
    });
  }

  return reviews;
}
