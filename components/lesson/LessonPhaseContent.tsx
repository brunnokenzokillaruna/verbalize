import {
  LessonVocabularyScreen,
  LessonHookScreen,
  LessonGrammarScreen,
  LessonMissionScreen,
  LessonMissionRolePlay,
  LessonPhoneticsScreen,
  LessonPracticeScreen,
} from '@/app/(app)/lesson/dynamicScreens';
import { CheckpointBriefingScreen } from '@/components/lesson/CheckpointBriefingScreen';
import { CheckpointListeningScreen } from '@/components/lesson/CheckpointListeningScreen';
import { CheckpointDebriefScreen } from '@/components/lesson/CheckpointDebriefScreen';
import { HOOK_LISTEN_FIRST } from '@/lib/practiceExercises/constants';
import { useLessonStore } from '@/store/lessonStore';
import { useAuthStore } from '@/store/authStore';
import type { Exercise, LessonTag } from '@/types';
import type { WordClickPayload } from '@/components/lesson/ClickableWord';

type LessonPhaseContentProps = {
  phase: string;
  exerciseAnswer: boolean | null;
  setIsExerciseReady: (ready: boolean) => void;
  submitTrigger: number;
  currentExercise?: Exercise;
  currentReviewExercise?: Exercise;
  isPlaying: boolean;
  isLoadingAudio: boolean;
  playingLineIdx: number;
  onAudioButton: () => void;
  onWordClick: (payload: WordClickPayload) => void;
  onAnswer: (correct: boolean) => void;
  onReviewAnswer: (correct: boolean) => void;
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
  currentExercise,
  currentReviewExercise,
  isPlaying,
  isLoadingAudio,
  playingLineIdx,
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
          newVerbs={[...store.discoveredVerbs]}
          dialogueTranslations={store.hook.dialogueTranslations}
          isPlaying={isPlaying}
          isLoadingAudio={isLoadingAudio}
          playingLineIdx={playingLineIdx}
          onAudioButton={onAudioButton}
          onWordClick={onWordClick}
          listenFirstEnabled={HOOK_LISTEN_FIRST}
        />
      )}

      {phase === 'briefing' && store.checkpointSession && (
        <CheckpointBriefingScreen
          briefing={store.checkpointSession.briefing}
          coveredTopics={store.checkpointSession.coveredTopics}
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
          onAnswer={onAnswer}
          setIsExerciseReady={setIsExerciseReady}
          submitTrigger={submitTrigger}
        />
      )}

      {phase === 'debrief' && store.checkpointSession && (
        <CheckpointDebriefScreen
          comprehensionCorrect={store.comprehensionCorrect}
          comprehensionTotal={store.checkpointSession.comprehensionQuestions.length}
          productionCorrect={store.checkpointProductionCorrect}
          productionTotal={store.checkpointSession.productionExercises.length}
          passed={store.checkpointPassed}
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
        />
      )}

      {phase === 'role-play' && store.hook && store.lesson && (
        <LessonMissionRolePlay
          dialogue={store.hook.dialogue}
          dialogueTranslations={store.hook.dialogueTranslations}
          language={store.lesson.language}
          briefing={store.missionBriefing}
          intentMode={['B1', 'B2', 'C1', 'C2'].includes(store.lesson.level)}
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
          onAnswer={onAnswer}
          setIsExerciseReady={setIsExerciseReady}
          submitTrigger={submitTrigger}
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
          onAnswer={onReviewAnswer}
          setIsExerciseReady={setIsExerciseReady}
          submitTrigger={submitTrigger}
        />
      )}
    </>
  );
}
