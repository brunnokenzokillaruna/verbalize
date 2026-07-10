import { callGemini } from '@/services/gemini';
import { sanitizeVocabularyToken } from '@/lib/hookSanitize';
import { normalizeWord } from '@/lib/wordTooltipUtils';
import type { SupportedLanguage } from '@/types';

const LANG_LABEL: Record<SupportedLanguage, string> = {
  fr: 'French',
  en: 'English',
};

const STOP_WORDS = new Set([
  'isolated',
  'white',
  'background',
  'neutral',
  'the',
  'and',
  'for',
  'with',
  'uma',
  'um',
  'de',
  'da',
  'do',
]);

export interface PexelsPhotoCandidate {
  imageUrl: string;
  photographer: string;
  alt: string;
}

function tokenizeMeaning(text: string): string[] {
  return normalizeWord(text)
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function isPlaceholderTranslation(word: string, translation: string | undefined): boolean {
  if (!translation?.trim()) return true;
  return normalizeWord(word) === normalizeWord(translation);
}

export function scorePhotoCandidate(
  photo: PexelsPhotoCandidate,
  keyword: string,
  translation?: string,
): number {
  const altTokens = tokenizeMeaning(photo.alt || '');
  const keywordTokens = tokenizeMeaning(keyword);
  const translationTokens = translation ? tokenizeMeaning(translation) : [];
  const targets = [...new Set([...keywordTokens, ...translationTokens])];
  if (targets.length === 0) return photo.alt ? 1 : 0;

  let score = 0;
  for (const target of targets) {
    if (altTokens.some((alt) => alt.includes(target) || target.includes(alt))) {
      score += 2;
    }
  }

  if (photo.alt.trim()) score += 1;
  return score;
}

export async function buildVisualSearchKeyword(
  word: string,
  language: SupportedLanguage,
  translation?: string,
  sentence?: string,
  precomputedKeyword?: string,
): Promise<string> {
  if (precomputedKeyword?.trim()) return precomputedKeyword.trim();

  const cleanWord = sanitizeVocabularyToken(word);
  const meaning = translation && !isPlaceholderTranslation(cleanWord, translation)
    ? translation.trim()
    : undefined;

  const prompt = `Generate ONE precise English search query for the Pexels stock photo library.

Target word: "${cleanWord}" (${LANG_LABEL[language]})
${meaning ? `Portuguese meaning for a Brazilian learner: "${meaning}"` : ''}
${sentence ? `Example sentence: "${sentence.slice(0, 180)}"` : ''}

Rules:
- The photo MUST visually represent the word's meaning (object, place, action, or concept).
- Use concrete English nouns/adjectives (e.g. "green lawn grass", "church bell tower", "red apple isolated").
- NEVER use the ${LANG_LABEL[language]} word itself in the query unless it is also common English.
- Prefer a single clear subject on a neutral background.
- Output ONLY the search query string.`;

  try {
    const keyword = (await callGemini(prompt, undefined, 120, 0, 'lightweight')).trim();
    if (keyword) return keyword;
  } catch (err) {
    console.warn('[vocabImageSearch] Gemini keyword failed:', err);
  }

  if (meaning) return `${meaning} isolated white background`;
  return `${cleanWord} isolated white background`;
}

export async function validatePhotoMatchesVocab(
  word: string,
  language: SupportedLanguage,
  translation: string | undefined,
  keyword: string,
  photo: PexelsPhotoCandidate,
): Promise<boolean> {
  const meaning = translation && !isPlaceholderTranslation(word, translation)
    ? translation
    : '(unknown)';

  const prompt = `You validate vocabulary flashcard images.

Word: "${word}" (${LANG_LABEL[language]})
Portuguese meaning: "${meaning}"
Pexels search query used: "${keyword}"
Pexels alt text: "${photo.alt || '(empty)'}"

Should this photo be shown to a learner for this word?
Reply ONLY "yes" or "no".

Say "no" if the image is unrelated (e.g. a hand, random person, wrong object) or only loosely connected.`;

  try {
    const answer = (await callGemini(prompt, undefined, 16, 0, 'lightweight')).trim().toLowerCase();
    return answer.startsWith('y');
  } catch (err) {
    console.warn('[vocabImageSearch] Gemini validation failed — using score fallback:', err);
    return scorePhotoCandidate(photo, keyword, translation) >= 2;
  }
}

export async function pickValidatedPhoto(
  candidates: PexelsPhotoCandidate[],
  word: string,
  language: SupportedLanguage,
  keyword: string,
  translation?: string,
  excludeUrls: string[] = [],
): Promise<PexelsPhotoCandidate | null> {
  const filtered = candidates.filter((photo) => !excludeUrls.includes(photo.imageUrl));
  if (filtered.length === 0) return null;

  const ranked = [...filtered].sort(
    (a, b) => scorePhotoCandidate(b, keyword, translation) - scorePhotoCandidate(a, keyword, translation),
  );

  const topCandidates = ranked.slice(0, 3);
  for (const photo of topCandidates) {
    const score = scorePhotoCandidate(photo, keyword, translation);
    if (score >= 4) return photo;
    const ok = await validatePhotoMatchesVocab(word, language, translation, keyword, photo);
    if (ok) return photo;
  }

  const best = ranked[0];
  if (best && scorePhotoCandidate(best, keyword, translation) >= 2) {
    return best;
  }

  return null;
}
