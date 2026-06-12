'use server';

import { callGeminiJSON } from '@/services/gemini';
import { REVIEW_SESSION_SIZE } from '@/utils/reviewSession';
import type { Exercise, SupportedLanguage, ProficiencyLevel } from '@/types';

const LANG_LABEL: Record<SupportedLanguage, string> = {
  fr: 'French',
  en: 'English',
};

export interface VocabReviewItem {
  word: string;
  exercise: Exercise;
}

interface GenerateVocabReviewParams {
  words: Array<{ word: string; translation: string; imageUrl?: string }>;
  language: SupportedLanguage;
  level: ProficiencyLevel;
  knownVocabulary?: string[];
}

type ReviewExerciseKind =
  | 'context-choice'
  | 'reverse-translation'
  | 'word-bank-translation';

function pickReviewType(
  index: number,
  word: { imageUrl?: string },
  level: ProficiencyLevel,
): ReviewExerciseKind {
  const cycle: ReviewExerciseKind[] =
    level === 'A1'
      ? ['context-choice', 'context-choice', 'reverse-translation']
      : ['context-choice', 'reverse-translation', 'word-bank-translation'];
  return cycle[index % cycle.length];
}

/**
 * Generates one spaced-repetition exercise per vocabulary word (up to 8 words per session).
 * Cycles context-choice, reverse-translation, and word-bank-translation by level.
 */
export async function generateVocabReview(
  params: GenerateVocabReviewParams,
): Promise<VocabReviewItem[] | null> {
  const { words, language, level, knownVocabulary } = params;
  const langLabel = LANG_LABEL[language];

  const reviewWords = words.slice(0, REVIEW_SESSION_SIZE);

  const isEarlyLearner = !knownVocabulary || knownVocabulary.length < 30;
  const vocabConstraint = isEarlyLearner
    ? `All sentences must use simple A1-level everyday vocabulary only.`
    : `Prefer using words the learner already knows: [${knownVocabulary!.slice(-80).join(', ')}].`;

  const exerciseDescriptions = reviewWords
    .map((w, i) => {
      const type = pickReviewType(i, w, level);
      if (type === 'context-choice') {
        return `Item ${i + 1} — word: "${w.word}" (PT: ${w.translation}) — type "context-choice"
- Write an ORIGINAL ${langLabel} sentence where "${w.word}" is the key word
- "sentence": replace "${w.word}" with ___
- "blankWord": "${w.word}"
- "options": 4 items — "${w.word}" + 3 highly plausible distractors (same grammatical category or semantic field, but clearly wrong in this sentence context)
- "translation": Brazilian Portuguese translation of the full sentence`;
      }
      if (type === 'word-bank-translation') {
        return `Item ${i + 1} — word: "${w.word}" (PT: ${w.translation}) — type "word-bank-translation"
- "portuguese_sentence": natural PT-BR sentence whose ${langLabel} translation uses "${w.word}"
- "correctOrder": array of ${langLabel} words in correct order (must include "${w.word}")
- "words": same words as correctOrder, shuffled
- "acceptable_variants": [] or 1 alternative order`;
      }
      return `Item ${i + 1} — word: "${w.word}" (PT: ${w.translation}) — type "reverse-translation"
- "portuguese_sentence": natural PT-BR sentence whose correct ${langLabel} translation uses "${w.word}"
- "target_translation": ${langLabel} sentence containing "${w.word}"
- "acceptable_variants": 1-2 alternative phrasings (or [])`;
    })
    .join('\n\n');

  const jsonTemplate = reviewWords
    .map((w, i) => {
      const type = pickReviewType(i, w, level);
      if (type === 'context-choice') {
        return `  {"word":"${w.word}","exercise":{"type":"context-choice","data":{"sentence":"sentence with ___","blankWord":"${w.word}","options":["${w.word}","distractor1","distractor2","distractor3"],"translation":"PT translation"}}}`;
      }
      if (type === 'word-bank-translation') {
        return `  {"word":"${w.word}","exercise":{"type":"word-bank-translation","data":{"portuguese_sentence":"PT sentence","correctOrder":["word1","${w.word}"],"words":["${w.word}","word1"],"acceptable_variants":[]}}}`;
      }
      return `  {"word":"${w.word}","exercise":{"type":"reverse-translation","data":{"portuguese_sentence":"PT sentence","target_translation":"${langLabel} sentence with ${w.word}","acceptable_variants":[]}}}`;
    })
    .join(',\n');

  try {
    const systemPrompt = `You are a vocabulary review exercise generator for Brazilian Portuguese speakers learning ${langLabel}. Respond with ONLY a valid JSON array, no markdown, no explanation.`;

    const prompt = `Generate ${reviewWords.length} spaced-repetition review exercises at level ${level}.
${vocabConstraint}

${exerciseDescriptions}

Output a JSON array with exactly ${reviewWords.length} objects, each with "word" and "exercise" keys:
[
${jsonTemplate}
]`;

    const result = await callGeminiJSON<VocabReviewItem[]>(prompt, systemPrompt, 2048);

    if (!Array.isArray(result) || result.length === 0) {
      console.error('[generateVocabReview] Unexpected response shape');
      return null;
    }

    const validated = result.filter((item) => {
      if (!item.word || !item.exercise?.type || !item.exercise?.data) return false;
      if (item.exercise.type === 'context-choice') {
        const d = item.exercise.data as { sentence?: string; blankWord?: string; options?: string[] };
        return !!d.sentence?.includes('___') && !!d.blankWord && Array.isArray(d.options) && d.options.length >= 2;
      }
      if (item.exercise.type === 'reverse-translation') {
        const d = item.exercise.data as {
          portuguese_sentence?: string;
          target_translation?: string;
          acceptable_variants?: unknown;
        };
        if (!d.portuguese_sentence || !d.target_translation) return false;
        if (!Array.isArray(d.acceptable_variants)) {
          (d as Record<string, unknown>).acceptable_variants = [];
        }
        return true;
      }
      if (item.exercise.type === 'word-bank-translation') {
        const d = item.exercise.data as {
          portuguese_sentence?: string;
          words?: string[];
          correctOrder?: string[];
        };
        return !!d.portuguese_sentence && !!d.words?.length && !!d.correctOrder?.length;
      }
      return false;
    });

    return validated.length > 0 ? validated : null;
  } catch (err) {
    console.error('[generateVocabReview] Error:', err);
    return null;
  }
}
