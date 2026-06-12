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

export function canBuildImageMatch(
  target: ImageMatchCandidate,
  distractors: ImageMatchCandidate[],
  requireApproved = false,
): boolean {
  if (!target.imageUrl || distractors.length < 3) return false;
  if (!isConcreteNoun(target)) return false;
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

export function buildImageMatchFromReviewWords(
  targetWord: string,
  items: Array<{ word: string; translation: string; imageUrl?: string }>,
): Exercise | null {
  const target = items.find((i) => normalizeWord(i.word) === normalizeWord(targetWord));
  if (!target?.imageUrl) return null;

  const distractors: ImageMatchCandidate[] = items
    .filter((i) => normalizeWord(i.word) !== normalizeWord(targetWord) && i.imageUrl)
    .map((i) => ({
      word: i.word,
      imageUrl: i.imageUrl!,
      translation: i.translation,
      wordType: 'noun' as const,
    }));

  return buildImageMatchExercise(
    target.word,
    { imageUrl: target.imageUrl, imageAlt: target.word },
    target.translation,
    distractors,
  );
}
