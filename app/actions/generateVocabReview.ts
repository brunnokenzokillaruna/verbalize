'use server';

import { callGeminiJSON } from '@/services/gemini';
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
  words: Array<{ word: string; translation: string }>;
  language: SupportedLanguage;
  level: ProficiencyLevel;
  knownVocabulary?: string[];
}

/**
 * Generates one spaced-repetition exercise per vocabulary word (up to 8 words per session).
 * Alternates between context-choice (fill-in-blank with the word) and reverse-translation
 * (translate a PT-BR sentence that requires using the word).
 * Returns null on error.
 */
export async function generateVocabReview(
  params: GenerateVocabReviewParams,
): Promise<VocabReviewItem[] | null> {
  const { words, language, level, knownVocabulary } = params;
  const langLabel = LANG_LABEL[language];

  const reviewWords = words.slice(0, 8);

  const isEarlyLearner = !knownVocabulary || knownVocabulary.length < 30;
  const vocabConstraint = isEarlyLearner
    ? `All sentences must use simple A1-level everyday vocabulary only.`
    : `Prefer using words the learner already knows: [${knownVocabulary!.slice(-80).join(', ')}].`;

  const exerciseDescriptions = reviewWords
    .map((w, i) => {
      const type = i % 2 === 0 ? 'context-choice' : 'reverse-translation';
      if (type === 'context-choice') {
        return `Item ${i + 1} — word: "${w.word}" (PT: ${w.translation}) — type "context-choice"
- Write an ORIGINAL ${langLabel} sentence where "${w.word}" is the key word
- "sentence": replace "${w.word}" with ___
- "blankWord": "${w.word}"
- "options": 4 items — "${w.word}" + 3 clearly wrong distractors from different semantic fields
- "translation": Brazilian Portuguese translation of the full sentence`;
      } else {
        return `Item ${i + 1} — word: "${w.word}" (PT: ${w.translation}) — type "reverse-translation"
- "portuguese_sentence": natural PT-BR sentence whose correct ${langLabel} translation uses "${w.word}"
- "target_translation": ${langLabel} sentence containing "${w.word}"
- "acceptable_variants": 1-2 alternative phrasings (or [])`;
      }
    })
    .join('\n\n');

  const jsonTemplate = reviewWords
    .map((w, i) => {
      const type = i % 2 === 0 ? 'context-choice' : 'reverse-translation';
      if (type === 'context-choice') {
        return `  {"word":"${w.word}","exercise":{"type":"context-choice","data":{"sentence":"sentence with ___","blankWord":"${w.word}","options":["${w.word}","distractor1","distractor2","distractor3"],"translation":"PT translation"}}}`;
      } else {
        return `  {"word":"${w.word}","exercise":{"type":"reverse-translation","data":{"portuguese_sentence":"PT sentence","target_translation":"${langLabel} sentence with ${w.word}","acceptable_variants":[]}}}`;
      }
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
      return false;
    });

    return validated.length > 0 ? validated : null;
  } catch (err) {
    console.error('[generateVocabReview] Error:', err);
    return null;
  }
}
