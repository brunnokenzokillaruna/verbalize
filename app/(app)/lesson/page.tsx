'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useAuthStore } from '@/store/authStore';
import { useLessonStore } from '@/store/lessonStore';
import { useSoundEffects } from '@/hooks/useSoundEffects';

import { TranslationTooltip } from '@/components/lesson/TranslationTooltip';
import { CheckButton } from '@/components/lesson/CheckButton';
import { LessonProgressHeader } from '@/components/lesson/LessonProgressHeader';
import { LessonLoadingScreen } from '@/components/lesson/LessonLoadingScreen';
import { LessonErrorScreen } from '@/components/lesson/LessonErrorScreen';
import { LessonPhaseContent } from '@/components/lesson/LessonPhaseContent';
import { LessonContinueButton } from '@/components/lesson/LessonContinueButton';
import { LessonCompleteViews } from '@/components/lesson/LessonCompleteViews';

import { useLessonAudio } from './hooks/useLessonAudio';
import { useLessonFlow } from './hooks/useLessonFlow';
import { useLessonBootstrap } from './hooks/useLessonBootstrap';
import { useLessonTooltip } from './hooks/useLessonTooltip';
import { useWordTooltipPrefetch } from './hooks/useWordTooltipPrefetch';
import { useLessonExerciseHandlers } from './hooks/useLessonExerciseHandlers';
import { phaseToStage } from './utils';

import type { GrammarBridgeResult, Exercise } from '@/types';

export default function LessonPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedLessonId = searchParams.get('id') ?? undefined;
  const { user, profile } = useAuthStore();
  const store = useLessonStore();

  const { play: playSound, isMuted, toggleMute } = useSoundEffects();

  const playCompletionSound = useCallback(() => {
    const total = store.exercises.length;
    const isPerfect = total > 0 && store.correctCount >= total;
    playSound(isPerfect ? 'perfect' : 'complete');
  }, [store.exercises.length, store.correctCount, playSound]);

  const { isPlaying, playingLineIdx, isLoadingAudio, handleAudioButton } = useLessonAudio(
    store.phase,
    store.lesson,
    store.hook,
  );

  const exitingRef = useRef(false);
  const lessonInitiatedRef = useRef(false);
  const grammarBridgePrefetchRef = useRef<Promise<GrammarBridgeResult | null> | null>(null);
  const exercisesPrefetchRef = useRef<Promise<Exercise[] | null> | null>(null);

  useEffect(() => {
    if (!user || !profile) {
      router.replace('/?auth=login');
    }
  }, [user, profile, router]);

  const {
    fetchAiExercises,
    advanceFromMission,
    advanceFromVocabulary,
    advanceFromHook,
    advanceFromGrammar,
    advanceFromPhonetics,
    advanceFromRolePlay,
    finishLesson,
    exitLesson,
  } = useLessonFlow({
    exitingRef,
    grammarBridgePrefetchRef,
    exercisesPrefetchRef,
  });

  const { hookError, setHookError } = useLessonBootstrap({
    requestedLessonId,
    exitingRef,
    lessonInitiatedRef,
    grammarBridgePrefetchRef,
    exercisesPrefetchRef,
    fetchAiExercises,
  });

  const { tooltip, handleWordClick, closeTooltip } = useLessonTooltip();
  useWordTooltipPrefetch({ grammarBridgePrefetchRef });

  const {
    exerciseAnswer,
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
  } = useLessonExerciseHandlers(user, playSound, playCompletionSound, finishLesson);

  function handleRetry() {
    setHookError(false);
    resetExerciseState();
    lessonInitiatedRef.current = false;
    store.reset();
  }

  const phase = store.phase;

  const handleAdvance = useCallback(() => {
    switch (phase) {
      case 'vocabulary':
        advanceFromVocabulary();
        break;
      case 'hook':
        advanceFromHook();
        break;
      case 'mission':
        advanceFromMission();
        break;
      case 'phonetics':
        advanceFromPhonetics();
        break;
      case 'role-play':
        advanceFromRolePlay();
        break;
      default:
        advanceFromGrammar();
    }
  }, [
    phase,
    advanceFromVocabulary,
    advanceFromHook,
    advanceFromMission,
    advanceFromPhonetics,
    advanceFromRolePlay,
    advanceFromGrammar,
  ]);

  if (hookError) {
    return <LessonErrorScreen onRetry={handleRetry} onExit={exitLesson} />;
  }

  if (exitingRef.current) {
    return <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100dvh' }} />;
  }

  if (phase === 'idle' || phase === 'loading') {
    return <LessonLoadingScreen />;
  }

  if (phase === 'complete') {
    return <LessonCompleteViews onExit={exitLesson} />;
  }

  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100dvh' }}>
      <LessonProgressHeader
        currentStage={phaseToStage(phase)}
        tag={store.lesson?.tag}
        onExit={exitLesson}
        isMuted={isMuted}
        onToggleMute={toggleMute}
      />

      <main
        className={`mx-auto max-w-lg md:max-w-2xl lg:max-w-4xl px-6 pt-10 ${
          phase === 'practice' || phase === 'review' ? 'pb-48' : 'pb-20'
        }`}
      >
        <LessonPhaseContent
          phase={phase}
          exerciseAnswer={exerciseAnswer}
          setIsExerciseReady={setIsExerciseReady}
          submitTrigger={submitTrigger}
          currentExercise={currentExercise}
          currentReviewExercise={currentReviewExercise}
          isPlaying={isPlaying}
          isLoadingAudio={isLoadingAudio}
          playingLineIdx={playingLineIdx}
          onAudioButton={handleAudioButton}
          onWordClick={handleWordClick}
          onAnswer={handleAnswer}
          onReviewAnswer={handleReviewAnswer}
          onAdvanceFromGrammar={advanceFromGrammar}
        />

        {phase !== 'practice' && phase !== 'review' && phase !== 'grammar' && (
          <LessonContinueButton
            phase={phase}
            isLoading={store.isLoading}
            rolePlayComplete={store.rolePlayComplete}
            lessonTag={store.lesson?.tag}
            onAdvance={handleAdvance}
          />
        )}
      </main>

      {(phase === 'practice' || phase === 'review') && (
        <CheckButton
          state={checkState}
          correctAnswer={correctAnswerForBanner}
          onCheck={handleCheck}
          onContinue={phase === 'review' ? handleReviewContinue : handleContinue}
        />
      )}

      {store.lesson && (
        <TranslationTooltip
          word={tooltip.word}
          language={store.lesson.language}
          translation={tooltip.translation}
          explanation={tooltip.explanation}
          example={tooltip.example}
          partOfSpeech={tooltip.partOfSpeech}
          infinitive={tooltip.infinitive}
          isOpen={tooltip.isOpen}
          isLoading={tooltip.isLoading}
          onClose={closeTooltip}
        />
      )}
    </div>
  );
}
