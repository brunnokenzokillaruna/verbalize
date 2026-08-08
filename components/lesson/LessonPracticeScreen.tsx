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
import { ListeningComprehensionExercise } from './ListeningComprehensionExercise';
import { ListenAndRespondExercise } from './ListenAndRespondExercise';
import { FreeRoleplayExercise } from './FreeRoleplayExercise';
import { MicroMessageExercise } from './MicroMessageExercise';
import { ParaphraseExercise } from './ParaphraseExercise';
import { FillGapProductionExercise } from './FillGapProductionExercise';
import { MinimalPairProductionExercise } from './MinimalPairProductionExercise';
import { ShadowingExercise } from './ShadowingExercise';
import { TranslationWithConstraintExercise } from './TranslationWithConstraintExercise';
import { VoicemailDictationExercise } from './VoicemailDictationExercise';
import { InferenceToneExercise } from './InferenceToneExercise';
import { ConnectedSpeechExercise } from './ConnectedSpeechExercise';
import { StoryContinuationExercise } from './StoryContinuationExercise';
import { SpotTheRegisterExercise } from './SpotTheRegisterExercise';
import { PromptedMonologueExercise } from './PromptedMonologueExercise';
import {
  ExerciseSessionHeader,
  ExerciseTypeShell,
} from './ExerciseTypeShell';
import type { Exercise, LessonTag, ProficiencyLevel, SupportedLanguage } from '@/types';
import type { ImmersionMode } from '@/lib/immersion';
import type { OnExerciseAnswer } from '@/hooks/useSoundEffects';

interface LessonPracticeScreenProps {
  exercises: Exercise[];
  exerciseIndex: number;
  currentExercise: Exercise;
  exerciseAnswer: boolean | null;
  language: SupportedLanguage;
  level?: ProficiencyLevel;
  immersionMode?: ImmersionMode;
  lessonTag?: LessonTag;
  exerciseRetryKey?: number;
  /** Hook dialogue from the lesson — keeps listen-and-respond from replaying it. */
  lessonDialogue?: string;
  onAnswer: OnExerciseAnswer;
  setIsExerciseReady: (ready: boolean) => void;
  submitTrigger: number;
}

const sharedProps = (
  exerciseAnswer: boolean | null,
  setIsExerciseReady: (ready: boolean) => void,
  submitTrigger: number,
  onAnswer: OnExerciseAnswer,
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
  level,
  immersionMode = 'auto',
  lessonTag,
  lessonDialogue,
  onAnswer,
  setIsExerciseReady,
  submitTrigger,
  exerciseRetryKey = 0,
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
            level={level}
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
        return (
          <ImageMatchExercise
            data={currentExercise.data}
            variant="gallery"
            {...common}
          />
        );
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
      case 'listening-comprehension':
        return (
          <ListeningComprehensionExercise
            data={currentExercise.data}
            language={language}
            level={level}
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
      case 'minimal-pair-production':
        return (
          <MinimalPairProductionExercise
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
      case 'listen-and-respond':
        return (
          <ListenAndRespondExercise
            data={currentExercise.data}
            language={language}
            level={level}
            lessonDialogue={lessonDialogue}
            {...common}
          />
        );
      case 'free-roleplay':
        return (
          <FreeRoleplayExercise
            data={currentExercise.data}
            language={language}
            {...common}
          />
        );
      case 'micro-message':
        return (
          <MicroMessageExercise
            data={currentExercise.data}
            language={language}
            {...common}
          />
        );
      case 'paraphrase':
        return (
          <ParaphraseExercise
            data={currentExercise.data}
            language={language}
            level={level}
            {...common}
          />
        );
      case 'fill-gap-production':
        return (
          <FillGapProductionExercise
            data={currentExercise.data}
            language={language}
            {...common}
          />
        );
      case 'shadowing':
        return (
          <ShadowingExercise
            data={currentExercise.data}
            language={language}
            {...common}
          />
        );
      case 'translation-with-constraint':
        return (
          <TranslationWithConstraintExercise
            data={currentExercise.data}
            language={language}
            {...common}
          />
        );
      case 'voicemail-dictation':
        return (
          <VoicemailDictationExercise
            data={currentExercise.data}
            language={language}
            {...common}
          />
        );
      case 'inference-tone':
        return (
          <InferenceToneExercise
            data={currentExercise.data}
            language={language}
            {...common}
          />
        );
      case 'connected-speech':
        return (
          <ConnectedSpeechExercise
            data={currentExercise.data}
            language={language}
            {...common}
          />
        );
      case 'story-continuation':
        return (
          <StoryContinuationExercise
            data={currentExercise.data}
            language={language}
            {...common}
          />
        );
      case 'spot-the-register':
        return (
          <SpotTheRegisterExercise
            data={currentExercise.data}
            language={language}
            {...common}
          />
        );
      case 'prompted-monologue':
        return (
          <PromptedMonologueExercise
            data={currentExercise.data}
            language={language}
            {...common}
          />
        );
      default: {
        const _exhaustive: never = currentExercise;
        return _exhaustive;
      }
    }
  }

  return (
    <div key={`${exerciseIndex}-${exerciseRetryKey}`} className="flex flex-col gap-6 animate-slide-up-spring">
      <ExerciseSessionHeader
        type={currentExercise.type}
        exerciseIndex={exerciseIndex}
        total={exercises.length}
        language={language}
        level={level}
        immersionMode={immersionMode}
      />

      <ExerciseTypeShell
        type={currentExercise.type}
        hideHeader
        language={language}
        level={level}
        immersionMode={immersionMode}
      >
        {renderExerciseBody()}
      </ExerciseTypeShell>
    </div>
  );
}
