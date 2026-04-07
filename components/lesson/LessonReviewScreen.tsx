import React from 'react';
import { ContextChoiceExercise } from './ContextChoiceExercise';
import { ReverseTranslationInput } from './ReverseTranslationInput';
import { ErrorCorrectionExercise } from './ErrorCorrectionExercise';
import type { Exercise, SupportedLanguage } from '@/types';

interface LessonReviewScreenProps {
  reviewExercises: Exercise[];
  reviewIndex: number;
  currentReviewExercise: Exercise;
  exerciseAnswer: boolean | null;
  language: SupportedLanguage;
  reviewMistake?: { grammarFocus?: string } | null;
  onAnswer: (correct: boolean) => void;
}

export function LessonReviewScreen({
  reviewExercises,
  reviewIndex,
  currentReviewExercise,
  exerciseAnswer,
  language,
  reviewMistake,
  onAnswer,
}: LessonReviewScreenProps) {
  return (
    <div key={`review-${reviewIndex}`} className="animate-slide-up-spring">
      {/* Review header */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full animate-ping"
              style={{ backgroundColor: 'var(--color-error)', opacity: 0.4 }}
            />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-error)' }}>
                Revisão de erros
              </p>
              {reviewMistake?.grammarFocus && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  {reviewMistake.grammarFocus}
                </p>
              )}
            </div>
          </div>
          <span
            className="rounded-full px-2.5 py-1 text-xs font-bold tabular-nums"
            style={{ backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)' }}
          >
            {reviewIndex + 1} / {reviewExercises.length}
          </span>
        </div>
        <div className="flex gap-1">
          {reviewExercises.map((_, i) => (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-full transition-all duration-300"
              style={{
                backgroundColor:
                  i < reviewIndex
                    ? 'var(--color-success)'
                    : i === reviewIndex
                      ? 'var(--color-error)'
                      : 'var(--color-border)',
                transform: i === reviewIndex ? 'scaleY(1.3)' : 'scaleY(1)',
              }}
            />
          ))}
        </div>
      </div>

      {currentReviewExercise.type === 'context-choice' && (
        <ContextChoiceExercise
          data={currentReviewExercise.data}
          onAnswer={onAnswer}
          answered={exerciseAnswer !== null}
        />
      )}
      {currentReviewExercise.type === 'error-correction' && (
        <ErrorCorrectionExercise
          data={currentReviewExercise.data}
          onAnswer={onAnswer}
          answered={exerciseAnswer !== null}
        />
      )}
      {currentReviewExercise.type === 'reverse-translation' && (
        <ReverseTranslationInput
          data={currentReviewExercise.data}
          language={language}
          onAnswer={onAnswer}
          answered={exerciseAnswer !== null}
        />
      )}
    </div>
  );
}
