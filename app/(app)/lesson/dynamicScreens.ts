import dynamic from 'next/dynamic';

export const LessonCompleteScreen = dynamic(() =>
  import('@/components/lesson/LessonCompleteScreen').then((m) => m.LessonCompleteScreen),
);

export const LessonMissionDebrief = dynamic(() =>
  import('@/components/lesson/LessonMissionDebrief').then((m) => m.LessonMissionDebrief),
);

export const LessonVocabularyScreen = dynamic(() =>
  import('@/components/lesson/LessonVocabularyScreen').then((m) => m.LessonVocabularyScreen),
);

export const LessonHookScreen = dynamic(() =>
  import('@/components/lesson/LessonHookScreen').then((m) => m.LessonHookScreen),
);

export const LessonGrammarScreen = dynamic(() =>
  import('@/components/lesson/LessonGrammarScreen').then((m) => m.LessonGrammarScreen),
);

export const LessonMissionScreen = dynamic(() =>
  import('@/components/lesson/LessonMissionScreen').then((m) => m.LessonMissionScreen),
);

export const LessonMissionRolePlay = dynamic(() =>
  import('@/components/lesson/LessonMissionRolePlay').then((m) => m.LessonMissionRolePlay),
);

export const LessonPhoneticsScreen = dynamic(() =>
  import('@/components/lesson/LessonPhoneticsScreen').then((m) => m.LessonPhoneticsScreen),
);

export const LessonPracticeScreen = dynamic(() =>
  import('@/components/lesson/LessonPracticeScreen').then((m) => m.LessonPracticeScreen),
);
