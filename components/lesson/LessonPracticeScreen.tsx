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
import { ImageMatchExercise } from './ImageMatchExercise';
import { WordBankTranslation } from './WordBankTranslation';
import { BridgeChoiceExercise } from './BridgeChoiceExercise';
import { ListenAndSelectExercise } from './ListenAndSelectExercise';
import {
  ExerciseSessionHeader,
  ExerciseTypeShell,
} from './ExerciseTypeShell';
import type { Exercise, LessonTag, SupportedLanguage } from '@/types';

interface LessonPracticeScreenProps {
  exercises: Exercise[];
  exerciseIndex: number;
  currentExercise: Exercise;
  exerciseAnswer: boolean | null;
  language: SupportedLanguage;
  lessonTag?: LessonTag;
  onAnswer: (correct: boolean) => void;
  setIsExerciseReady: (ready: boolean) => void;
  submitTrigger: number;
}

const sharedProps = (
  exerciseAnswer: boolean | null,
  setIsExerciseReady: (ready: boolean) => void,
  submitTrigger: number,
  onAnswer: (correct: boolean) => void,
) => ({
  onAnswer,
  answered: exerciseAnswer !== null,
  setIsExerciseReady,
  submitTrigger,
});

export function LessonPracticeScreen({
  exercises,
  exerciseIndex,
  currentExercise,
  exerciseAnswer,
  language,
  lessonTag,
  onAnswer,
  setIsExerciseReady,
  submitTrigger,
}: LessonPracticeScreenProps) {
  const common = sharedProps(
    exerciseAnswer,
    setIsExerciseReady,
    submitTrigger,
    onAnswer,
  );

  function renderExerciseBody() {
    switch (currentExercise.type) {
      case 'context-choice':
        return <ContextChoiceExercise data={currentExercise.data} {...common} />;
      case 'sentence-builder':
        return <SentenceBuilder data={currentExercise.data} {...common} />;
      case 'reverse-translation':
        return (
          <ReverseTranslationInput
            data={currentExercise.data}
            language={language}
            {...common}
          />
        );
      case 'audio-dictation':
        return (
          <DictationInput
            data={currentExercise.data}
            language={language}
            {...common}
          />
        );
      case 'error-correction':
        return <ErrorCorrectionExercise data={currentExercise.data} {...common} />;
      case 'image-match':
        return <ImageMatchExercise data={currentExercise.data} {...common} />;
      case 'word-bank-translation':
        return <WordBankTranslation data={currentExercise.data} {...common} />;
      case 'bridge-choice':
        return <BridgeChoiceExercise data={currentExercise.data} {...common} />;
      case 'listen-and-select':
        return (
          <ListenAndSelectExercise
            data={currentExercise.data}
            language={language}
            {...common}
          />
        );
      case 'speak-repeat':
        return (
          <SpeakRepeatExercise
            data={currentExercise.data}
            language={language}
            strictMode={lessonTag === 'PRON'}
            {...common}
          />
        );
      case 'social-roleplay':
        return <SocialRoleplay data={currentExercise.data} {...common} />;
      case 'scrambled-conversation':
        return <ScrambledConversation data={currentExercise.data} {...common} />;
      case 'interactive-subtitles':
        return <InteractiveSubtitles data={currentExercise.data} {...common} />;
      case 'logic-connectors':
        return <LogicConnectors data={currentExercise.data} {...common} />;
      case 'grammar-trap':
        return <GrammarTrapExercise data={currentExercise.data} {...common} />;
      case 'minimal-pair':
        return (
          <MinimalPairExercise
            data={currentExercise.data}
            language={language}
            {...common}
          />
        );
      case 'conjugation-speed':
        return (
          <ConjugationSpeedExercise
            data={currentExercise.data}
            language={language}
            {...common}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div key={exerciseIndex} className="flex flex-col gap-6 animate-slide-up-spring">
      <ExerciseSessionHeader
        type={currentExercise.type}
        exerciseIndex={exerciseIndex}
        total={exercises.length}
      />

      <ExerciseTypeShell type={currentExercise.type} hideHeader>
        {renderExerciseBody()}
      </ExerciseTypeShell>
    </div>
  );
}
