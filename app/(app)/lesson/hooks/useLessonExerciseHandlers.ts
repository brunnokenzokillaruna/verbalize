import { useState, useCallback, useMemo } from 'react';
import { generateMistakeReview } from '@/app/actions/generateMistakeReview';
import {
  saveLessonMistake,
  getOldestMistake,
  deleteLessonMistake,
  updateVocabSrsAfterReview,
} from '@/services/firestore';
import { useLessonStore } from '@/store/lessonStore';
import { buildMistakeContext } from '@/app/(app)/lesson/utils';
import { formatErrorCorrectionAnswer } from '@/utils/errorCorrection';
import { getLocalElaborationHint } from '@/lib/elaborationHints';
import {
  DESIRABLE_DIFFICULTY_MAX_WRONG,
  hasRetriesRemaining,
  supportsDesirableDifficulty,
} from '@/lib/practiceExercises/desirableDifficulty';
import { markExerciseProductionVocabulary } from '@/lib/vocabProductionTracking';
import type { ExerciseAnswerMeta } from '@/hooks/useSoundEffects';
import type { Exercise } from '@/types';
import type { User } from 'firebase/auth';

type PlaySoundFn = (
  name: 'correct' | 'incorrect' | 'accent-warning',
  options?: { soft?: boolean },
) => void;

function playAnswerFeedback(
  playSound: PlaySoundFn,
  correct: boolean,
  meta?: ExerciseAnswerMeta,
) {
  if (meta?.accentOnly) {
    playSound('accent-warning');
    return;
  }
  playSound(correct ? 'correct' : 'incorrect');
}

function getCorrectAnswerForBanner(
  exercise: Exercise | undefined,
  exerciseAnswer: boolean | null,
): string | undefined {
  if (!exercise || exerciseAnswer !== false) return undefined;
  switch (exercise.type) {
    case 'context-choice':
      return exercise.data.blankWord;
    case 'error-correction':
      return formatErrorCorrectionAnswer(exercise.data);
    case 'grammar-trap':
      return exercise.data.options.find((o) => o.isCorrect)?.sentence;
    case 'minimal-pair':
    case 'minimal-pair-production':
      return exercise.data.correctWord;
    case 'conjugation-speed':
      return exercise.data.correctForm;
    case 'bridge-choice':
      return exercise.data.options[exercise.data.correctIndex];
    case 'listen-and-select':
      return exercise.data.options[exercise.data.correctIndex];
    case 'listening-comprehension':
      return exercise.data.options[exercise.data.correctIndex];
    case 'listen-and-respond':
      return exercise.data.exampleResponse;
    case 'free-roleplay':
      return exercise.data.exampleResponse;
    case 'micro-message':
      return exercise.data.exampleResponse;
    case 'image-match':
      return exercise.data.targetWord;
    case 'fill-gap-production':
      return exercise.data.blankWord;
    case 'translation-with-constraint':
      return exercise.data.target_translation;
    case 'voicemail-dictation':
      return exercise.data.expected_summary;
    case 'inference-tone':
      return exercise.data.correctOption === 'A'
        ? exercise.data.audioTextA
        : exercise.data.audioTextB;
    case 'connected-speech':
      return exercise.data.expected_transcription;
    case 'story-continuation':
      return exercise.data.exampleContinuation;
    case 'spot-the-register':
      return exercise.data.correctedLine;
    case 'prompted-monologue':
      return exercise.data.exampleMonologue;
    default:
      return undefined;
  }
}

export function useLessonExerciseHandlers(
  user: User | null,
  playSound: PlaySoundFn,
  playCompletionSound: () => void,
  finishLesson: () => void,
  onProductionContinue?: () => void,
) {
  const store = useLessonStore();
  const [exerciseAnswer, setExerciseAnswer] = useState<boolean | null>(null);
  const [isExerciseReady, setIsExerciseReady] = useState(false);
  const [submitTrigger, setSubmitTrigger] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [exerciseRetryKey, setExerciseRetryKey] = useState(0);
  const [retryNotice, setRetryNotice] = useState<string | null>(null);

  const phase = store.phase;
  const currentExercise =
    phase === 'production'
      ? store.exercises[store.checkpointProductionIndex]
      : store.exercises[store.exerciseIndex];
  const currentReviewExercise = store.reviewExercises[store.reviewIndex];
  const activeExercise =
    phase === 'review'
      ? currentReviewExercise
      : phase === 'production'
        ? currentExercise
        : currentExercise;

  const checkState = useMemo(() => {
    if (exerciseAnswer !== null) {
      return exerciseAnswer ? ('correct' as const) : ('incorrect' as const);
    }
    return isExerciseReady ? ('idle' as const) : ('disabled' as const);
  }, [exerciseAnswer, isExerciseReady]);

  const correctAnswerForBanner = useMemo(
    () => getCorrectAnswerForBanner(activeExercise, exerciseAnswer),
    [activeExercise, exerciseAnswer],
  );

  const elaborationHint = useMemo(() => {
    if (exerciseAnswer !== true || !activeExercise) return null;
    return getLocalElaborationHint(activeExercise, store.lastProductionPolishHint);
  }, [exerciseAnswer, activeExercise, store.lastProductionPolishHint]);

  const resetExerciseState = useCallback(() => {
    setExerciseAnswer(null);
    setIsExerciseReady(false);
    setSubmitTrigger(0);
    setWrongAttempts(0);
    setExerciseRetryKey(0);
    setRetryNotice(null);
    store.setLastProductionPolishHint(null);
  }, [store]);

  const finalizeAnswer = useCallback(
    (correct: boolean, meta?: ExerciseAnswerMeta) => {
      setExerciseAnswer(correct);
      setRetryNotice(null);

      const exercise =
        phase === 'production'
          ? store.exercises[store.checkpointProductionIndex]
          : phase === 'review'
            ? store.reviewExercises[store.reviewIndex]
            : store.exercises[store.exerciseIndex];

      if (correct && exercise && store.lesson) {
        markExerciseProductionVocabulary(
          user?.uid,
          store.lesson.language,
          exercise,
          [...(store.hook?.newVocabulary ?? []), ...(store.hook?.newChunks?.map((c) => c.phrase) ?? [])],
          true,
        );
      }

      // Visual drills also count as vocab review for SRS.
      if (
        phase === 'practice' &&
        exercise?.type === 'image-match' &&
        user?.uid &&
        store.lesson
      ) {
        const imageUrl = exercise.data.options.find(
          (option) => option.word === exercise.data.correctWord,
        )?.imageUrl;
        void updateVocabSrsAfterReview(
          user.uid,
          exercise.data.targetWord,
          store.lesson.language,
          correct,
          { translation: exercise.data.translation, imageUrl },
        ).catch((err) => console.warn('[lesson] visual SRS update failed:', err));
      }

      if (phase === 'production') {
        const topic =
          store.checkpointSession?.productionTopics?.[store.checkpointProductionIndex];
        store.recordCheckpointProduction(correct, topic);
        playAnswerFeedback(playSound, correct, meta);
        return;
      }
      if (correct) {
        store.recordCorrect();
        playAnswerFeedback(playSound, correct, meta);
      } else if (store.lesson) {
        const exercise = store.exercises[store.exerciseIndex];
        if (exercise) store.recordMistake(exercise);
        playAnswerFeedback(playSound, correct, meta);
      }
    },
    [phase, store, playSound, user?.uid],
  );

  const handleAnswer = useCallback(
    (correct: boolean, meta?: ExerciseAnswerMeta) => {
      if (exerciseAnswer !== null) return;

      const exercise =
        phase === 'production'
          ? store.exercises[store.checkpointProductionIndex]
          : phase === 'review'
            ? store.reviewExercises[store.reviewIndex]
            : store.exercises[store.exerciseIndex];

      if (
        !correct &&
        exercise &&
        supportsDesirableDifficulty(exercise.type) &&
        hasRetriesRemaining(wrongAttempts)
      ) {
        setWrongAttempts((n) => n + 1);
        setExerciseRetryKey((k) => k + 1);
        setRetryNotice('Quase! Tente de novo — você ainda tem mais uma tentativa.');
        playSound('incorrect', { soft: true });
        return;
      }

      finalizeAnswer(correct, meta);
    },
    [exerciseAnswer, phase, store, wrongAttempts, finalizeAnswer, playSound],
  );

  const handleCheck = useCallback(() => {
    setSubmitTrigger((prev) => prev + 1);
  }, []);

  const handleReviewAnswer = useCallback(
    (correct: boolean, meta?: ExerciseAnswerMeta) => {
      if (exerciseAnswer !== null) return;

      const exercise = store.reviewExercises[store.reviewIndex];
      if (
        !correct &&
        exercise &&
        supportsDesirableDifficulty(exercise.type) &&
        hasRetriesRemaining(wrongAttempts)
      ) {
        setWrongAttempts((n) => n + 1);
        setExerciseRetryKey((k) => k + 1);
        setRetryNotice('Quase! Tente de novo — você ainda tem mais uma tentativa.');
        playSound('incorrect', { soft: true });
        return;
      }

      setExerciseAnswer(correct);
      setRetryNotice(null);
      if (correct) {
        store.recordReviewCorrect();
        playAnswerFeedback(playSound, correct, meta);
      } else {
        playAnswerFeedback(playSound, correct, meta);
      }
    },
    [exerciseAnswer, store, wrongAttempts, playSound],
  );

  const handleContinue = useCallback(async () => {
    if (phase === 'production' && onProductionContinue) {
      resetExerciseState();
      onProductionContinue();
      return;
    }

    const isLast = store.exerciseIndex >= store.exercises.length - 1;
    if (!isLast) {
      resetExerciseState();
      store.nextExercise();
      return;
    }

    store.setPhase('complete');
    resetExerciseState();
    await finishLesson();

    if (!user || !store.lesson) {
      playCompletionSound();
      return;
    }

    const accuracy = store.correctCount / store.exercises.length;
    if (accuracy >= 0.8) {
      store.setIsLoading(false);
      store.setPhase('complete');
      playCompletionSound();
      return;
    }

    store.mistakes.forEach((m) => {
      saveLessonMistake(
        user.uid,
        store.lesson!.language,
        store.lesson!.grammarFocus,
        buildMistakeContext(m),
        store.lesson!.id,
        store.lesson!.level,
      ).catch(console.error);
    });

    try {
      store.setIsLoading(true);
      const mistake = await getOldestMistake(user.uid, store.lesson.language);
      if (mistake) {
        const exercises = await generateMistakeReview({
          grammarFocus: mistake.grammarFocus,
          mistakeContext: mistake.mistakeContext,
          language: store.lesson.language,
          level: store.lesson.level,
          knownVocabulary: [...store.knownVocabulary, ...(store.hook?.newVocabulary ?? [])],
        });
        if (exercises) {
          store.setReview(mistake, exercises);
          store.setPhase('review');
          return;
        }
      }
    } catch (err) {
      console.error('[LessonPage] mistake review error:', err);
    } finally {
      store.setIsLoading(false);
    }
  }, [store, user, phase, onProductionContinue, resetExerciseState, finishLesson, playCompletionSound]);

  const handleReviewContinue = useCallback(() => {
    const isLastReview = store.reviewIndex >= store.reviewExercises.length - 1;
    if (!isLastReview) {
      resetExerciseState();
      store.nextReviewExercise();
      return;
    }

    resetExerciseState();
    if (
      store.reviewMistake?.id &&
      store.reviewCorrectCount + (exerciseAnswer === true ? 1 : 0) >= store.reviewExercises.length
    ) {
      deleteLessonMistake(store.reviewMistake.id).catch(console.error);
    }
    store.setPhase('complete');
    playCompletionSound();
  }, [store, exerciseAnswer, resetExerciseState, playCompletionSound]);

  return {
    exerciseAnswer,
    isExerciseReady,
    setIsExerciseReady,
    submitTrigger,
    exerciseRetryKey,
    retryNotice,
    currentExercise,
    currentReviewExercise,
    checkState,
    correctAnswerForBanner,
    elaborationHint,
    resetExerciseState,
    handleAnswer,
    handleCheck,
    handleReviewAnswer,
    handleContinue,
    handleReviewContinue,
  };
}

export { DESIRABLE_DIFFICULTY_MAX_WRONG };
