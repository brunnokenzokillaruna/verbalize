import type { Exercise, HookResult, ImageMatchData, VocabImageResult } from '@/types';

export interface ImageMatchCandidate {
  word: string;
  imageUrl: string;
  imageAlt?: string;
  translation?: string;
  semanticField?: string;
  wordType?: 'verb' | 'noun';
  approved?: boolean;
}

const ABSTRACT_PATTERN = /^(toujours|jamais|très|bien|mal|peut|être|avoir|faire|aller)$/i;

function normalizeWord(w: string): string {
  return w.trim().toLowerCase();
}

function isConcreteNoun(candidate: ImageMatchCandidate): boolean {
  if (candidate.wordType === 'verb') return false;
  if (ABSTRACT_PATTERN.test(normalizeWord(candidate.word))) return false;
  return true;
}

function uniqueUrls(options: ImageMatchCandidate[]): boolean {
  const urls = options.map((o) => o.imageUrl);
  return new Set(urls).size === urls.length;
}

function uniqueSemanticFields(fields: (string | undefined)[]): boolean {
  const normalized = fields.filter(Boolean).map((f) => f!.toLowerCase());
  if (normalized.length < 2) return true;
  return new Set(normalized).size === normalized.length;
}

function shuffleInPlace<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function pickUniqueImageDistractors(
  targetUrl: string,
  candidates: ImageMatchCandidate[],
  count = 3,
): ImageMatchCandidate[] {
  const picked: ImageMatchCandidate[] = [];
  const usedUrls = new Set<string>([targetUrl]);

  for (const candidate of shuffleInPlace([...candidates])) {
    if (usedUrls.has(candidate.imageUrl)) continue;
    usedUrls.add(candidate.imageUrl);
    picked.push(candidate);
    if (picked.length >= count) break;
  }

  return picked;
}

type CanBuildImageMatchOptions = {
  requireApproved?: boolean;
  requireConcrete?: boolean;
};

export function canBuildImageMatch(
  target: ImageMatchCandidate,
  distractors: ImageMatchCandidate[],
  options: boolean | CanBuildImageMatchOptions = {},
): boolean {
  const opts: CanBuildImageMatchOptions =
    typeof options === 'boolean' ? { requireApproved: options } : options;
  const { requireApproved = false, requireConcrete = true } = opts;

  if (!target.imageUrl || distractors.length < 3) return false;
  if (requireConcrete && !isConcreteNoun(target)) return false;
  if (requireApproved && !target.approved) return false;

  const all = [target, ...distractors.slice(0, 3)];
  if (!all.every((c) => c.imageUrl)) return false;
  if (!uniqueUrls(all)) return false;

  const fields = all.map((c) => c.semanticField);
  if (fields.filter(Boolean).length >= 2 && !uniqueSemanticFields(fields)) {
    return false;
  }

  return true;
}

export function buildImageMatchExercise(
  targetWord: string,
  targetImage: VocabImageResult,
  translation: string,
  distractorCandidates: ImageMatchCandidate[],
  hook?: HookResult | null,
  contextSentence?: string,
): Exercise | null {
  const hookOptions = hook?.imageMatchOptions?.[normalizeWord(targetWord)];

  let distractors: ImageMatchCandidate[] = [];

  if (hookOptions?.distractors?.length) {
    distractors = hookOptions.distractors
      .map((word, i) => {
        const match = distractorCandidates.find(
          (c) => normalizeWord(c.word) === normalizeWord(word),
        );
        if (!match?.imageUrl) return null;
        return {
          ...match,
          semanticField: hookOptions.semanticFields?.[i],
        };
      })
      .filter(Boolean) as ImageMatchCandidate[];
  }

  if (distractors.length < 3) {
    distractors = distractorCandidates
      .filter(
        (c) =>
          normalizeWord(c.word) !== normalizeWord(targetWord) &&
          c.imageUrl &&
          isConcreteNoun(c),
      )
      .slice(0, 3);
  }

  const target: ImageMatchCandidate = {
    word: targetWord,
    imageUrl: targetImage.imageUrl,
    imageAlt: targetImage.imageAlt,
    translation,
    semanticField: hookOptions?.semanticFields?.[0],
    wordType: 'noun',
  };

  if (!canBuildImageMatch(target, distractors)) return null;

  const picked = distractors.slice(0, 3);
  const options = [target, ...picked].map((c) => ({
    word: c.word,
    imageUrl: c.imageUrl,
    imageAlt: c.imageAlt ?? c.word,
  }));

  // Shuffle options
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  const data: ImageMatchData = {
    targetWord,
    translation,
    contextSentence,
    correctWord: targetWord,
    options,
  };

  return { type: 'image-match', data };
}

export function buildImageMatchFromLessonVocab(params: {
  hook: HookResult;
  vocabImages: Record<string, VocabImageResult | null>;
  vocabTranslations: Record<string, string>;
  preferWord?: string;
}): Exercise | null {
  const { hook, vocabImages, vocabTranslations, preferWord } = params;

  const candidates: ImageMatchCandidate[] = hook.newVocabulary.map((word) => ({
    word,
    imageUrl: vocabImages[word]?.imageUrl ?? '',
    imageAlt: vocabImages[word]?.imageAlt,
    translation: vocabTranslations[word],
    wordType: word === hook.verbWord ? 'verb' : 'noun',
  }));

  const targetWord =
    preferWord ??
    hook.newVocabulary.find(
      (w) => vocabImages[w]?.imageUrl && w !== hook.verbWord,
    );

  if (!targetWord || !vocabImages[targetWord]?.imageUrl) return null;

  return buildImageMatchExercise(
    targetWord,
    vocabImages[targetWord]!,
    vocabTranslations[targetWord] ?? targetWord,
    candidates.filter((c) => c.word !== targetWord),
    hook,
  );
}

export const MIN_VISUAL_REVIEW_ITEMS = 4;

export function getVisualReviewPlayableItems<
  T extends { word: string; translation: string; imageUrl?: string },
>(
  sessionItems: T[],
  imagePool: Array<{ word: string; translation: string; imageUrl?: string }>,
): T[] {
  return sessionItems.filter(
    (item) => buildImageMatchFromReviewWords(item.word, imagePool) !== null,
  );
}

export function buildImageMatchFromReviewWords(
  targetWord: string,
  imagePool: Array<{ word: string; translation: string; imageUrl?: string }>,
): Exercise | null {
  const withImages = imagePool.filter((item) => item.imageUrl);
  const target = withImages.find((item) => normalizeWord(item.word) === normalizeWord(targetWord));
  if (!target?.imageUrl) return null;

  const distractorCandidates: ImageMatchCandidate[] = withImages
    .filter((item) => normalizeWord(item.word) !== normalizeWord(targetWord))
    .map((item) => ({
      word: item.word,
      imageUrl: item.imageUrl!,
      imageAlt: item.word,
      translation: item.translation,
      wordType: 'noun' as const,
    }));

  const picked = pickUniqueImageDistractors(target.imageUrl, distractorCandidates, 3);
  if (picked.length < 3) return null;

  const targetCandidate: ImageMatchCandidate = {
    word: target.word,
    imageUrl: target.imageUrl,
    imageAlt: target.word,
    translation: target.translation,
    wordType: 'noun',
  };

  if (!canBuildImageMatch(targetCandidate, picked, { requireConcrete: false })) return null;

  const options = [targetCandidate, ...picked].map((candidate) => ({
    word: candidate.word,
    imageUrl: candidate.imageUrl,
    imageAlt: candidate.imageAlt ?? candidate.word,
  }));

  shuffleInPlace(options);

  const data: ImageMatchData = {
    targetWord: target.word,
    translation: target.translation,
    correctWord: target.word,
    options,
  };

  return { type: 'image-match', data };
}

/** How many visual (image-match) drills to append after AI lesson practice. */
export const LESSON_VISUAL_EXERCISE_COUNT = 5;

export type VocabImagePoolItem = {
  word: string;
  translation: string;
  imageUrl?: string;
  srsLevel?: number;
  /** Epoch ms — used to prefer due review words. */
  nextReviewMs?: number;
  /** Epoch ms — used to skip words already reviewed today. */
  lastReviewMs?: number;
};

function isSameLocalDay(ms: number, nowMs: number): boolean {
  const a = new Date(ms);
  const b = new Date(nowMs);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function visualReviewScore(item: VocabImagePoolItem, nowMs: number): number {
  const neverReviewed = item.lastReviewMs == null ? 1 : 0;
  const due = item.nextReviewMs != null && item.nextReviewMs <= nowMs ? 1 : 0;
  const srs = item.srsLevel ?? 0;
  const recency = item.lastReviewMs ?? 0;
  return neverReviewed * 1_000_000 + due * 10_000 - srs - recency / 1e13 + Math.random() * 0.01;
}

/**
 * Merge lesson-fetched images into the user's imaged vocabulary pool
 * so new words from this lesson can be visual targets/distractors.
 */
export function mergeLessonImagesIntoPool(
  pool: VocabImagePoolItem[],
  words: string[],
  vocabImages: Record<string, VocabImageResult | null>,
  vocabTranslations: Record<string, string>,
): VocabImagePoolItem[] {
  const byWord = new Map<string, VocabImagePoolItem>();
  for (const item of pool) {
    byWord.set(normalizeWord(item.word), item);
  }

  for (const word of words) {
    const image = vocabImages[word];
    if (!image?.imageUrl) continue;
    const key = normalizeWord(word);
    const existing = byWord.get(key);
    byWord.set(key, {
      word: existing?.word ?? word,
      translation: vocabTranslations[word] ?? existing?.translation ?? word,
      imageUrl: image.imageUrl,
      srsLevel: existing?.srsLevel ?? 0,
      nextReviewMs: existing?.nextReviewMs,
      lastReviewMs: existing?.lastReviewMs,
    });
  }

  return [...byWord.values()];
}

/**
 * Build up to `count` image-match exercises for lesson practice (vocab review).
 * Rotates through bank words that are not yet reviewed today. Current-lesson words
 * are kept as distractors and only used as targets if the bank cannot fill the session.
 * Needs ≥4 distinct images in the pool for distractors.
 */
export function buildLessonVisualExercises(params: {
  imagePool: VocabImagePoolItem[];
  /** @deprecated Use excludeTargetWords — current-lesson words should not consume review slots. */
  preferWords?: string[];
  excludeTargetWords?: string[];
  count?: number;
  nowMs?: number;
}): Exercise[] {
  const count = params.count ?? LESSON_VISUAL_EXERCISE_COUNT;
  const now = params.nowMs ?? Date.now();
  const pool = params.imagePool.filter((item) => item.imageUrl);
  if (pool.length < MIN_VISUAL_REVIEW_ITEMS || count <= 0) return [];

  const excludeSet = new Set(
    [...(params.excludeTargetWords ?? []), ...(params.preferWords ?? [])].map(normalizeWord),
  );

  const notReviewedToday = pool.filter(
    (item) => item.lastReviewMs == null || !isSameLocalDay(item.lastReviewMs, now),
  );

  const rankItems = (items: VocabImagePoolItem[]) =>
    items
      .map((item) => ({ item, score: visualReviewScore(item, now) }))
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item);

  const primary = rankItems(
    notReviewedToday.filter((item) => !excludeSet.has(normalizeWord(item.word))),
  );
  const fillers = rankItems(
    notReviewedToday.filter((item) => excludeSet.has(normalizeWord(item.word))),
  );

  const exercises: Exercise[] = [];
  const usedTargets = new Set<string>();

  for (const item of [...primary, ...fillers]) {
    if (exercises.length >= count) break;
    const key = normalizeWord(item.word);
    if (usedTargets.has(key)) continue;
    const exercise = buildImageMatchFromReviewWords(item.word, pool);
    if (!exercise) continue;
    usedTargets.add(key);
    exercises.push(exercise);
  }

  return exercises;
}
