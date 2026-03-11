'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, X, Trophy, RefreshCw } from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import { getMistakeById, deleteLessonMistake, getUserVocabulary } from '@/services/firestore';
import { generateMistakeReview } from '@/app/actions/generateMistakeReview';

import { CheckButton } from '@/components/lesson/CheckButton';
import { ContextChoiceExercise } from '@/components/lesson/ContextChoiceExercise';
import { ErrorCorrectionExercise } from '@/components/lesson/ErrorCorrectionExercise';
import { ReverseTranslationInput } from '@/components/lesson/ReverseTranslationInput';

import type { Exercise, LessonMistakeDocument } from '@/types';

const TOTAL = 5;

type Phase = 'loading' | 'practice' | 'complete' | 'error';

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

  // Load mistake + generate exercises
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

      // Fetch known vocabulary in parallel with nothing (sequential is fine — fast Firestore read)
      const vocabItems = user ? await getUserVocabulary(user.uid, doc.language) : [];
      const knownVocabulary = vocabItems.map((v) => v.word);
      if (!cancelled) setKnownVocab(knownVocabulary);

      const exs = await generateMistakeReview({
        grammarFocus: doc.grammarFocus,
        mistakeContext: doc.mistakeContext,
        language: doc.language,
        level: doc.level,
        count: TOTAL,
        knownVocabulary,
      });

      if (cancelled) return;
      if (!exs || exs.length < TOTAL) {
        setPhase('error');
        return;
      }
      setExercises(exs);
      setPhase('practice');
    }

    load().catch(() => {
      if (!cancelled) setPhase('error');
    });

    return () => { cancelled = true; };
  }, [mistakeId, router]);

  function handleAnswer(correct: boolean) {
    setExerciseAnswer(correct);
    if (correct) setCorrectCount((n) => n + 1);
  }

  function handleContinue() {
    const isLast = currentIndex >= exercises.length - 1;
    if (!isLast) {
      setExerciseAnswer(null);
      setCurrentIndex((i) => i + 1);
      return;
    }
    // Last exercise — go to complete (correctCount is already up-to-date)
    setPhase('complete');
  }

  function handleCheck() {
    // Context-choice and error-correction call onAnswer directly;
    // this is a no-op but required by CheckButton API
  }

  async function handleComplete() {
    // exerciseAnswer holds result of last exercise; correctCount may not include it yet
    const finalCorrect = correctCount;
    const allCorrect = finalCorrect >= TOTAL;
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

    if (!mistake) return;
    const exs = await generateMistakeReview({
      grammarFocus: mistake.grammarFocus,
      mistakeContext: mistake.mistakeContext,
      language: mistake.language,
      level: mistake.level,
      count: TOTAL,
      knownVocabulary: knownVocab,
    });
    if (!exs || exs.length < TOTAL) {
      setPhase('error');
      return;
    }
    setExercises(exs);
    setPhase('practice');
  }

  // Correct answer for CheckButton banner (inline exercises handle it themselves)
  const currentExercise = exercises[currentIndex];
  const correctAnswerForBanner: string | undefined = (() => {
    if (!currentExercise || exerciseAnswer !== false) return undefined;
    switch (currentExercise.type) {
      case 'context-choice':   return currentExercise.data.blankWord;
      case 'error-correction': return currentExercise.data.correct_word;
      default:                 return undefined;
    }
  })();

  const checkState = (() => {
    if (exerciseAnswer === null) return 'disabled' as const;
    return exerciseAnswer ? 'correct' as const : 'incorrect' as const;
  })();

  // ── Loading ────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center gap-4"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <Loader2 size={36} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Gerando exercícios de revisão…
        </p>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 py-12 text-center"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full text-3xl"
          style={{ backgroundColor: 'var(--color-error-bg)' }}
        >
          ⚠️
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Erro ao gerar revisão
          </h2>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Não foi possível conectar ao servidor de IA. Verifique sua conexão e tente novamente.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRetry}
          className="rounded-2xl px-8 py-4 text-base font-semibold transition-all active:scale-95"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-text-inverse)' }}
        >
          Tentar novamente
        </button>
        <button
          type="button"
          onClick={() => router.push('/profile')}
          className="text-sm transition-opacity hover:opacity-70"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Voltar ao perfil
        </button>
      </div>
    );
  }

  // ── Complete ───────────────────────────────────────────────────────────────
  if (phase === 'complete') {
    const finalCorrect = correctCount;
    const allCorrect = finalCorrect >= TOTAL;
    const pct = Math.round((finalCorrect / TOTAL) * 100);

    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center gap-6 px-5 py-12 text-center"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full"
          style={{
            backgroundColor: allCorrect
              ? 'var(--color-success-bg)'
              : 'var(--color-primary-light)',
          }}
        >
          {allCorrect
            ? <Trophy size={40} style={{ color: 'var(--color-success)' }} />
            : <RefreshCw size={40} style={{ color: 'var(--color-primary)' }} />}
        </div>

        <div>
          <h1
            className="font-display text-3xl font-bold"
            style={{ color: allCorrect ? 'var(--color-success)' : 'var(--color-text-primary)' }}
          >
            {allCorrect ? 'Erro revisado!' : `${pct}% de acerto`}
          </h1>
          <p className="mt-2 text-base" style={{ color: 'var(--color-text-secondary)' }}>
            {allCorrect
              ? 'Você acertou todos os exercícios. Este erro foi removido do seu perfil.'
              : `Você acertou ${finalCorrect} de ${TOTAL} exercícios. Continue praticando!`}
          </p>
        </div>

        {mistake && (
          <div
            className="w-full max-w-sm rounded-2xl px-4 py-3 text-left"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
              Tópico revisado
            </p>
            <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {mistake.grammarFocus}
            </p>
          </div>
        )}

        <div className="flex w-full max-w-sm flex-col gap-3">
          {!allCorrect && (
            <button
              type="button"
              onClick={handleRetry}
              className="rounded-2xl px-6 py-4 text-base font-semibold transition-all active:scale-95"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-text-inverse)' }}
            >
              Tentar novamente
            </button>
          )}
          <button
            type="button"
            onClick={handleComplete}
            className="rounded-2xl px-6 py-4 text-base font-semibold transition-all active:scale-95"
            style={{
              backgroundColor: allCorrect ? 'var(--color-success)' : 'var(--color-surface)',
              color: allCorrect ? 'var(--color-text-inverse)' : 'var(--color-text-primary)',
              border: allCorrect ? 'none' : '1px solid var(--color-border)',
            }}
          >
            {allCorrect ? 'Voltar ao perfil' : 'Voltar ao perfil'}
          </button>
        </div>
      </div>
    );
  }

  // ── Practice ───────────────────────────────────────────────────────────────
  return (
    <div
      className="flex min-h-dvh flex-col"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center gap-3 px-5 pt-5 pb-3"
        style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}
      >
        <button
          type="button"
          onClick={() => router.push('/profile')}
          aria-label="Voltar ao perfil"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all active:scale-90"
          style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-muted)' }}
        >
          <X size={18} />
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest truncate" style={{ color: 'var(--color-error)' }}>
            Revisão de erros
          </p>
          {mistake && (
            <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
              {mistake.grammarFocus}
            </p>
          )}
        </div>

        {/* Progress dots */}
        <div className="flex gap-1 shrink-0">
          {exercises.map((_, i) => (
            <div
              key={i}
              className="h-1.5 w-6 rounded-full transition-colors duration-300"
              style={{
                backgroundColor:
                  i < currentIndex
                    ? 'var(--color-success)'
                    : i === currentIndex
                      ? 'var(--color-error)'
                      : 'var(--color-border)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Exercise */}
      <div className="px-5 pb-56 pt-6 mx-auto w-full max-w-lg md:max-w-2xl lg:max-w-4xl">
        {currentExercise && (
          <div key={currentIndex} className="animate-slide-up">
            <p className="mb-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Exercício {currentIndex + 1} / {exercises.length}
            </p>

            {currentExercise.type === 'context-choice' && (
              <ContextChoiceExercise
                data={currentExercise.data}
                onAnswer={handleAnswer}
                answered={exerciseAnswer !== null}
              />
            )}
            {currentExercise.type === 'error-correction' && (
              <ErrorCorrectionExercise
                data={currentExercise.data}
                onAnswer={handleAnswer}
                answered={exerciseAnswer !== null}
              />
            )}
            {currentExercise.type === 'reverse-translation' && (
              <ReverseTranslationInput
                data={currentExercise.data}
                onAnswer={handleAnswer}
                answered={exerciseAnswer !== null}
              />
            )}
          </div>
        )}
      </div>

      {/* CheckButton */}
      <CheckButton
        state={checkState}
        correctAnswer={correctAnswerForBanner}
        onCheck={handleCheck}
        onContinue={handleContinue}
      />
    </div>
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
          <Loader2 size={36} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
        </div>
      }
    >
      <ReviewContent />
    </Suspense>
  );
}
