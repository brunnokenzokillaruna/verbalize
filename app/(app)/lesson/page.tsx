'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
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
import { LessonIntroScreen } from '@/components/lesson/LessonIntroScreen';

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
    if (store.lesson?.tag === 'REVIEW' && store.checkpointSession) {
      const compTotal = store.checkpointSession.comprehensionQuestions.length;
      const prodTotal = store.checkpointSession.productionExercises.length;
      const total = compTotal + prodTotal;
      const correct = store.comprehensionCorrect + store.checkpointProductionCorrect;
      playSound(total > 0 && correct >= total ? 'perfect' : 'complete');
      return;
    }
    const total = store.exercises.length;
    const isPerfect = total > 0 && store.correctCount >= total;
    playSound(isPerfect ? 'perfect' : 'complete');
  }, [
    store.lesson?.tag,
    store.checkpointSession,
    store.comprehensionCorrect,
    store.checkpointProductionCorrect,
    store.exercises.length,
    store.correctCount,
    playSound,
  ]);

  const {
    isPlaying,
    playingLineIdx,
    narratedRange,
    isLoadingAudio,
    speakerVoices,
    handleAudioButton,
  } = useLessonAudio(
    store.phase,
    store.lesson,
    store.hook,
    store.checkpointSession?.dialogueAudio,
  );

  const [comprehensionAnswered, setComprehensionAnswered] = useState(false);
  const [comprehensionLastCorrect, setComprehensionLastCorrect] = useState<boolean | null>(null);

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
    advanceFromIntro,
    advanceFromMission,
    advanceFromVocabulary,
    advanceFromHook,
    advanceFromGrammar,
    advanceFromPhonetics,
    advanceFromRolePlay,
    advanceFromBriefing,
    advanceFromComprehension,
    advanceFromCheckpointProduction,
    advanceFromDebrief,
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
    exerciseRetryKey,
    retryNotice,
    currentExercise,
    currentReviewExercise,
    checkState,
    resetExerciseState,
    handleAnswer,
    handleCheck,
    handleReviewAnswer,
    handleContinue,
    handleReviewContinue,
  } = useLessonExerciseHandlers(
    user,
    playSound,
    playCompletionSound,
    finishLesson,
    advanceFromCheckpointProduction,
  );

  function handleRetry() {
    setHookError(false);
    resetExerciseState();
    lessonInitiatedRef.current = false;
    store.reset();
  }

  const phase = store.phase;

  const handleAdvance = useCallback(() => {
    switch (phase) {
      case 'intro':
        advanceFromIntro();
        break;
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
      case 'briefing':
        advanceFromBriefing();
        break;
      case 'comprehension':
        if (comprehensionAnswered) {
          setComprehensionAnswered(false);
          setComprehensionLastCorrect(null);
          resetExerciseState();
          advanceFromComprehension();
        }
        break;
      case 'debrief':
        finishLesson();
        advanceFromDebrief();
        playCompletionSound();
        break;
      default:
        advanceFromGrammar();
    }
  }, [
    phase,
    comprehensionAnswered,
    advanceFromIntro,
    advanceFromVocabulary,
    advanceFromHook,
    advanceFromMission,
    advanceFromPhonetics,
    advanceFromRolePlay,
    advanceFromBriefing,
    advanceFromComprehension,
    advanceFromDebrief,
    advanceFromGrammar,
    finishLesson,
    playCompletionSound,
    resetExerciseState,
  ]);

  const handleComprehensionAnswer = useCallback(
    (correct: boolean) => {
      if (comprehensionAnswered) return;
      setComprehensionAnswered(true);
      setComprehensionLastCorrect(correct);
      const topic =
        store.checkpointSession?.comprehensionQuestions[store.comprehensionIndex]?.topicFocus;
      store.recordComprehensionAnswer(correct, topic);
      playSound(correct ? 'correct' : 'incorrect');
    },
    [comprehensionAnswered, store, playSound],
  );

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

  const introHookReady = !!store.hook && !store.isLoading;

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
        className={`mx-auto max-w-lg md:max-w-2xl lg:max-w-4xl px-4 sm:px-6 pt-4 sm:pt-6 ${
          phase === 'practice' || phase === 'review' || phase === 'production' ? 'pb-32 sm:pb-36' : 'pb-20'
        }`}
      >
        {phase === 'intro' && store.lesson ? (
          <LessonIntroScreen
            tag={store.lesson.tag}
            grammarFocus={store.lesson.grammarFocus}
            uiTitle={store.lesson.uiTitle}
            hookReady={introHookReady}
            sceneImage={store.sceneImage}
          />
        ) : (
          <LessonPhaseContent
            phase={phase}
            exerciseAnswer={exerciseAnswer}
            setIsExerciseReady={setIsExerciseReady}
            submitTrigger={submitTrigger}
            exerciseRetryKey={exerciseRetryKey}
            currentExercise={currentExercise}
            currentReviewExercise={currentReviewExercise}
            isPlaying={isPlaying}
            isLoadingAudio={isLoadingAudio}
            playingLineIdx={playingLineIdx}
            narratedRange={narratedRange}
            speakerVoices={speakerVoices}
            onAudioButton={handleAudioButton}
            onWordClick={handleWordClick}
            onAnswer={handleAnswer}
            onReviewAnswer={handleReviewAnswer}
            onAdvanceFromGrammar={advanceFromGrammar}
            comprehensionAnswered={comprehensionAnswered}
            comprehensionLastCorrect={comprehensionLastCorrect}
            onComprehensionAnswer={handleComprehensionAnswer}
            onDebriefExit={() => router.push('/profile')}
          />
        )}

        {phase !== 'practice' && phase !== 'review' && phase !== 'production' && phase !== 'grammar' && (
          <LessonContinueButton
            phase={phase}
            isLoading={phase === 'intro' ? !introHookReady : store.isLoading}
            rolePlayComplete={store.rolePlayComplete}
            lessonTag={store.lesson?.tag}
            comprehensionAnswered={comprehensionAnswered}
            onAdvance={handleAdvance}
          />
        )}
      </main>

      {(phase === 'practice' || phase === 'review' || phase === 'production') && (
        <CheckButton
          key={`${phase}-${phase === 'review' ? store.reviewIndex : phase === 'production' ? store.checkpointProductionIndex : store.exerciseIndex}-${exerciseRetryKey}`}
          state={checkState}
          retryNotice={retryNotice}
          onCheck={handleCheck}
          onContinue={
            phase === 'review'
              ? handleReviewContinue
              : phase === 'production'
                ? handleContinue
                : handleContinue
          }
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
