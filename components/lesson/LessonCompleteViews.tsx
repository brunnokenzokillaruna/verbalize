'use client';

import { useEffect, useState } from 'react';
import {
  LessonCompleteScreen,
  LessonMissionDebrief,
} from '@/app/(app)/lesson/dynamicScreens';
import { useAuthStore } from '@/store/authStore';
import { useLessonStore } from '@/store/lessonStore';
import { fetchUserProfile } from '@/services/firestore';
import { getWeeklyProductionBreakdown } from '@/lib/productionStatsHelpers';

type LessonCompleteViewsProps = {
  onExit: () => void;
};

export function LessonCompleteViews({ onExit }: LessonCompleteViewsProps) {
  const store = useLessonStore();
  const { user, profile, setProfile } = useAuthStore();
  const [weeklyProduction, setWeeklyProduction] = useState(() =>
    getWeeklyProductionBreakdown(profile),
  );

  useEffect(() => {
    if (!user) return;
    fetchUserProfile(user.uid)
      .then((fresh) => {
        if (fresh) {
          setProfile(fresh);
          setWeeklyProduction(getWeeklyProductionBreakdown(fresh));
        }
      })
      .catch(console.error);
  }, [user, setProfile]);

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
        weeklyProduction={weeklyProduction}
        onExit={onExit}
      />
    );
  }

  if (store.lesson?.tag === 'REVIEW' && store.checkpointSession) {
    const compTotal = store.checkpointSession.comprehensionQuestions.length;
    const prodTotal = store.checkpointSession.productionExercises.length;
    const totalExercises = compTotal + prodTotal;
    const correctExercises =
      store.comprehensionCorrect + store.checkpointProductionCorrect;

    return (
      <LessonCompleteScreen
        totalExercises={totalExercises}
        correctExercises={correctExercises}
        newVocabulary={store.hook?.newVocabulary ?? []}
        weeklyProduction={weeklyProduction}
        onExit={onExit}
      />
    );
  }

  return (
    <LessonCompleteScreen
      totalExercises={store.exercises.length}
      correctExercises={store.correctCount}
      newVocabulary={store.hook?.newVocabulary ?? []}
      weeklyProduction={weeklyProduction}
      onExit={onExit}
    />
  );
}
