'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Trophy, Volume2, VolumeX } from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import { useLessonStore } from '@/store/lessonStore';
import { getNextLesson, getNextLessonId, getLessonById, getPreviousTopics } from '@/lib/curriculum';

import { generateHook } from '@/app/actions/generateHook';
import { synthesizeDialogue } from '@/app/actions/synthesizeSpeech';
import { generateGrammarBridge } from '@/app/actions/generateGrammarBridge';
import { getVocabImage } from '@/app/actions/getVocabImage';
import { generatePracticeExercises } from '@/app/actions/generatePracticeExercises';
import { generateMistakeReview } from '@/app/actions/generateMistakeReview';
import { translateWord } from '@/app/actions/translateWord';
import { getVerbConjugation } from '@/app/actions/getVerbConjugation';
import { pregenerateNextLesson } from '@/app/actions/pregenerateNextLesson';
import {
  upsertVocabularyItem,
  logLesson,
  updateLessonStats,
  saveLessonMistake,
  getOldestMistake,
  deleteLessonMistake,
  getPregeneratedLesson,
  deletePregeneratedLesson,
  getUserVocabulary,
} from '@/services/firestore';

import { LessonProgressHeader } from '@/components/lesson/LessonProgressHeader';
import { ClickableSentence } from '@/components/lesson/ClickableSentence';
import { TranslationTooltip } from '@/components/lesson/TranslationTooltip';
import { CheckButton } from '@/components/lesson/CheckButton';
import { LessonLoadingScreen } from '@/components/lesson/LessonLoadingScreen';
import { LessonErrorScreen } from '@/components/lesson/LessonErrorScreen';
import { LessonCompleteScreen } from '@/components/lesson/LessonCompleteScreen';
import { LessonMissionDebrief } from '@/components/lesson/LessonMissionDebrief';
import { LessonMissionRolePlay } from '@/components/lesson/LessonMissionRolePlay';
import { LessonVocabularyScreen } from '@/components/lesson/LessonVocabularyScreen';
import { LessonHookScreen } from '@/components/lesson/LessonHookScreen';
import { LessonGrammarScreen } from '@/components/lesson/LessonGrammarScreen';
import { LessonPracticeScreen } from '@/components/lesson/LessonPracticeScreen';
import { LessonMissionScreen } from '@/components/lesson/LessonMissionScreen';
import { LessonPhoneticsScreen } from '@/components/lesson/LessonPhoneticsScreen';

import { useLessonAudio } from './hooks/useLessonAudio';
import { useLessonFlow } from './hooks/useLessonFlow';
import { useLessonBootstrap } from './hooks/useLessonBootstrap';
import { buildMistakeContext, phaseToStage } from './utils';

import type { LessonStage, GrammarBridgeResult, Exercise } from '@/types';
import type { WordClickPayload } from '@/components/lesson/ClickableWord';



// ── Tooltip state shape ───────────────────────────────────────────────────────

interface TooltipState {
  isOpen: boolean;
  word: string;
  isLoading: boolean;
  translation?: string;
  explanation?: string;
  example?: string;
}

const CLOSED_TOOLTIP: TooltipState = { isOpen: false, word: '', isLoading: false };

// ─────────────────────────────────────────────────────────────────────────────

export default function LessonPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedLessonId = searchParams.get('id') ?? undefined;
  const { user, profile, setProfile } = useAuthStore();
  const store = useLessonStore();

  // Per-exercise answer state
  const [exerciseAnswer, setExerciseAnswer] = useState<boolean | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>(CLOSED_TOOLTIP);

  // ── Audio (Google Cloud TTS — two-voice dialogue) ────────────────────────

  const {
    isPlaying,
    playingLineIdx,
    isLoadingAudio,
    handleAudioButton,
    stopAudio,
  } = useLessonAudio(store.phase, store.lesson, store.hook);

  // Set to true once the user deliberately navigates away so the bootstrap
  // effect doesn't start generating a new lesson after store.reset().
  const exitingRef = useRef(false);

  // Prevents the bootstrap from running more than once per component lifecycle.
  // Resets on handleRetry() so that retries work correctly.
  const lessonInitiatedRef = useRef(false);

  // Prefetch promises — start fetching the next screen's data while the user
  // is still reading/listening on the current screen.
  const grammarBridgePrefetchRef = useRef<Promise<GrammarBridgeResult | null> | null>(null);
  const exercisesPrefetchRef = useRef<Promise<Exercise[] | null> | null>(null);

  // ── Redirect if not authenticated ────────────────────────────────────────

  useEffect(() => {
    if (!user || !profile) {
      router.replace('/login');
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
    finishLesson,
    skipLesson,
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



  const [isExerciseReady, setIsExerciseReady] = useState(false);
  const [submitTrigger, setSubmitTrigger] = useState(0);

  function handleRetry() {
    setHookError(false);
    setExerciseAnswer(null);
    setIsExerciseReady(false);
    lessonInitiatedRef.current = false;
    store.reset(); // resets phase to 'idle' → bootstrap effect re-runs
  }

  // ── Exercise check / continue ─────────────────────────────────────────────

  function handleAnswer(correct: boolean) {
    if (exerciseAnswer !== null) return;
    setExerciseAnswer(correct);
    if (correct) {
      store.recordCorrect();
    } else if (store.lesson) {
      const exercise = store.exercises[store.exerciseIndex];
      if (exercise) {
        store.recordMistake(exercise);
      }
    }
  }

  function handleCheck() {
    setSubmitTrigger(prev => prev + 1);
  }

  function handleReviewAnswer(correct: boolean) {
    if (exerciseAnswer !== null) return;
    setExerciseAnswer(correct);
    if (correct) store.recordReviewCorrect();
  }

  async function handleContinue() {
    const isLast = store.exerciseIndex >= store.exercises.length - 1;
    if (!isLast) {
      setExerciseAnswer(null);
      setIsExerciseReady(false);
      store.nextExercise();
      return;
    }

    // Last practice exercise — finish lesson stats, then check for a mistake to review
    store.setPhase('complete'); // optimistic: overridden below if review is needed
    setExerciseAnswer(null);
    setIsExerciseReady(false);
    finishLesson();

    if (!user || !store.lesson) return;

    // 80% Accuracy Rule: Only save mistakes and show immediate review if accuracy < 80%
    const accuracy = store.correctCount / store.exercises.length;
    if (accuracy >= 0.8) {
      store.setIsLoading(false);
      store.setPhase('complete');
      return;
    }

    // Fire-and-forget saving of all recorded mistakes
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
  }

  async function handleReviewContinue() {
    const isLastReview = store.reviewIndex >= store.reviewExercises.length - 1;
    if (!isLastReview) {
      setExerciseAnswer(null);
      setIsExerciseReady(false);
      store.nextReviewExercise();
      return;
    }

    // Last review exercise — if all 3 correct, delete the mistake
    setExerciseAnswer(null);
    setIsExerciseReady(false);
    if (store.reviewMistake?.id && store.reviewCorrectCount + (exerciseAnswer === true ? 1 : 0) >= store.reviewExercises.length) {
      deleteLessonMistake(store.reviewMistake.id).catch(console.error);
    }
    store.setPhase('complete');
  }

  // ── Click-to-translate ────────────────────────────────────────────────────

  const handleWordClick = useCallback(
    async ({ word }: WordClickPayload) => {
      if (!store.lesson) return;
      setTooltip({ isOpen: true, word, isLoading: true });
      const result = await translateWord(word, store.hook?.dialogue ?? '', store.lesson.language);
      setTooltip({
        isOpen: true,
        word,
        isLoading: false,
        translation: result?.translation,
        explanation: result?.explanation,
        example: result?.example,
      });
    },
    [store.lesson, store.hook],
  );

  const handleFastComplete = useCallback(async () => {
    await finishLesson();
    store.setPhase('complete');
  }, [finishLesson, store]);

  // ── Derived state ─────────────────────────────────────────────────────────

  const phase = store.phase;
  const currentExercise = store.exercises[store.exerciseIndex];
  const currentReviewExercise = store.reviewExercises[store.reviewIndex];
  const activeExercise = phase === 'review' ? currentReviewExercise : currentExercise;

  const checkState = (() => {
    if (exerciseAnswer !== null) {
      return exerciseAnswer ? 'correct' as const : 'incorrect' as const;
    }
    return isExerciseReady ? 'idle' as const : 'disabled' as const;
  })();

  // Correct answer shown in CheckButton banner when wrong
  // (reverse-translation, audio-dictation, and sentence-builder already show it inline)
  const correctAnswerForBanner: string | undefined = (() => {
    if (!activeExercise || exerciseAnswer !== false) return undefined;
    switch (activeExercise.type) {
      case 'context-choice':   return activeExercise.data.blankWord;
      case 'error-correction': return activeExercise.data.correct_word;
      case 'grammar-trap':     return activeExercise.data.options.find(o => o.isCorrect)?.sentence;
      case 'minimal-pair':     return activeExercise.data.correctWord;
      case 'conjugation-speed':return activeExercise.data.correctForm;
      default:                 return undefined;
    }
  })();

  // For exercises that require manual Verificar (like ReverseTranslation / Dictation)
  // those components call onAnswer internally; CheckButton state is driven by exerciseAnswer

  // ── Error screen (must come before loading screen) ───────────────────────

  if (hookError) {
    return <LessonErrorScreen onRetry={handleRetry} onExit={exitLesson} />;
  }

  // ── Navigating away — render nothing to avoid loading screen flash ────────

  if (exitingRef.current) {
    return <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100dvh' }} />;
  }

  // ── Loading screen ────────────────────────────────────────────────────────

  if (phase === 'idle' || phase === 'loading') {
    return <LessonLoadingScreen />;
  }

  // ── Complete screen ───────────────────────────────────────────────────────

  if (phase === 'complete') {
    if (store.lesson?.tag === 'MISS' && store.missionBriefing && store.hook) {
      return (
        <LessonMissionDebrief
          briefing={store.missionBriefing}
          language={store.lesson.language}
          totalExercises={store.exercises.length}
          correctExercises={store.correctCount}
          newVocabulary={store.hook.newVocabulary}
          linesSpoken={store.rolePlayLinesSpoken}
          totalSpeakable={store.rolePlayTotalSpeakable}
          onExit={exitLesson}
        />
      );
    }
    return (
      <LessonCompleteScreen
        totalExercises={store.exercises.length}
        correctExercises={store.correctCount}
        newVocabulary={store.hook?.newVocabulary ?? []}
        onExit={exitLesson}
      />
    );
  }

  // ── Main lesson layout ────────────────────────────────────────────────────

  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100dvh' }}>
      <LessonProgressHeader
        currentStage={phaseToStage(phase)}
        tag={store.lesson?.tag}
        onExit={exitLesson}
      />

      <main className={`mx-auto max-w-lg md:max-w-2xl lg:max-w-4xl px-6 pt-10 ${
        phase === 'practice' || phase === 'review' ? 'pb-48' : 'pb-20'
      }`}>

        {/* ── Vocabulary phase ── */}
        {phase === 'vocabulary' && store.hook && store.lesson && (
          <LessonVocabularyScreen
            isLoading={store.isLoading}
            newVocabulary={store.hook.newVocabulary}
            vocabImages={store.vocabImages}
            vocabTranslations={store.vocabTranslations}
            language={store.lesson.language}
            level={store.lesson.level}
            targetDefinitions={
              store.hook.vocabTranslations
                ? Object.fromEntries(
                    Object.entries(store.hook.vocabTranslations)
                      .filter(([, v]) => v?.example)
                      .map(([k, v]) => [k, v.example])
                  )
                : undefined
            }
          />
        )}

        {phase === 'hook' && store.hook && store.lesson && (
          <LessonHookScreen
            dialogue={store.hook.dialogue}
            newVocabulary={[...store.hook.newVocabulary]}
            newVerbs={[...store.discoveredVerbs]}
            dialogueTranslations={store.hook.dialogueTranslations}
            isPlaying={isPlaying}
            isLoadingAudio={isLoadingAudio}
            playingLineIdx={playingLineIdx}
            onAudioButton={handleAudioButton}
            onWordClick={handleWordClick}
          />
        )}

        {/* ── Grammar phase ── */}
        {phase === 'grammar' && store.grammarBridge && store.lesson && (
          <LessonGrammarScreen
            bridge={store.grammarBridge}
            language={store.lesson.language}
          />
        )}

        {/* ── Mission phase — MISS: before vocabulary ── */}
        {phase === 'mission' && store.missionBriefing && store.lesson && (
          <LessonMissionScreen
            briefing={store.missionBriefing}
            language={store.lesson.language}
          />
        )}

        {/* ── Role-play phase — MISS: replaces hook, user speaks their lines ── */}
        {phase === 'role-play' && store.hook && store.lesson && (
          <LessonMissionRolePlay
            dialogue={store.hook.dialogue}
            dialogueTranslations={store.hook.dialogueTranslations}
            language={store.lesson.language}
            intentMode={['B1', 'B2', 'C1', 'C2'].includes(store.lesson.level)}
            onComplete={(spoken, total) => store.completeRolePlay(spoken, total)}
          />
        )}

        {/* ── Phonetics phase — PRON: after hook ── */}
        {phase === 'phonetics' && store.hook?.phoneticsTip && store.lesson && (
          <LessonPhoneticsScreen
            tip={store.hook.phoneticsTip}
            language={store.lesson.language}
            grammarFocus={store.lesson.grammarFocus}
          />
        )}

        {/* ── Practice phase ── */}
        {phase === 'practice' && currentExercise && store.lesson && (
            <LessonPracticeScreen
              exercises={store.exercises}
              exerciseIndex={store.exerciseIndex}
              currentExercise={currentExercise}
              exerciseAnswer={exerciseAnswer}
              language={store.lesson.language}
              onAnswer={handleAnswer}
              setIsExerciseReady={setIsExerciseReady}
              submitTrigger={submitTrigger}
            />
        )}

        {/* ── Review phase ── */}
        {phase === 'review' && currentReviewExercise && store.lesson && (
          <LessonPracticeScreen
            exercises={store.reviewExercises}
            exerciseIndex={store.reviewIndex}
            currentExercise={currentReviewExercise}
            exerciseAnswer={exerciseAnswer}
            language={store.lesson.language}
            onAnswer={handleReviewAnswer}
            setIsExerciseReady={setIsExerciseReady}
            submitTrigger={submitTrigger}
          />
        )}

        {/* ── Integrated Continue Button (non-practice, non-review phases) ── */}
        {phase !== 'practice' && phase !== 'review' && (
          <div className="mt-10 animate-slide-up delay-300">
            <button
              type="button"
              disabled={store.isLoading || (phase === 'role-play' && !store.rolePlayComplete)}
              onClick={
                phase === 'vocabulary'  ? advanceFromVocabulary :
                phase === 'hook'        ? advanceFromHook :
                phase === 'mission'     ? advanceFromMission :
                phase === 'phonetics'   ? advanceFromPhonetics :
                phase === 'role-play'   ? advanceFromRolePlay :
                                          advanceFromGrammar
              }
              className="cta-shimmer relative flex w-full max-w-sm mx-auto items-center justify-center gap-2.5 overflow-hidden rounded-xl px-6 py-3.5 text-base font-bold transition-all active:scale-[0.98] disabled:cursor-not-allowed"
              style={{
                background: (store.isLoading || (phase === 'role-play' && !store.rolePlayComplete))
                  ? 'var(--color-surface-raised)'
                  : phase === 'role-play'
                    ? 'linear-gradient(135deg, var(--color-success) 0%, #059669 100%)'
                    : 'linear-gradient(135deg, var(--color-primary) 0%, #2563eb 100%)',
                color: (store.isLoading || (phase === 'role-play' && !store.rolePlayComplete)) ? 'var(--color-text-muted)' : '#fff',
                boxShadow: (store.isLoading || (phase === 'role-play' && !store.rolePlayComplete))
                  ? 'none'
                  : phase === 'role-play'
                    ? '0 8px 20px rgba(16,185,129,0.35)'
                    : '0 8px 20px rgba(29,94,212,0.3)',
              }}
            >
              {store.isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm">Sincronizando…</span>
                </>
              ) : phase === 'grammar' ? (
                <>Praticar agora 💪</>
              ) : phase === 'hook' ? (
                <>Entendido!</>
              ) : phase === 'mission' ? (
                <>Aceitar Missão 🚀</>
              ) : phase === 'phonetics' ? (
                <>Entendido, vamos praticar!</>
              ) : phase === 'role-play' ? (
                store.rolePlayComplete
                  ? <>Missão cumprida, ir à prática →</>
                  : <>Finalize a conversa…</>
              ) : (
                <>Avançar →</>
              )}
            </button>
            <p className="mt-3 text-center text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-[0.2em] opacity-50">
              Próximo:{' '}
              {phase === 'vocabulary'
                ? (store.lesson?.tag === 'MISS' ? 'Role-play' : 'Diálogo')
                : phase === 'hook'
                  ? (store.lesson?.tag === 'GRAM' ? 'Gramática' : store.lesson?.tag === 'PRON' ? 'Fonética' : 'Prática')
                  : phase === 'mission'
                    ? 'Vocabulário'
                    : 'Prática'}
            </p>
          </div>
        )}
      </main>

      {/* ── CheckButton (practice + review phases) ── */}
      {(phase === 'practice' || phase === 'review') && (
        <CheckButton
          state={checkState}
          correctAnswer={correctAnswerForBanner}
          onCheck={handleCheck}
          onContinue={phase === 'review' ? handleReviewContinue : handleContinue}
        />
      )}

      {/* ── Translation tooltip ── */}
      {store.lesson && (
        <TranslationTooltip
          word={tooltip.word}
          language={store.lesson.language}
          translation={tooltip.translation}
          explanation={tooltip.explanation}
          example={tooltip.example}
          isOpen={tooltip.isOpen}
          isLoading={tooltip.isLoading}
          onClose={() => setTooltip(CLOSED_TOOLTIP)}
        />
      )}
    </div>
  );
}
