import React from 'react';
import { ContextChoiceExercise } from './ContextChoiceExercise';
import { SentenceBuilder } from './SentenceBuilder';
import { ReverseTranslationInput } from './ReverseTranslationInput';
import { DictationInput } from './DictationInput';
import { ErrorCorrectionExercise } from './ErrorCorrectionExercise';
import { SocialRoleplay } from './SocialRoleplay';
import { ScrambledConversation } from './ScrambledConversation';
import { InteractiveSubtitles } from './InteractiveSubtitles';
import { LogicConnectors } from './LogicConnectors';
import { SpeakRepeatExercise } from './SpeakRepeatExercise';
import { GrammarTrapExercise } from './GrammarTrapExercise';
import { MinimalPairExercise } from './MinimalPairExercise';
import { ConjugationSpeedExercise } from './ConjugationSpeedExercise';
import type { Exercise, SupportedLanguage } from '@/types';

interface LessonPracticeScreenProps {
  exercises: Exercise[];
  exerciseIndex: number;
  currentExercise: Exercise;
  exerciseAnswer: boolean | null;
  language: SupportedLanguage;
  onAnswer: (correct: boolean) => void;
  setIsExerciseReady: (ready: boolean) => void;
  submitTrigger: number;
}

export function LessonPracticeScreen({
  exercises,
  exerciseIndex,
  currentExercise,
  exerciseAnswer,
  language,
  onAnswer,
  setIsExerciseReady,
  submitTrigger,
}: LessonPracticeScreenProps) {
  return (
    <div key={exerciseIndex} className="flex flex-col gap-8 animate-slide-up-spring">
      {/* Refined Header & Progress */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-base shadow-inner ring-1 ring-white/10 backdrop-blur-md dark:bg-white/5">
              ✏️
            </div>
            <div className="flex flex-col">
              <h2 className="font-display text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
                Praticar & Fixar
              </h2>
              <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-[0.2em]">
                Etapa {exerciseIndex + 1} de {exercises.length}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black tracking-widest text-[var(--color-primary)] opacity-40 tabular-nums">
              LEVEL {Math.floor((exerciseIndex / exercises.length) * 100)}%
            </span>
          </div>
        </div>

        {/* Delicate Progress Line */}
        <div className="relative h-1 w-full overflow-hidden rounded-full bg-[var(--color-surface-raised)]">
          <div 
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-[var(--color-primary)] to-[#2563eb] transition-all duration-700 ease-out"
            style={{ width: `${((exerciseIndex + 1) / exercises.length) * 100}%` }}
          />
        </div>
      </div>

      {currentExercise.type === 'context-choice' && (
        <ContextChoiceExercise
          data={currentExercise.data}
          onAnswer={onAnswer}
          answered={exerciseAnswer !== null}
          setIsExerciseReady={setIsExerciseReady}
          submitTrigger={submitTrigger}
        />
      )}
      {currentExercise.type === 'sentence-builder' && (
        <SentenceBuilder
          data={currentExercise.data}
          onAnswer={onAnswer}
          answered={exerciseAnswer !== null}
          setIsExerciseReady={setIsExerciseReady}
          submitTrigger={submitTrigger}
        />
      )}
      {currentExercise.type === 'reverse-translation' && (
        <ReverseTranslationInput
          data={currentExercise.data}
          language={language}
          onAnswer={onAnswer}
          answered={exerciseAnswer !== null}
          setIsExerciseReady={setIsExerciseReady}
          submitTrigger={submitTrigger}
        />
      )}
      {currentExercise.type === 'audio-dictation' && (
        <DictationInput
          data={currentExercise.data}
          language={language}
          onAnswer={onAnswer}
          answered={exerciseAnswer !== null}
          setIsExerciseReady={setIsExerciseReady}
          submitTrigger={submitTrigger}
        />
      )}
      {currentExercise.type === 'error-correction' && (
        <ErrorCorrectionExercise
          data={currentExercise.data}
          onAnswer={onAnswer}
          answered={exerciseAnswer !== null}
          setIsExerciseReady={setIsExerciseReady}
          submitTrigger={submitTrigger}
        />
      )}
      {currentExercise.type === 'speak-repeat' && (
        <SpeakRepeatExercise
          data={currentExercise.data}
          language={language}
          onAnswer={onAnswer}
          answered={exerciseAnswer !== null}
          setIsExerciseReady={setIsExerciseReady}
          submitTrigger={submitTrigger}
        />
      )}
      {currentExercise.type === 'social-roleplay' && (
        <SocialRoleplay
          data={currentExercise.data}
          onAnswer={onAnswer}
          answered={exerciseAnswer !== null}
          setIsExerciseReady={setIsExerciseReady}
        />
      )}
      {currentExercise.type === 'scrambled-conversation' && (
        <ScrambledConversation
          data={currentExercise.data}
          onAnswer={onAnswer}
          answered={exerciseAnswer !== null}
          setIsExerciseReady={setIsExerciseReady}
        />
      )}
      {currentExercise.type === 'interactive-subtitles' && (
        <InteractiveSubtitles
          data={currentExercise.data}
          onAnswer={onAnswer}
          answered={exerciseAnswer !== null}
          setIsExerciseReady={setIsExerciseReady}
        />
      )}
      {currentExercise.type === 'logic-connectors' && (
        <LogicConnectors
          data={currentExercise.data}
          onAnswer={onAnswer}
          answered={exerciseAnswer !== null}
          setIsExerciseReady={setIsExerciseReady}
        />
      )}
      {currentExercise.type === 'grammar-trap' && (
        <GrammarTrapExercise
          data={currentExercise.data}
          onAnswer={onAnswer}
          answered={exerciseAnswer !== null}
          setIsExerciseReady={setIsExerciseReady}
          submitTrigger={submitTrigger}
        />
      )}
      {currentExercise.type === 'minimal-pair' && (
        <MinimalPairExercise
          data={currentExercise.data}
          language={language}
          onAnswer={onAnswer}
          answered={exerciseAnswer !== null}
          setIsExerciseReady={setIsExerciseReady}
          submitTrigger={submitTrigger}
        />
      )}
      {currentExercise.type === 'conjugation-speed' && (
        <ConjugationSpeedExercise
          data={currentExercise.data}
          onAnswer={onAnswer}
          answered={exerciseAnswer !== null}
          setIsExerciseReady={setIsExerciseReady}
          submitTrigger={submitTrigger}
        />
      )}
    </div>
  );
}
