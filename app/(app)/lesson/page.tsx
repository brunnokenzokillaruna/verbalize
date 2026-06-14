'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import { useLessonStore } from '@/store/lessonStore';

import { generateMistakeReview } from '@/app/actions/generateMistakeReview';
import { translateWord } from '@/app/actions/translateWord';
import {
  saveLessonMistake,
  getOldestMistake,
  deleteLessonMistake,
} from '@/services/firestore';

import { TranslationTooltip } from '@/components/lesson/TranslationTooltip';
import { CheckButton } from '@/components/lesson/CheckButton';
import { LessonProgressHeader } from '@/components/lesson/LessonProgressHeader';
import { formatErrorCorrectionAnswer } from '@/utils/errorCorrection';
import { LessonLoadingScreen } from '@/components/lesson/LessonLoadingScreen';
import { LessonErrorScreen } from '@/components/lesson/LessonErrorScreen';

const LessonCompleteScreen = dynamic(() =>
  import('@/components/lesson/LessonCompleteScreen').then((m) => m.LessonCompleteScreen),
);
const LessonMissionDebrief = dynamic(() =>
  import('@/components/lesson/LessonMissionDebrief').then((m) => m.LessonMissionDebrief),
);
const LessonVocabularyScreen = dynamic(() =>
  import('@/components/lesson/LessonVocabularyScreen').then((m) => m.LessonVocabularyScreen),
);
const LessonHookScreen = dynamic(() =>
  import('@/components/lesson/LessonHookScreen').then((m) => m.LessonHookScreen),
);
const LessonGrammarScreen = dynamic(() =>
  import('@/components/lesson/LessonGrammarScreen').then((m) => m.LessonGrammarScreen),
);
const LessonMissionScreen = dynamic(() =>
  import('@/components/lesson/LessonMissionScreen').then((m) => m.LessonMissionScreen),
);
const LessonMissionRolePlay = dynamic(() =>
  import('@/components/lesson/LessonMissionRolePlay').then((m) => m.LessonMissionRolePlay),
);
const LessonPhoneticsScreen = dynamic(() =>
  import('@/components/lesson/LessonPhoneticsScreen').then((m) => m.LessonPhoneticsScreen),
);
const LessonPracticeScreen = dynamic(() =>
  import('@/components/lesson/LessonPracticeScreen').then((m) => m.LessonPracticeScreen),
);

import { useLessonAudio } from './hooks/useLessonAudio';
import { useLessonFlow } from './hooks/useLessonFlow';
import { useLessonBootstrap } from './hooks/useLessonBootstrap';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { buildMistakeContext, phaseToStage } from './utils';

import type { GrammarBridgeResult, Exercise, LessonTag } from '@/types';

const TAGS_WITH_GRAMMAR_PHASE: ReadonlySet<LessonTag> = new Set(['GRAM', 'VERB', 'CULT', 'VOC', 'DIAL', 'EXPR']);
import type { WordClickPayload } from '@/components/lesson/ClickableWord';



// ── Tooltip state shape ───────────────────────────────────────────────────────

interface TooltipState {
  isOpen: boolean;
  word: string;
  isLoading: boolean;
  translation?: string;
  explanation?: string;
  example?: string;
  partOfSpeech?: string;
  infinitive?: string;
}

const CLOSED_TOOLTIP: TooltipState = { isOpen: false, word: '', isLoading: false };

// ─────────────────────────────────────────────────────────────────────────────

export default function LessonPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedLessonId = searchParams.get('id') ?? undefined;
  const { user, profile } = useAuthStore();
  const store = useLessonStore();

  // Per-exercise answer state
  const [exerciseAnswer, setExerciseAnswer] = useState<boolean | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>(CLOSED_TOOLTIP);

  const { play: playSound, isMuted, toggleMute } = useSoundEffects();

  const playCompletionSound = useCallback(() => {
    const total = store.exercises.length;
    const isPerfect = total > 0 && store.correctCount >= total;
    playSound(isPerfect ? 'perfect' : 'complete');
  }, [store.exercises.length, store.correctCount, playSound]);

  // ── Audio (Google Cloud TTS — two-voice dialogue) ────────────────────────

  const {
    isPlaying,
    playingLineIdx,
    isLoadingAudio,
    handleAudioButton,
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
      playSound('correct');
    } else if (store.lesson) {
      const exercise = store.exercises[store.exerciseIndex];
      if (exercise) {
        store.recordMistake(exercise);
      }
      playSound('incorrect');
    }
  }

  function handleCheck() {
    setSubmitTrigger(prev => prev + 1);
  }

  function handleReviewAnswer(correct: boolean) {
    if (exerciseAnswer !== null) return;
    setExerciseAnswer(correct);
    if (correct) {
      store.recordReviewCorrect();
      playSound('correct');
    } else {
      playSound('incorrect');
    }
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

    if (!user || !store.lesson) {
      playCompletionSound();
      return;
    }

    // 80% Accuracy Rule: Only save mistakes and show immediate review if accuracy < 80%
    const accuracy = store.correctCount / store.exercises.length;
    if (accuracy >= 0.8) {
      store.setIsLoading(false);
      store.setPhase('complete');
      playCompletionSound();
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
    playCompletionSound();
  }

  // ── Click-to-translate ────────────────────────────────────────────────────

  const handleWordClick = useCallback(
    async ({ word, isNewVerb }: WordClickPayload) => {
      if (!store.lesson) return;
      setTooltip({ isOpen: true, word, isLoading: true });
      const result = await translateWord(word, store.hook?.dialogue ?? '', store.lesson.language, isNewVerb);
      setTooltip({
        isOpen: true,
        word,
        isLoading: false,
        translation: result?.translation,
        explanation: result?.explanation,
        example: result?.example,
        partOfSpeech: result?.partOfSpeech,
        infinitive: result?.infinitive,
      });
    },
    [store.lesson, store.hook],
  );

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
      case 'error-correction': return formatErrorCorrectionAnswer(activeExercise.data);
      case 'grammar-trap':     return activeExercise.data.options.find(o => o.isCorrect)?.sentence;
      case 'minimal-pair':     return activeExercise.data.correctWord;
      case 'conjugation-speed':return activeExercise.data.correctForm;
      case 'bridge-choice':    return activeExercise.data.options[activeExercise.data.correctIndex];
      case 'listen-and-select':return activeExercise.data.options[activeExercise.data.correctIndex];
      case 'image-match':      return activeExercise.data.targetWord;
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
        isMuted={isMuted}
        onToggleMute={toggleMute}
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
            targetDefinitions={undefined}
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
            tag={store.lesson.tag}
            grammarFocus={store.lesson.grammarFocus}
            newVocabulary={store.hook?.newVocabulary ? [...store.hook.newVocabulary] : []}
            newVerbs={[...store.discoveredVerbs]}
            onWordClick={handleWordClick}
            onAdvanceToPractice={advanceFromGrammar}
            onQuizCorrect={(correct) => {
              if (correct) store.setBridgeQuizPassed(true);
            }}
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
              lessonTag={store.lesson.tag}
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
        {phase !== 'practice' && phase !== 'review' && phase !== 'grammar' && (
          <div className="mt-10 animate-slide-up delay-300">
            <button
              type="button"
              disabled={
                store.isLoading ||
                (phase === 'role-play' && !store.rolePlayComplete)
              }
              onClick={
                phase === 'vocabulary'  ? advanceFromVocabulary :
                phase === 'hook'        ? advanceFromHook :
                phase === 'mission'     ? advanceFromMission :
                phase === 'phonetics'   ? advanceFromPhonetics :
                phase === 'role-play'   ? advanceFromRolePlay :
                                          advanceFromGrammar
              }
              className={[
                "cta-shimmer relative flex w-full max-w-sm mx-auto items-center justify-center gap-2.5 overflow-hidden rounded-2xl px-6 py-4 text-base font-bold",
                "transition-all duration-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-[#f59e0b]",
                (store.isLoading || (phase === 'role-play' && !store.rolePlayComplete))
                  ? "cursor-not-allowed border border-[var(--color-border)]"
                  : "cursor-pointer active:translate-y-[2px] active:border-b-[2px]"
              ].filter(Boolean).join(" ")}
              style={{
                background: (store.isLoading || (phase === 'role-play' && !store.rolePlayComplete))
                  ? 'var(--color-surface-raised)'
                  : phase === 'role-play'
                    ? 'var(--color-success)'
                    : 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
                color: (store.isLoading || (phase === 'role-play' && !store.rolePlayComplete)) ? 'var(--color-text-muted)' : '#fff',
                borderBottomWidth: (store.isLoading || (phase === 'role-play' && !store.rolePlayComplete)) ? '1px' : '4px',
                borderBottomColor: (store.isLoading || (phase === 'role-play' && !store.rolePlayComplete))
                  ? 'var(--color-border)'
                  : 'rgba(0, 0, 0, 0.35)',
                boxShadow: (store.isLoading || (phase === 'role-play' && !store.rolePlayComplete))
                  ? 'none'
                  : phase === 'role-play'
                    ? '0 6px 16px rgba(16,185,129,0.3)'
                    : '0 6px 16px rgba(29,94,212,0.25)',
              }}
            >
              {store.isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm">Sincronizando…</span>
                </>
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
                  ? (store.lesson?.tag && TAGS_WITH_GRAMMAR_PHASE.has(store.lesson.tag)
                      ? 'Gramática'
                      : store.lesson?.tag === 'PRON'
                        ? 'Fonética'
                        : 'Prática')
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
          partOfSpeech={tooltip.partOfSpeech}
          infinitive={tooltip.infinitive}
          isOpen={tooltip.isOpen}
          isLoading={tooltip.isLoading}
          onClose={() => setTooltip(CLOSED_TOOLTIP)}
        />
      )}
    </div>
  );
}
