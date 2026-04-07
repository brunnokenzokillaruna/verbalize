import React from 'react';
import { ContextChoiceExercise } from './ContextChoiceExercise';
import { SentenceBuilder } from './SentenceBuilder';
import { ReverseTranslationInput } from './ReverseTranslationInput';
import { DictationInput } from './DictationInput';
import { ErrorCorrectionExercise } from './ErrorCorrectionExercise';
import { VerbConjugationDrill } from './VerbConjugationDrill';
import { SpeakRepeatExercise } from './SpeakRepeatExercise';
import { ImageMatchExercise } from './ImageMatchExercise';
import type { Exercise, SupportedLanguage } from '@/types';

interface LessonPracticeScreenProps {
  exercises: Exercise[];
  exerciseIndex: number;
  currentExercise: Exercise;
  exerciseAnswer: boolean | null;
  language: SupportedLanguage;
  onAnswer: (correct: boolean) => void;
}

export function LessonPracticeScreen({
  exercises,
  exerciseIndex,
  currentExercise,
  exerciseAnswer,
  language,
  onAnswer,
}: LessonPracticeScreenProps) {
  return (
    <div key={exerciseIndex} className="animate-slide-up-spring">
      {/* Progress header */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-base">✏️</span>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
              Prática
            </p>
          </div>
          <span
            className="rounded-full px-2.5 py-1 text-xs font-bold tabular-nums"
            style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
          >
            {exerciseIndex + 1} / {exercises.length}
          </span>
        </div>
        {/* Segmented progress bar */}
        <div className="flex gap-1">
          {exercises.map((_, i) => (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-full transition-all duration-300"
              style={{
                backgroundColor: i < exerciseIndex
                  ? 'var(--color-success)'
                  : i === exerciseIndex
                    ? 'var(--color-primary)'
                    : 'var(--color-border)',
                transform: i === exerciseIndex ? 'scaleY(1.3)' : 'scaleY(1)',
              }}
            />
          ))}
        </div>
      </div>

      {currentExercise.type === 'context-choice' && (
        <ContextChoiceExercise
          data={currentExercise.data}
          onAnswer={onAnswer}
          answered={exerciseAnswer !== null}
        />
      )}
      {currentExercise.type === 'sentence-builder' && (
        <SentenceBuilder
          data={currentExercise.data}
          onAnswer={onAnswer}
          answered={exerciseAnswer !== null}
        />
      )}
      {currentExercise.type === 'reverse-translation' && (
        <ReverseTranslationInput
          data={currentExercise.data}
          language={language}
          onAnswer={onAnswer}
          answered={exerciseAnswer !== null}
        />
      )}
      {currentExercise.type === 'audio-dictation' && (
        <DictationInput
          data={currentExercise.data}
          language={language}
          onAnswer={onAnswer}
          answered={exerciseAnswer !== null}
        />
      )}
      {currentExercise.type === 'error-correction' && (
        <ErrorCorrectionExercise
          data={currentExercise.data}
          onAnswer={onAnswer}
          answered={exerciseAnswer !== null}
        />
      )}
      {currentExercise.type === 'verb-conjugation-drill' && (
        <VerbConjugationDrill
          data={currentExercise.data}
          onAnswer={onAnswer}
          answered={exerciseAnswer !== null}
        />
      )}
      {currentExercise.type === 'speak-repeat' && (
        <SpeakRepeatExercise
          data={currentExercise.data}
          language={language}
          onAnswer={onAnswer}
          answered={exerciseAnswer !== null}
        />
      )}
      {currentExercise.type === 'image-match' && (
        <ImageMatchExercise
          data={currentExercise.data}
          onAnswer={onAnswer}
          answered={exerciseAnswer !== null}
        />
      )}
    </div>
  );
}
