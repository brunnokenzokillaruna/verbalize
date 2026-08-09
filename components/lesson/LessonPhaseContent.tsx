'use client';

import { useState } from 'react';
import {
  LessonVocabularyScreen,
  LessonHookScreen,
  LessonGrammarScreen,
  LessonMissionScreen,
  LessonMissionRolePlay,
  LessonMissionLiveRolePlay,
  LessonPhoneticsScreen,
  LessonPracticeScreen,
} from '@/app/(app)/lesson/dynamicScreens';
import { CheckpointBriefingScreen } from '@/components/lesson/CheckpointBriefingScreen';
import { CheckpointListeningScreen } from '@/components/lesson/CheckpointListeningScreen';
import { CheckpointDebriefScreen } from '@/components/lesson/CheckpointDebriefScreen';
import { shouldUseLiveMissionRolePlay } from '@/features/mission-live';
import {
  evaluateCheckpointPass,
  summarizeTopicResults,
} from '@/lib/curriculum/checkpointAssessment';
import { HOOK_LISTEN_FIRST } from '@/lib/practiceExercises/constants';
import { useLessonStore } from '@/store/lessonStore';
import { useAuthStore } from '@/store/authStore';
import type { DialogueSpeakerVoice } from '@/lib/dialogueVoiceAvatars';
import type { NarratedTextRange } from '@/lib/dialogueNarration';
import type { Exercise, LessonTag } from '@/types';
import type { WordClickPayload } from '@/components/lesson/ClickableWord';
import type { OnExerciseAnswer } from '@/hooks/useSoundEffects';

type LessonPhaseContentProps = {
  phase: string;
  exerciseAnswer: boolean | null;
  setIsExerciseReady: (ready: boolean) => void;
  submitTrigger: number;
  exerciseRetryKey?: number;
  currentExercise?: Exercise;
  currentReviewExercise?: Exercise;
  isPlaying: boolean;
  isLoadingAudio: boolean;
  playingLineIdx: number;
  narratedRange: NarratedTextRange | null;
  speakerVoices: DialogueSpeakerVoice[];
  onAudioButton: () => void;
  onWordClick: (payload: WordClickPayload) => void;
  onAnswer: OnExerciseAnswer;
  onReviewAnswer: OnExerciseAnswer;
  onAdvanceFromGrammar: () => void;
  comprehensionAnswered?: boolean;
  comprehensionLastCorrect?: boolean | null;
  onComprehensionAnswer?: (correct: boolean) => void;
  onDebriefExit?: () => void;
};

export function LessonPhaseContent({
  phase,
  exerciseAnswer,
  setIsExerciseReady,
  submitTrigger,
  exerciseRetryKey = 0,
  currentExercise,
  currentReviewExercise,
  isPlaying,
  isLoadingAudio,
  playingLineIdx,
  narratedRange,
  speakerVoices,
  onAudioButton,
  onWordClick,
  onAnswer,
  onReviewAnswer,
  onAdvanceFromGrammar,
  comprehensionAnswered,
  comprehensionLastCorrect,
  onComprehensionAnswer,
  onDebriefExit,
}: LessonPhaseContentProps) {
  const store = useLessonStore();
  const { profile } = useAuthStore();
  const immersionMode = profile?.immersionMode ?? 'auto';
  const [forceScripted, setForceScripted] = useState(false);
  const useLive =
    !!store.lesson &&
    !!store.missionBriefing &&
    shouldUseLiveMissionRolePlay(store.lesson.level) &&
    !forceScripted;

  const checkpointDebrief =
    phase === 'debrief' && store.checkpointSession && store.lesson
      ? {
          ...evaluateCheckpointPass({
            level: store.lesson.level,
            comprehensionCorrect: store.comprehensionCorrect,
            comprehensionTotal: store.checkpointSession.comprehensionQuestions.length,
            productionCorrect: store.checkpointProductionCorrect,
            productionTotal: store.checkpointSession.productionExercises.length,
          }),
          ...summarizeTopicResults(store.checkpointTopicResults),
          comprehensionTotal: store.checkpointSession.comprehensionQuestions.length,
          productionTotal: store.checkpointSession.productionExercises.length,
        }
      : null;

  return (
    <>
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
          newChunks={store.hook.newChunks}
          newVerbs={[...store.discoveredVerbs]}
          vocabTranslations={store.vocabTranslations}
          dialogueTranslations={store.hook.dialogueTranslations}
          isPlaying={isPlaying}
          isLoadingAudio={isLoadingAudio}
          playingLineIdx={playingLineIdx}
          narratedRange={narratedRange}
          speakerVoices={speakerVoices}
          onAudioButton={onAudioButton}
          onWordClick={onWordClick}
          listenFirstEnabled={HOOK_LISTEN_FIRST}
          sceneImage={store.sceneImage}
        />
      )}

      {phase === 'briefing' && store.checkpointSession && (
        <CheckpointBriefingScreen
          briefing={store.checkpointSession.briefing}
          coveredTopics={store.checkpointSession.coveredTopics}
          assessedTopics={store.checkpointSession.assessedTopics}
        />
      )}

      {phase === 'comprehension' && store.checkpointSession && store.lesson && onComprehensionAnswer && (
        <CheckpointListeningScreen
          dialogueAudio={store.checkpointSession.dialogueAudio}
          questions={store.checkpointSession.comprehensionQuestions}
          questionIndex={store.comprehensionIndex}
          language={store.lesson.language}
          isPlaying={isPlaying}
          isLoadingAudio={isLoadingAudio}
          onPlayAudio={onAudioButton}
          onAnswer={onComprehensionAnswer}
          answered={comprehensionAnswered ?? false}
          lastCorrect={comprehensionLastCorrect ?? null}
        />
      )}

      {phase === 'production' && currentExercise && store.lesson && (
        <LessonPracticeScreen
          exercises={store.exercises}
          exerciseIndex={store.checkpointProductionIndex}
          currentExercise={currentExercise}
          exerciseAnswer={exerciseAnswer}
          language={store.lesson.language}
          level={store.lesson.level}
          immersionMode={immersionMode}
          lessonTag={store.lesson.tag as LessonTag}
          lessonDialogue={store.checkpointSession?.dialogueAudio}
          onAnswer={onAnswer}
          setIsExerciseReady={setIsExerciseReady}
          submitTrigger={submitTrigger}
          exerciseRetryKey={exerciseRetryKey}
        />
      )}

      {phase === 'debrief' && checkpointDebrief && (
        <CheckpointDebriefScreen
          comprehensionCorrect={store.comprehensionCorrect}
          comprehensionTotal={checkpointDebrief.comprehensionTotal}
          productionCorrect={store.checkpointProductionCorrect}
          productionTotal={checkpointDebrief.productionTotal}
          passed={store.checkpointPassed}
          overallPct={checkpointDebrief.overallPct}
          strongTopics={checkpointDebrief.strong}
          weakTopics={checkpointDebrief.weak}
          onReviewMistakes={onDebriefExit}
        />
      )}

      {phase === 'grammar' && store.grammarBridge && store.lesson && (
        <LessonGrammarScreen
          bridge={store.grammarBridge}
          language={store.lesson.language}
          tag={store.lesson.tag}
          grammarFocus={store.lesson.grammarFocus}
          newVocabulary={store.hook?.newVocabulary ? [...store.hook.newVocabulary] : []}
          newVerbs={[...store.discoveredVerbs]}
          onWordClick={onWordClick}
          onAdvanceToPractice={onAdvanceFromGrammar}
          onQuizCorrect={(correct) => {
            if (correct) store.setBridgeQuizPassed(true);
          }}
        />
      )}

      {phase === 'mission' && store.missionBriefing && store.lesson && (
        <LessonMissionScreen
          briefing={store.missionBriefing}
          language={store.lesson.language}
          sceneImage={store.sceneImage}
        />
      )}

      {phase === 'role-play' && store.hook && store.lesson && store.missionBriefing && useLive && (
        <LessonMissionLiveRolePlay
          briefing={store.missionBriefing}
          dialogue={store.hook.dialogue}
          language={store.lesson.language}
          level={store.lesson.level}
          lessonTitlePt={store.lesson.uiTitle}
          onFallbackToScripted={() => setForceScripted(true)}
          onComplete={({ userTurns, debrief, completedGoalIndexes }) => {
            store.completeLiveRolePlay({
              spoken: userTurns,
              totalSpeakable: Math.max(store.missionBriefing!.objectives.length, 1),
              completedGoalIndexes,
              debrief,
            });
          }}
        />
      )}

      {phase === 'role-play' && store.hook && store.lesson && (!useLive || forceScripted) && (
        <LessonMissionRolePlay
          dialogue={store.hook.dialogue}
          dialogueTranslations={store.hook.dialogueTranslations}
          language={store.lesson.language}
          briefing={store.missionBriefing}
          intentMode={['B1', 'B2', 'C1', 'C2'].includes(store.lesson.level)}
          rolePlayConsequences={store.hook.rolePlayConsequences}
          onComplete={(spoken, total) => store.completeRolePlay(spoken, total)}
        />
      )}

      {phase === 'phonetics' && store.hook?.phoneticsTip && store.lesson && (
        <LessonPhoneticsScreen
          tip={store.hook.phoneticsTip}
          language={store.lesson.language}
          grammarFocus={store.lesson.grammarFocus}
        />
      )}

      {phase === 'practice' && currentExercise && store.lesson && (
        <LessonPracticeScreen
          exercises={store.exercises}
          exerciseIndex={store.exerciseIndex}
          currentExercise={currentExercise}
          exerciseAnswer={exerciseAnswer}
          language={store.lesson.language}
          level={store.lesson.level}
          immersionMode={immersionMode}
          lessonTag={store.lesson.tag as LessonTag}
          lessonDialogue={store.hook?.dialogue}
          onAnswer={onAnswer}
          setIsExerciseReady={setIsExerciseReady}
          submitTrigger={submitTrigger}
          exerciseRetryKey={exerciseRetryKey}
        />
      )}

      {phase === 'review' && currentReviewExercise && store.lesson && (
        <LessonPracticeScreen
          exercises={store.reviewExercises}
          exerciseIndex={store.reviewIndex}
          currentExercise={currentReviewExercise}
          exerciseAnswer={exerciseAnswer}
          language={store.lesson.language}
          level={store.lesson.level}
          immersionMode={immersionMode}
          lessonDialogue={store.hook?.dialogue}
          onAnswer={onReviewAnswer}
          setIsExerciseReady={setIsExerciseReady}
          submitTrigger={submitTrigger}
          exerciseRetryKey={exerciseRetryKey}
        />
      )}
    </>
  );
}
