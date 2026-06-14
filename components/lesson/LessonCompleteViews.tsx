import {
  LessonCompleteScreen,
  LessonMissionDebrief,
} from '@/app/(app)/lesson/dynamicScreens';
import { useLessonStore } from '@/store/lessonStore';

type LessonCompleteViewsProps = {
  onExit: () => void;
};

export function LessonCompleteViews({ onExit }: LessonCompleteViewsProps) {
  const store = useLessonStore();

  if (store.lesson?.tag === 'MISS' && store.missionBriefing && store.hook) {
    return (
      <LessonMissionDebrief
        briefing={store.missionBriefing}
        language={store.lesson.language}
        totalExercises={store.exercises.length}
        correctExercises={store.correctCount}
        newVocabulary={store.hook.newVocabulary}
        linesSpoken={store.rolePlayLinesSpoken}
        totalSpeakable={store.rolePlayTotalSpeakable}
        onExit={onExit}
      />
    );
  }

  return (
    <LessonCompleteScreen
      totalExercises={store.exercises.length}
      correctExercises={store.correctCount}
      newVocabulary={store.hook?.newVocabulary ?? []}
      onExit={onExit}
    />
  );
}
