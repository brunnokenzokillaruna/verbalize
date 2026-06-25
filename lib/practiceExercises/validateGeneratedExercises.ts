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
        console.warn(
          '[generatePracticeExercises] Dropped error-correction exercise (malformed or displacement/reorder fix — use sentence-builder or grammar-trap instead)',
        );
      }
      return ok;
    }
    if (ex.type === 'audio-dictation' || ex.type === 'speak-repeat' || ex.type === 'shadowing') {
      const d = ex.data as { text?: string; translation?: string };
      const text = d.text?.trim();
      if (!text) {
        console.warn(`[generatePracticeExercises] Dropped ${ex.type} with empty text`);
        return false;
      }
      if (!d.translation?.trim()) {
        console.warn(`[generatePracticeExercises] Dropped ${ex.type} with empty translation`);
        return false;
      }
      return true;
    }
    if (ex.type === 'reverse-translation') {
      const d = ex.data as {
        portuguese_sentence?: string;
        target_translation?: string;
        acceptable_variants?: string[];
      };
      if (!d.portuguese_sentence?.trim() || !d.target_translation?.trim()) {
        console.warn('[generatePracticeExercises] Dropped reverse-translation with missing sentence fields');
        return false;
      }
      if (!Array.isArray(d.acceptable_variants) || d.acceptable_variants.length === 0) {
        console.warn('[generatePracticeExercises] Dropped reverse-translation with empty acceptable_variants');
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
    if (ex.type === 'minimal-pair' || ex.type === 'minimal-pair-production') {
      const d = ex.data as {
        wordA: string; wordB: string; correctWord: string;
        sentenceContext: string; translation: string; tip: string;
      };
      if (
        !d.wordA || !d.wordB || !d.correctWord ||
        !d.sentenceContext || !d.translation || !d.tip ||
        (d.correctWord !== d.wordA && d.correctWord !== d.wordB)
      ) {
        console.warn(`[generatePracticeExercises] Dropped malformed ${ex.type} exercise`);
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
      if (!d.portuguese_sentence?.trim() || !d.words?.length || !d.correctOrder?.length) {
        console.warn('[generatePracticeExercises] Dropped malformed word-bank-translation');
        return false;
      }
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
    if (ex.type === 'listening-comprehension') {
      const d = ex.data as {
        dialogueAudio?: string;
        questionPt?: string;
        options?: string[];
        correctIndex?: number;
        explanationPt?: string;
      };
      if (!d.dialogueAudio?.trim() || !d.questionPt?.trim() || !d.explanationPt?.trim()) return false;
      if (!Array.isArray(d.options) || d.options.length < 2) return false;
      if (typeof d.correctIndex !== 'number' || d.correctIndex < 0 || d.correctIndex >= d.options.length) return false;
      return true;
    }
    if (ex.type === 'listen-and-respond') {
      const d = ex.data as {
        dialogueAudio?: string;
        promptLine?: string;
        contextPt?: string;
        evaluationCriteria?: string;
        acceptableThemes?: string[];
        exampleResponse?: string;
      };
      if (
        !d.dialogueAudio?.trim() ||
        !d.promptLine?.trim() ||
        !d.contextPt?.trim() ||
        !d.evaluationCriteria?.trim() ||
        !d.exampleResponse?.trim() ||
        !Array.isArray(d.acceptableThemes) ||
        d.acceptableThemes.length === 0
      ) {
        console.warn('[generatePracticeExercises] Dropped malformed listen-and-respond');
        return false;
      }
      return true;
    }
    if (ex.type === 'free-roleplay') {
      const d = ex.data as {
        context?: string;
        promptLine?: string;
        evaluationCriteria?: string;
        acceptableThemes?: string[];
        exampleResponse?: string;
        explanation?: string;
      };
      if (
        !d.context?.trim() ||
        !d.promptLine?.trim() ||
        !d.evaluationCriteria?.trim() ||
        !d.exampleResponse?.trim() ||
        !d.explanation?.trim() ||
        !Array.isArray(d.acceptableThemes) ||
        d.acceptableThemes.length === 0
      ) {
        console.warn('[generatePracticeExercises] Dropped malformed free-roleplay');
        return false;
      }
      return true;
    }
    if (ex.type === 'micro-message') {
      const d = ex.data as {
        context?: string;
        incomingMessage?: string;
        translation?: string;
        evaluationCriteria?: string;
        exampleResponse?: string;
      };
      if (
        !d.context?.trim() ||
        !d.incomingMessage?.trim() ||
        !d.translation?.trim() ||
        !d.evaluationCriteria?.trim() ||
        !d.exampleResponse?.trim()
      ) {
        console.warn('[generatePracticeExercises] Dropped malformed micro-message');
        return false;
      }
      return true;
    }
    if (ex.type === 'paraphrase') {
      const d = ex.data as {
        source_sentence?: string;
        source_translation?: string;
        target_paraphrase?: string;
        acceptable_variants?: string[];
      };
      if (
        !d.source_sentence?.trim() ||
        !d.source_translation?.trim() ||
        !d.target_paraphrase?.trim() ||
        !Array.isArray(d.acceptable_variants) ||
        d.acceptable_variants.length === 0
      ) {
        console.warn('[generatePracticeExercises] Dropped malformed paraphrase');
        return false;
      }
      return true;
    }
    if (ex.type === 'fill-gap-production') {
      const d = ex.data as {
        sentence?: string;
        blankWord?: string;
        translation?: string;
      };
      if (
        !d.sentence?.includes('___') ||
        !d.blankWord?.trim() ||
        !d.translation?.trim()
      ) {
        console.warn('[generatePracticeExercises] Dropped malformed fill-gap-production');
        return false;
      }
      return true;
    }
    if (ex.type === 'translation-with-constraint') {
      const d = ex.data as {
        portuguese_sentence?: string;
        required_chunk?: string;
        target_translation?: string;
        acceptable_variants?: string[];
      };
      const chunk = d.required_chunk?.trim();
      if (
        !d.portuguese_sentence?.trim() ||
        !chunk ||
        !d.target_translation?.trim() ||
        !Array.isArray(d.acceptable_variants) ||
        d.acceptable_variants.length === 0
      ) {
        console.warn('[generatePracticeExercises] Dropped malformed translation-with-constraint');
        return false;
      }
      const chunkNorm = chunk.toLowerCase();
      const inTarget = d.target_translation.toLowerCase().includes(chunkNorm);
      const inVariants = d.acceptable_variants.some((v) =>
        v.toLowerCase().includes(chunkNorm),
      );
      if (!inTarget || !inVariants) {
        console.warn('[generatePracticeExercises] Dropped translation-with-constraint — required_chunk missing from model answers');
        return false;
      }
      return true;
    }
    if (ex.type === 'voicemail-dictation') {
      const d = ex.data as {
        audioText?: string;
        contextPt?: string;
        expected_summary?: string;
        acceptable_summaries?: string[];
      };
      const wordCount = d.audioText?.trim().split(/\s+/).length ?? 0;
      if (
        wordCount < 12 ||
        !d.contextPt?.trim() ||
        !d.expected_summary?.trim() ||
        !Array.isArray(d.acceptable_summaries) ||
        d.acceptable_summaries.length === 0
      ) {
        console.warn('[generatePracticeExercises] Dropped malformed voicemail-dictation');
        return false;
      }
      return true;
    }
    if (ex.type === 'inference-tone') {
      const d = ex.data as {
        contextPt?: string;
        questionPt?: string;
        targetTonePt?: string;
        audioTextA?: string;
        audioTextB?: string;
        labelA?: string;
        labelB?: string;
        correctOption?: string;
        explanationPt?: string;
      };
      if (
        !d.contextPt?.trim() ||
        !d.questionPt?.trim() ||
        !d.targetTonePt?.trim() ||
        !d.audioTextA?.trim() ||
        !d.audioTextB?.trim() ||
        !d.labelA?.trim() ||
        !d.labelB?.trim() ||
        !d.explanationPt?.trim() ||
        (d.correctOption !== 'A' && d.correctOption !== 'B') ||
        d.audioTextA.trim().toLowerCase() === d.audioTextB.trim().toLowerCase()
      ) {
        console.warn('[generatePracticeExercises] Dropped malformed inference-tone');
        return false;
      }
      return true;
    }
    if (ex.type === 'connected-speech') {
      const d = ex.data as {
        audioText?: string;
        translation?: string;
        contextPt?: string;
        phenomenonPt?: string;
        segmentedForm?: string;
        linkedForm?: string;
        expected_transcription?: string;
        acceptable_variants?: string[];
        explanationPt?: string;
      };
      if (
        !d.audioText?.trim() ||
        !d.translation?.trim() ||
        !d.contextPt?.trim() ||
        !d.phenomenonPt?.trim() ||
        !d.segmentedForm?.trim() ||
        !d.linkedForm?.trim() ||
        !d.expected_transcription?.trim() ||
        !d.explanationPt?.trim() ||
        !Array.isArray(d.acceptable_variants) ||
        d.acceptable_variants.length === 0
      ) {
        console.warn('[generatePracticeExercises] Dropped malformed connected-speech');
        return false;
      }
      return true;
    }
    if (ex.type === 'story-continuation') {
      const d = ex.data as {
        storyOpening?: string;
        storyTranslation?: string;
        contextPt?: string;
        promptPt?: string;
        evaluationCriteria?: string;
        acceptableThemes?: string[];
        exampleContinuation?: string;
        explanationPt?: string;
      };
      if (
        !d.storyOpening?.trim() ||
        !d.storyTranslation?.trim() ||
        !d.contextPt?.trim() ||
        !d.promptPt?.trim() ||
        !d.evaluationCriteria?.trim() ||
        !d.exampleContinuation?.trim() ||
        !d.explanationPt?.trim() ||
        !Array.isArray(d.acceptableThemes) ||
        d.acceptableThemes.length === 0
      ) {
        console.warn('[generatePracticeExercises] Dropped malformed story-continuation');
        return false;
      }
      return true;
    }
    if (ex.type === 'spot-the-register') {
      const d = ex.data as {
        context?: string;
        dialogueLines?: string[];
        wrongLineIndex?: number;
        registerIssuePt?: string;
        targetRegisterPt?: string;
        evaluationCriteria?: string;
        acceptableThemes?: string[];
        correctedLine?: string;
        explanationPt?: string;
      };
      const lineCount = d.dialogueLines?.length ?? 0;
      if (
        !d.context?.trim() ||
        lineCount < 2 ||
        lineCount > 4 ||
        typeof d.wrongLineIndex !== 'number' ||
        d.wrongLineIndex < 0 ||
        d.wrongLineIndex >= lineCount ||
        !d.registerIssuePt?.trim() ||
        !d.targetRegisterPt?.trim() ||
        !d.evaluationCriteria?.trim() ||
        !d.correctedLine?.trim() ||
        !d.explanationPt?.trim() ||
        !Array.isArray(d.acceptableThemes) ||
        d.acceptableThemes.length === 0 ||
        d.dialogueLines!.some((line) => !line?.trim())
      ) {
        console.warn('[generatePracticeExercises] Dropped malformed spot-the-register');
        return false;
      }
      return true;
    }
    if (ex.type === 'prompted-monologue') {
      const d = ex.data as {
        contextPt?: string;
        promptPt?: string;
        speakingGoalPt?: string;
        evaluationCriteria?: string;
        acceptableThemes?: string[];
        exampleMonologue?: string;
        explanationPt?: string;
      };
      if (
        !d.contextPt?.trim() ||
        !d.promptPt?.trim() ||
        !d.speakingGoalPt?.trim() ||
        !d.evaluationCriteria?.trim() ||
        !d.exampleMonologue?.trim() ||
        !d.explanationPt?.trim() ||
        !Array.isArray(d.acceptableThemes) ||
        d.acceptableThemes.length === 0
      ) {
        console.warn('[generatePracticeExercises] Dropped malformed prompted-monologue');
        return false;
      }
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
