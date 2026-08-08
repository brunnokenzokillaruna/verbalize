'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import { getMistakeById, deleteLessonMistake, getUserVocabulary } from '@/services/firestore';
import { generateMistakeReview } from '@/app/actions/generateMistakeReview';

import { CheckButton } from '@/components/lesson/CheckButton';
import { LessonPracticeScreen } from '@/components/lesson/LessonPracticeScreen';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import type { ExerciseAnswerMeta } from '@/hooks/useSoundEffects';
import { MistakeReviewShell } from '@/components/mistakes/MistakeReviewShell';
import { MistakeReviewIntro } from '@/components/mistakes/MistakeReviewIntro';
import { MistakeReviewComplete } from '@/components/mistakes/MistakeReviewComplete';
import {
  MISTAKE_REVIEW_MIN,
  MISTAKE_REVIEW_TOTAL,
  MISTAKE_THEME,
} from '@/components/mistakes/mistakeTheme';

import type { Exercise, LessonMistakeDocument } from '@/types';

type Phase = 'loading' | 'ready' | 'practice' | 'complete' | 'error';

function ReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);

  const mistakeId = searchParams.get('id') ?? '';

  const [phase, setPhase] = useState<Phase>('loading');
  const [mistake, setMistake] = useState<LessonMistakeDocument | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [exerciseAnswer, setExerciseAnswer] = useState<boolean | null>(null);
  const [knownVocab, setKnownVocab] = useState<string[]>([]);
  const [isExerciseReady, setIsExerciseReady] = useState(false);
  const [submitTrigger, setSubmitTrigger] = useState(0);
  const [finishing, setFinishing] = useState(false);

  const { play: playSound } = useSoundEffects();

  useEffect(() => {
    if (!mistakeId) {
      router.replace('/profile');
      return;
    }
    let cancelled = false;

    async function load() {
      const doc = await getMistakeById(mistakeId);
      if (!doc) {
        router.replace('/profile');
        return;
      }
      if (cancelled) return;
      setMistake(doc);

      const vocabItems = user ? await getUserVocabulary(user.uid, doc.language) : [];
      const knownVocabulary = vocabItems.map((v) => v.word);
      if (!cancelled) setKnownVocab(knownVocabulary);

      const exs = await generateMistakeReview({
        grammarFocus: doc.grammarFocus,
        mistakeContext: doc.mistakeContext,
        language: doc.language,
        level: doc.level,
        count: MISTAKE_REVIEW_TOTAL,
        knownVocabulary,
      });

      if (cancelled) return;
      if (!exs || exs.length < MISTAKE_REVIEW_MIN) {
        setPhase('error');
        return;
      }
      setExercises(exs);
      setPhase('ready');
    }

    load().catch(() => {
      if (!cancelled) setPhase('error');
    });

    return () => {
      cancelled = true;
    };
  }, [mistakeId, router, user]);

  function handleAnswer(correct: boolean, meta?: ExerciseAnswerMeta) {
    if (exerciseAnswer !== null) return;
    setExerciseAnswer(correct);
    if (meta?.accentOnly) {
      setCorrectCount((n) => n + 1);
      playSound('accent-warning');
    } else if (correct) {
      setCorrectCount((n) => n + 1);
      playSound('correct');
    } else {
      playSound('incorrect');
    }
  }

  function handleContinue() {
    const isLast = currentIndex >= exercises.length - 1;
    if (!isLast) {
      setExerciseAnswer(null);
      setIsExerciseReady(false);
      setSubmitTrigger(0);
      setCurrentIndex((i) => i + 1);
      return;
    }
    setPhase('complete');
    playSound(correctCount >= exercises.length ? 'perfect' : 'complete');
  }

  function handleCheck() {
    setSubmitTrigger((t) => t + 1);
  }

  async function handleComplete() {
    setFinishing(true);
    const allCorrect = correctCount >= exercises.length;
    if (allCorrect && mistake?.id) {
      await deleteLessonMistake(mistake.id).catch(console.error);
    }
    router.push('/profile');
  }

  async function handleRetry() {
    setPhase('loading');
    setCurrentIndex(0);
    setCorrectCount(0);
    setExerciseAnswer(null);
    setIsExerciseReady(false);
    setSubmitTrigger(0);

    if (!mistake) return;
    const exs = await generateMistakeReview({
      grammarFocus: mistake.grammarFocus,
      mistakeContext: mistake.mistakeContext,
      language: mistake.language,
      level: mistake.level,
      count: MISTAKE_REVIEW_TOTAL,
      knownVocabulary: knownVocab,
    });
    if (!exs || exs.length < MISTAKE_REVIEW_MIN) {
      setPhase('error');
      return;
    }
    setExercises(exs);
    setPhase('ready');
  }

  const currentExercise = exercises[currentIndex];

  const checkState = (() => {
    if (exerciseAnswer !== null) {
      return exerciseAnswer ? ('correct' as const) : ('incorrect' as const);
    }
    return isExerciseReady ? ('idle' as const) : ('disabled' as const);
  })();

  const goProfile = () => router.push('/profile');

  if (phase === 'loading') {
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div
          className="pointer-events-none fixed inset-0"
          style={{ background: MISTAKE_THEME.ambient }}
          aria-hidden
        />
        <div className="relative flex flex-col items-center gap-4 text-center">
          <Loader2 size={36} className="animate-spin text-error" />
          <div>
            <p className="font-display text-lg font-bold text-text-primary">
              Preparando revisão…
            </p>
            <p className="text-sm text-text-muted mt-1 max-w-xs">
              Gerando {MISTAKE_REVIEW_TOTAL} exercícios personalizados para este erro
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 py-12 text-center"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ backgroundColor: MISTAKE_THEME.accentLight }}
        >
          <AlertCircle size={32} className="text-error" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-text-primary">
            Erro ao gerar revisão
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-text-muted max-w-sm">
            Não foi possível conectar ao servidor de IA. Verifique sua conexão e tente novamente.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRetry}
          className="rounded-2xl px-8 py-4 text-base font-bold text-white cursor-pointer active:scale-[0.98]"
          style={{ backgroundColor: MISTAKE_THEME.accent }}
        >
          Tentar novamente
        </button>
        <button
          type="button"
          onClick={goProfile}
          className="text-sm font-semibold text-text-muted hover:text-text-primary transition-colors cursor-pointer"
        >
          Voltar ao perfil
        </button>
      </div>
    );
  }

  if (!mistake) return null;

  if (phase === 'ready') {
    return (
      <MistakeReviewShell
        current={0}
        total={exercises.length || MISTAKE_REVIEW_TOTAL}
        grammarFocus={mistake.grammarFocus}
        onClose={goProfile}
      >
        <MistakeReviewIntro
          mistake={mistake}
          totalExercises={exercises.length}
          onStart={() => setPhase('practice')}
          onClose={goProfile}
        />
      </MistakeReviewShell>
    );
  }

  if (phase === 'complete') {
    return (
      <MistakeReviewShell
        current={exercises.length}
        total={exercises.length}
        grammarFocus={mistake.grammarFocus}
        onClose={goProfile}
      >
        <MistakeReviewComplete
          mistake={mistake}
          correctCount={correctCount}
          totalExercises={exercises.length}
          onRetry={handleRetry}
          onFinish={handleComplete}
          finishing={finishing}
        />
      </MistakeReviewShell>
    );
  }

  return (
    <MistakeReviewShell
      current={currentIndex + 1}
      total={exercises.length}
      grammarFocus={mistake.grammarFocus}
      onClose={goProfile}
      footer={
        <CheckButton
          state={checkState}
          onCheck={handleCheck}
          onContinue={handleContinue}
        />
      }
    >
      <div className="px-5 pt-4 pb-4 mx-auto w-full max-w-lg md:max-w-2xl flex flex-col gap-4">
        {currentExercise && (
          <div key={currentIndex} className="animate-slide-up">
            <LessonPracticeScreen
              exercises={exercises}
              exerciseIndex={currentIndex}
              currentExercise={currentExercise}
              exerciseAnswer={exerciseAnswer}
              language={mistake.language}
              onAnswer={handleAnswer}
              setIsExerciseReady={setIsExerciseReady}
              submitTrigger={submitTrigger}
            />
          </div>
        )}
      </div>
    </MistakeReviewShell>
  );
}

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-dvh items-center justify-center"
          style={{ backgroundColor: 'var(--color-bg)' }}
        >
          <Loader2 size={36} className="animate-spin text-error" />
        </div>
      }
    >
      <ReviewContent />
    </Suspense>
  );
}
