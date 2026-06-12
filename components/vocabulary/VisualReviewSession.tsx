'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { ImageMatchExercise } from '@/components/lesson/ImageMatchExercise';
import { ExerciseTypeShell } from '@/components/lesson/ExerciseTypeShell';
import { ReviewSessionShell } from './ReviewSessionShell';
import { ReviewResultsScreen } from './ReviewResultsScreen';
import { buildImageMatchFromReviewWords } from '@/utils/imageMatchBuilder';
import type { UserVocabularyDocument } from '@/types';
import type { ReviewResult } from './reviewTypes';

interface VisualReviewSessionProps {
  state: 'ready' | 'running' | 'done';
  sessionItems: UserVocabularyDocument[];
  currentIdx: number;
  answered: boolean;
  lastCorrect: boolean | null;
  results: ReviewResult[];
  savingResults: boolean;
  onAnswer: (correct: boolean) => void;
  onContinue: () => void;
  onFinish: () => void;
  onClose: () => void;
  onStart: () => void;
}

export function VisualReviewSession({
  state,
  sessionItems,
  currentIdx,
  answered,
  lastCorrect,
  results,
  savingResults,
  onAnswer,
  onContinue,
  onFinish,
  onClose,
  onStart,
}: VisualReviewSessionProps) {
  const total = sessionItems.length;
  const currentItem = state === 'running' ? sessionItems[currentIdx] : null;
  const [isExerciseReady, setIsExerciseReady] = useState(false);
  const [submitTrigger, setSubmitTrigger] = useState(0);

  useEffect(() => {
    setIsExerciseReady(false);
    setSubmitTrigger(0);
  }, [currentIdx]);

  if (state === 'done') {
    return (
      <ReviewResultsScreen
        title="Revisão visual concluída"
        results={results}
        sessionItems={sessionItems}
        savingResults={savingResults}
        onFinish={onFinish}
        onClose={onClose}
      />
    );
  }

  if (state === 'ready') {
    const withImages = sessionItems.filter((i) => i.imageUrl).length;
    return (
      <ReviewSessionShell modeLabel="Visual" current={0} total={total} onCloseRequest={onClose}>
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 mx-auto max-w-lg w-full text-center gap-8">
          <div>
            <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Revisão visual
            </h2>
            <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
              {withImages} palavras com imagem nesta sessão
            </p>
          </div>
          <button
            type="button"
            onClick={onStart}
            disabled={withImages < 3}
            className="w-full rounded-2xl px-6 py-4 text-base font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {withImages >= 3 ? 'Começar revisão visual' : 'Precisa de pelo menos 3 palavras com imagem'}
          </button>
        </div>
      </ReviewSessionShell>
    );
  }

  if (!currentItem) return null;

  const exercise = buildImageMatchFromReviewWords(
    currentItem.word,
    sessionItems.map((i) => ({
      word: i.word,
      translation: i.translation,
      imageUrl: i.imageUrl,
    })),
  );

  const footer = (
    <>
      {answered && (
        <div
          className="px-5 pt-3 flex flex-col gap-3"
          style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
        >
          <div
            className={`flex items-center gap-2 rounded-xl px-4 py-3 ${
              lastCorrect ? 'bg-emerald-500/10' : 'bg-red-500/10'
            }`}
          >
            {lastCorrect ? (
              <CheckCircle2 size={18} className="text-emerald-500" />
            ) : (
              <XCircle size={18} className="text-red-500" />
            )}
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {lastCorrect ? 'Correto!' : 'Resposta correta revelada acima'}
            </span>
          </div>
          <button
            type="button"
            onClick={onContinue}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold text-white"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Continuar
            <ChevronRight size={18} />
          </button>
        </div>
      )}
      {!answered && isExerciseReady && (
        <div className="px-5 pt-3" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
          <button
            type="button"
            onClick={() => setSubmitTrigger((t) => t + 1)}
            className="w-full rounded-2xl py-4 text-base font-semibold text-white"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Verificar
          </button>
        </div>
      )}
    </>
  );

  if (!exercise || exercise.type !== 'image-match') {
    return (
      <ReviewSessionShell modeLabel="Visual" current={currentIdx + 1} total={total} onCloseRequest={onClose} footer={footer}>
        <p className="text-center text-sm p-6" style={{ color: 'var(--color-text-muted)' }}>
          Sem imagens suficientes para esta palavra. Pulando…
        </p>
      </ReviewSessionShell>
    );
  }

  return (
    <ReviewSessionShell
      modeLabel="Visual"
      current={currentIdx + 1}
      total={total}
      onCloseRequest={onClose}
      footer={footer}
    >
      <div className="flex-1 px-5 py-4 mx-auto max-w-lg w-full">
        <ExerciseTypeShell type="image-match">
          <ImageMatchExercise
            data={exercise.data}
            onAnswer={onAnswer}
            answered={answered}
            setIsExerciseReady={setIsExerciseReady}
            submitTrigger={submitTrigger}
          />
        </ExerciseTypeShell>
      </div>
    </ReviewSessionShell>
  );
}
