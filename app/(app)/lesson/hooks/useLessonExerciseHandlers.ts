import { useState, useCallback, useMemo } from 'react';
import { generateMistakeReview } from '@/app/actions/generateMistakeReview';
import {
  saveLessonMistake,
  getOldestMistake,
  deleteLessonMistake,
} from '@/services/firestore';
import { useLessonStore } from '@/store/lessonStore';
import { buildMistakeContext } from '@/app/(app)/lesson/utils';
import { formatErrorCorrectionAnswer } from '@/utils/errorCorrection';
import type { Exercise } from '@/types';
import type { User } from 'firebase/auth';

type PlaySoundFn = (name: 'correct' | 'incorrect') => void;

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
      return exercise.data.correctWord;
    case 'conjugation-speed':
      return exercise.data.correctForm;
    case 'bridge-choice':
      return exercise.data.options[exercise.data.correctIndex];
    case 'listen-and-select':
      return exercise.data.options[exercise.data.correctIndex];
    case 'listening-comprehension':
      return exercise.data.options[exercise.data.correctIndex];
    case 'image-match':
      return exercise.data.targetWord;
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

  const resetExerciseState = useCallback(() => {
    setExerciseAnswer(null);
    setIsExerciseReady(false);
    setSubmitTrigger(0);
  }, []);

  const handleAnswer = useCallback(
    (correct: boolean) => {
      if (exerciseAnswer !== null) return;
      setExerciseAnswer(correct);
      if (phase === 'production') {
        store.recordCheckpointProduction(correct);
        playSound(correct ? 'correct' : 'incorrect');
        return;
      }
      if (correct) {
        store.recordCorrect();
        playSound('correct');
      } else if (store.lesson) {
        const exercise = store.exercises[store.exerciseIndex];
        if (exercise) store.recordMistake(exercise);
        playSound('incorrect');
      }
    },
    [exerciseAnswer, phase, store, playSound],
  );

  const handleCheck = useCallback(() => {
    setSubmitTrigger((prev) => prev + 1);
  }, []);

  const handleReviewAnswer = useCallback(
    (correct: boolean) => {
      if (exerciseAnswer !== null) return;
      setExerciseAnswer(correct);
      if (correct) {
        store.recordReviewCorrect();
        playSound('correct');
      } else {
        playSound('incorrect');
      }
    },
    [exerciseAnswer, store, playSound],
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
    finishLesson();

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
    currentExercise,
    currentReviewExercise,
    checkState,
    correctAnswerForBanner,
    resetExerciseState,
    handleAnswer,
    handleCheck,
    handleReviewAnswer,
    handleContinue,
    handleReviewContinue,
  };
}
