'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { ContextChoiceExercise } from '@/components/lesson/ContextChoiceExercise';
import { ReverseTranslationInput } from '@/components/lesson/ReverseTranslationInput';
import { ReviewSessionShell } from './ReviewSessionShell';
import { ReviewResultsScreen } from './ReviewResultsScreen';
import { VocabReviewExerciseFrame } from './VocabReviewExerciseFrame';
import type { VocabReviewItem } from '@/app/actions/generateVocabReview';
import type { UserVocabularyDocument, SupportedLanguage } from '@/types';
import type { ReviewResult } from './reviewTypes';

interface ContextReviewSessionProps {
  state: 'running' | 'done';
  items: VocabReviewItem[];
  sessionItems: UserVocabularyDocument[];
  currentIdx: number;
  answered: boolean;
  lastCorrect: boolean | null;
  results: ReviewResult[];
  language: SupportedLanguage;
  wordImageMap: Record<string, string>;
  savingResults: boolean;
  onAnswer: (correct: boolean) => void;
  onContinue: () => void;
  onFinish: () => void;
  onClose: () => void;
}

export function ContextReviewSession({
  state,
  items,
  sessionItems,
  currentIdx,
  answered,
  lastCorrect,
  results,
  language,
  wordImageMap,
  savingResults,
  onAnswer,
  onContinue,
  onFinish,
  onClose,
}: ContextReviewSessionProps) {
  const total = items.length;
  const currentItem = state === 'running' ? items[currentIdx] : null;
  const [isExerciseReady, setIsExerciseReady] = useState(false);
  const [submitTrigger, setSubmitTrigger] = useState(0);

  useEffect(() => {
    setIsExerciseReady(false);
  }, [currentIdx]);

  if (state === 'done') {
    return (
      <ReviewResultsScreen
        title="Revisão em contexto concluída"
        results={results}
        sessionItems={sessionItems}
        savingResults={savingResults}
        onFinish={onFinish}
        onClose={onClose}
      />
    );
  }

  if (!currentItem) return null;

  const exercise = currentItem.exercise;
  const wordImage = wordImageMap[currentItem.word];
  const exerciseType =
    exercise.type === 'context-choice' || exercise.type === 'reverse-translation'
      ? exercise.type
      : 'context-choice';

  const footer = (
    <>
      {answered && (
        <div
          className="flex items-start gap-3 px-5 py-3"
          style={{
            backgroundColor: lastCorrect ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
            borderTop: `2px solid ${lastCorrect ? 'var(--color-success)' : 'var(--color-error)'}`,
          }}
        >
          {lastCorrect ? (
            <CheckCircle2 size={20} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: 1 }} />
          ) : (
            <XCircle size={20} style={{ color: 'var(--color-error)', flexShrink: 0, marginTop: 1 }} />
          )}
          <p
            className="text-sm font-semibold"
            style={{ color: lastCorrect ? 'var(--color-success)' : 'var(--color-error)' }}
          >
            {lastCorrect ? 'Correto! Nível de memória aumentou.' : 'Incorreto. Continue praticando!'}
          </p>
        </div>
      )}

      <div
        className="px-5 pt-3"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        <button
          type="button"
          disabled={!answered && !isExerciseReady}
          onClick={answered ? onContinue : () => setSubmitTrigger((t) => t + 1)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-semibold transition-all duration-150 active:scale-[0.98]"
          style={{
            backgroundColor: !answered
              ? isExerciseReady
                ? 'var(--color-primary)'
                : 'var(--color-surface-raised)'
              : lastCorrect
                ? 'var(--color-success)'
                : 'var(--color-error)',
            color: !answered && !isExerciseReady ? 'var(--color-text-muted)' : 'var(--color-text-inverse)',
            boxShadow: answered
              ? `0 4px 16px ${lastCorrect ? 'rgba(5,150,105,0.3)' : 'rgba(220,38,38,0.3)'}`
              : isExerciseReady
                ? '0 4px 16px rgba(0,0,0,0.15)'
                : 'none',
            cursor: answered || isExerciseReady ? 'pointer' : 'not-allowed',
          }}
        >
          {!answered ? (
            'Verificar'
          ) : currentIdx + 1 < total ? (
            <>
              Continuar
              <ChevronRight size={20} />
            </>
          ) : (
            <>
              Ver resultados
              <ChevronRight size={20} />
            </>
          )}
        </button>
      </div>
    </>
  );

  return (
    <ReviewSessionShell
      modeLabel="Em contexto"
      current={currentIdx + 1}
      total={total}
      onCloseRequest={onClose}
      footer={footer}
    >
      <div className="flex-1 px-5 pb-6 mx-auto max-w-lg w-full">
        <VocabReviewExerciseFrame
          exerciseType={exerciseType}
          word={currentItem.word}
          wordImage={wordImage}
          language={language}
        >
          {exercise.type === 'context-choice' && (
            <ContextChoiceExercise
              data={exercise.data}
              onAnswer={onAnswer}
              answered={answered}
              setIsExerciseReady={setIsExerciseReady}
              submitTrigger={submitTrigger}
            />
          )}

          {exercise.type === 'reverse-translation' && (
            <ReverseTranslationInput
              data={exercise.data}
              language={language}
              onAnswer={onAnswer}
              answered={answered}
              setIsExerciseReady={setIsExerciseReady}
              submitTrigger={submitTrigger}
            />
          )}
        </VocabReviewExerciseFrame>
      </div>
    </ReviewSessionShell>
  );
}
