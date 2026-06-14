import { isValidErrorCorrectionExercise, normalizeErrorCorrectionData } from '@/utils/errorCorrection';
import type { ConjugationSpeedData, ErrorCorrectionData, Exercise, SupportedLanguage } from '@/types';
import type { ExerciseTypeId } from './constants';
import { fixConjugationSpeedExercise } from './fixConjugationSpeed';

export async function validateAndSanitizeExercises(
  exercises: Exercise[],
  allowedSet: Set<ExerciseTypeId>,
  language: SupportedLanguage,
): Promise<Exercise[]> {
  const validated = exercises.filter((ex) => {
    if (!allowedSet.has(ex.type as ExerciseTypeId)) {
      console.warn(`[generatePracticeExercises] Dropped ${ex.type} — not allowed at this level/progress`);
      return false;
    }
    if (ex.type === 'error-correction') {
      const normalized = normalizeErrorCorrectionData(ex.data as ErrorCorrectionData);
      const ok = isValidErrorCorrectionExercise(normalized);
      if (ok) {
        Object.assign(ex.data, normalized);
      } else {
        console.warn('[generatePracticeExercises] Dropped malformed error-correction exercise');
      }
      return ok;
    }
    if (ex.type === 'audio-dictation' || ex.type === 'speak-repeat') {
      const text = (ex.data as { text: string }).text?.trim();
      if (!text) {
        console.warn(`[generatePracticeExercises] Dropped ${ex.type} with empty text`);
        return false;
      }
      return true;
    }
    if (ex.type === 'sentence-builder') {
      const data = ex.data as { words: string[]; correctOrder: string[] };
      if (!data.words?.length || !data.correctOrder?.length) {
        console.warn('[generatePracticeExercises] Dropped malformed sentence-builder exercise');
        return false;
      }

      // Always rebuild words from correctOrder to guarantee exact casing and content match.
      // Previously we only checked case-insensitively, which let casing mismatches slip through
      // (e.g. words had "la" but correctOrder had "La", causing false negatives on comparison).
      const sortedWords = [...data.words].map(w => w.trim()).sort();
      const sortedCorrect = [...data.correctOrder].map(w => w.trim()).sort();

      if (sortedWords.join(',') !== sortedCorrect.join(',')) {
        console.warn('[generatePracticeExercises] Auto-fixing mismatched words in sentence-builder');
        data.words = [...data.correctOrder].sort(() => Math.random() - 0.5);
      }

      return true;
    }
    if (ex.type === 'context-choice') {
      const { sentence, blankWord, options } = ex.data as { sentence: string; blankWord: string; options: string[] };
      if (!sentence || !blankWord || !Array.isArray(options) || options.length < 2) {
        console.warn('[generatePracticeExercises] Dropped malformed context-choice');
        return false;
      }
      return true;
    }
    if (ex.type === 'scrambled-conversation') {
      const d = ex.data as { lines: string[]; shuffledLines: string[] };
      if (!Array.isArray(d.lines) || !Array.isArray(d.shuffledLines) || d.lines.length < 3 || d.lines.length !== d.shuffledLines.length) {
        console.warn('[generatePracticeExercises] Dropped malformed scrambled-conversation');
        return false;
      }

      // Ensure that shuffledLines actually contains the same lines as lines, and is actually shuffled.
      const sortedLines = [...d.lines].sort();
      const sortedShuffled = [...d.shuffledLines].sort();
      if (sortedLines.join(',') !== sortedShuffled.join(',')) {
        console.warn('[generatePracticeExercises] Auto-fixing scrambled-conversation with mismatched shuffled lines');
        d.shuffledLines = [...d.lines].sort(() => Math.random() - 0.5);
      }

      // If the shuffle randomly ended up in the same order, reshuffle
      if (JSON.stringify(d.lines) === JSON.stringify(d.shuffledLines) && d.lines.length > 1) {
        d.shuffledLines = [...d.lines].sort(() => Math.random() - 0.5);
      }
      return true;
    }
    if (ex.type === 'interactive-subtitles') {
      const d = ex.data as {
        correctText?: string;
        errorText?: string;
        wrongWords?: string[];
        translations?: string;
        translation?: string;
        corrections?: Array<{ wrong: string; correct: string; options: string[] }>;
      };
      if (d.translation && !d.translations) {
        d.translations = d.translation;
      }
      if (!d.correctText || !d.errorText || !Array.isArray(d.wrongWords) || !d.translations) {
        console.warn('[generatePracticeExercises] Dropped malformed interactive-subtitles');
        return false;
      }
      if (!Array.isArray(d.corrections) || d.corrections.length !== d.wrongWords.length) {
        console.warn('[generatePracticeExercises] Auto-fixing interactive-subtitles missing corrections');
        d.corrections = d.wrongWords.map((wrong) => {
          const correctWord = d.correctText!.split(/\s+/).find(
            (w) => w.replace(/[.,!?;:'"]/g, '').toLowerCase() !== wrong.replace(/[.,!?;:'"]/g, '').toLowerCase(),
          ) ?? wrong;
          return { wrong, correct: correctWord, options: [correctWord, wrong, '...'] };
        });
      }
      return true;
    }
    if (ex.type === 'grammar-trap') {
      const d = ex.data as {
        scenario: string;
        question: string;
        options: Array<{ sentence: string; translation: string; isCorrect: boolean }>;
        explanation: string;
        trapRule: string;
      };
      if (
        !d.scenario ||
        !d.question ||
        !d.explanation ||
        !d.trapRule ||
        !Array.isArray(d.options) ||
        d.options.length !== 4 ||
        d.options.filter((o) => o.isCorrect).length !== 1
      ) {
        console.warn('[generatePracticeExercises] Dropped malformed grammar-trap exercise');
        return false;
      }
      return true;
    }
    if (ex.type === 'minimal-pair') {
      const d = ex.data as {
        wordA: string; wordB: string; correctWord: string;
        sentenceContext: string; translation: string; tip: string;
      };
      if (
        !d.wordA || !d.wordB || !d.correctWord ||
        !d.sentenceContext || !d.translation || !d.tip ||
        (d.correctWord !== d.wordA && d.correctWord !== d.wordB)
      ) {
        console.warn('[generatePracticeExercises] Dropped malformed minimal-pair exercise');
        return false;
      }
      return true;
    }
    if (ex.type === 'conjugation-speed') {
      const d = ex.data as ConjugationSpeedData;
      if (
        !d.verb || !d.pronoun || !d.tense || !d.correctForm ||
        !d.exampleSentence || !d.translation ||
        !Array.isArray(d.options) || d.options.length !== 4 ||
        !d.options.includes(d.correctForm)
      ) {
        console.warn('[generatePracticeExercises] Dropped malformed conjugation-speed exercise');
        return false;
      }
      return true;
    }
    if (ex.type === 'word-bank-translation') {
      const d = ex.data as { words: string[]; correctOrder: string[]; portuguese_sentence?: string };
      if (!d.portuguese_sentence || !d.words?.length || !d.correctOrder?.length) return false;
      const sortedWords = [...d.words].map(w => w.trim()).sort();
      const sortedCorrect = [...d.correctOrder].map(w => w.trim()).sort();
      if (sortedWords.join(',') !== sortedCorrect.join(',')) {
        (ex.data as { words: string[] }).words = [...d.correctOrder].sort(() => Math.random() - 0.5);
      }
      return true;
    }
    if (ex.type === 'bridge-choice') {
      const d = ex.data as { scenario?: string; question?: string; options?: string[]; correctIndex?: number; explanation?: string };
      if (!d.question || !d.explanation || !Array.isArray(d.options) || d.options.length < 3) return false;
      if (typeof d.correctIndex !== 'number' || d.correctIndex < 0 || d.correctIndex >= d.options.length) return false;
      return true;
    }
    if (ex.type === 'listen-and-select') {
      const d = ex.data as { audioText?: string; options?: string[]; correctIndex?: number; translation?: string };
      if (!d.audioText || !d.translation || !Array.isArray(d.options) || d.options.length < 3) return false;
      if (typeof d.correctIndex !== 'number' || d.correctIndex < 0 || d.correctIndex >= d.options.length) return false;
      return true;
    }
    return true;
  });

  const dedupedValidated: Exercise[] = [];
  for (const ex of validated) {
    if (ex.type === 'conjugation-speed') {
      const fixed = await fixConjugationSpeedExercise(ex.data, language);
      if (!fixed) {
        console.warn('[generatePracticeExercises] Dropped conjugation-speed exercise with duplicate options');
        continue;
      }
      dedupedValidated.push({ ...ex, data: fixed });
      continue;
    }
    dedupedValidated.push(ex);
  }

  return dedupedValidated;
}
