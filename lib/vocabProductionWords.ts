import type { Exercise } from '@/types';

function tokenizePhrase(text: string): string[] {
  return text
    .split(/\s+/)
    .map((w) => w.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, ''))
    .filter((w) => w.length >= 2);
}

/** Target vocabulary explicitly tied to a production exercise. */
export function extractExplicitProductionWords(exercise: Exercise): string[] {
  switch (exercise.type) {
    case 'reverse-translation':
      return tokenizePhrase(exercise.data.target_translation);
    case 'fill-gap-production':
      return [exercise.data.blankWord];
    case 'minimal-pair-production':
      return [exercise.data.correctWord];
    case 'speak-repeat':
    case 'shadowing':
      return tokenizePhrase(exercise.data.text);
    case 'word-bank-translation':
      return exercise.data.correctOrder;
    case 'audio-dictation':
      return tokenizePhrase(exercise.data.text);
    case 'connected-speech':
      return tokenizePhrase(exercise.data.expected_transcription);
    case 'voicemail-dictation':
      return tokenizePhrase(exercise.data.audioText);
    case 'translation-with-constraint':
      return tokenizePhrase(exercise.data.target_translation);
    default:
      return [];
  }
}

/** Words to mark as actively produced after a successful production exercise. */
export function resolveProductionVocabulary(
  exercise: Exercise,
  lessonVocabulary: string[],
): string[] {
  const lessonByLower = new Map(lessonVocabulary.map((w) => [w.toLowerCase(), w]));
  const explicit = extractExplicitProductionWords(exercise)
    .map((w) => lessonByLower.get(w.toLowerCase()))
    .filter((w): w is string => Boolean(w));
  const pool = explicit.length > 0 ? explicit : lessonVocabulary;
  return [...new Set(pool.map((w) => w.trim()).filter(Boolean))];
}
