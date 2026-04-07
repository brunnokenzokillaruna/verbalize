import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useLessonStore } from '@/store/lessonStore';
import { getNextLessonId, getLessonById, getPreviousTopics } from '@/lib/curriculum';
import { generateGrammarBridge } from '@/app/actions/generateGrammarBridge';
import { generatePracticeExercises } from '@/app/actions/generatePracticeExercises';
import { getVerbConjugation } from '@/app/actions/getVerbConjugation';
import { pregenerateNextLesson } from '@/app/actions/pregenerateNextLesson';
import { logLesson, updateLessonStats, upsertVocabularyItem } from '@/services/firestore';
import type { GrammarBridgeResult, Exercise } from '@/types';

interface UseLessonFlowProps {
  exitingRef: React.MutableRefObject<boolean>;
  grammarBridgePrefetchRef: React.MutableRefObject<Promise<GrammarBridgeResult | null> | null>;
  exercisesPrefetchRef: React.MutableRefObject<Promise<Exercise[] | null> | null>;
}

export function useLessonFlow({
  exitingRef,
  grammarBridgePrefetchRef,
  exercisesPrefetchRef,
}: UseLessonFlowProps) {
  const router = useRouter();
  const { user, profile, setProfile } = useAuthStore();
  const store = useLessonStore();

  const fetchAiExercises = useCallback(async (): Promise<Exercise[] | null> => {
    if (!store.hook || !store.lesson) return null;
    return generatePracticeExercises({
      dialogue: store.hook.dialogue,
      newVocabulary: store.hook.newVocabulary,
      verbWord: store.hook.verbWord,
      language: store.lesson.language,
      level: store.lesson.level,
      knownVocabulary: store.knownVocabulary,
      previousTopics: getPreviousTopics(store.lesson.language, store.lesson.id),
    });
  }, [store]);

  const buildClientExercises = useCallback((): Exercise[] => {
    if (!store.hook) return [];
    const exercises: Exercise[] = [];

    const vocabWithImage = store.hook.newVocabulary.find(
      (w) => store.vocabImages[w]?.imageUrl,
    );
    if (vocabWithImage) {
      const imgData = store.vocabImages[vocabWithImage]!;
      const precomputedDistractors = store.hook.imageMatchDistractors?.[vocabWithImage];
      const distractors = precomputedDistractors && precomputedDistractors.length >= 3
        ? precomputedDistractors.slice(0, 3)
        : store.hook.newVocabulary
            .filter((w) => w !== vocabWithImage)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
      exercises.push({
        type: 'image-match',
        data: {
          imageUrl: imgData.imageUrl,
          imageAlt: imgData.imageAlt ?? vocabWithImage,
          word: vocabWithImage,
          options: [...distractors, vocabWithImage].sort(() => Math.random() - 0.5),
          translation: store.vocabTranslations[vocabWithImage] ?? vocabWithImage,
        },
      });
    }

    return exercises;
  }, [store]);

  const advanceFromVocabulary = useCallback(() => {
    if (!store.lesson || !store.hook) return;
    store.setPhase('hook');
  }, [store]);

  const advanceFromHook = useCallback(async () => {
    if (!store.lesson || !store.hook || store.isLoading) return;
    store.setIsLoading(true);

    const bridge = await (
      grammarBridgePrefetchRef.current ??
      generateGrammarBridge({
        dialogue: store.hook.dialogue,
        grammarFocus: store.hook.grammarFocus,
        language: store.lesson.language,
      })
    );
    grammarBridgePrefetchRef.current = null;
    if (bridge) store.setGrammarBridge(bridge);
    else store.setIsLoading(false);
    store.setPhase('grammar');
  }, [store, grammarBridgePrefetchRef]);

  const advanceFromGrammar = useCallback(async () => {
    if (!store.lesson || !store.hook || store.isLoading) return;
    store.setIsLoading(true);

    const aiExercises = await (exercisesPrefetchRef.current ?? fetchAiExercises());
    exercisesPrefetchRef.current = null;
    const clientExercises = buildClientExercises();

    store.setExercises([...(aiExercises ?? []), ...clientExercises]);
    store.setPhase('practice');
  }, [store, exercisesPrefetchRef, fetchAiExercises, buildClientExercises]);

  const finishLesson = useCallback(async () => {
    if (!user || !store.lesson || !store.hook) return;
    const total = store.exercises.length;
    const score = total > 0 ? Math.round((store.correctCount / total) * 100) : 0;

    logLesson({
      uid: user.uid,
      lessonId: store.lesson.id,
      language: store.lesson.language,
      score,
    }).catch(console.error);

    if (profile && store.lesson) {
      updateLessonStats(user.uid, profile, store.lesson.id, store.lesson.language)
        .then((updates) => setProfile({ ...profile, ...updates }))
        .catch(console.error);
    }

    const language = store.lesson.language;
    store.hook.newVocabulary.forEach((word) => {
      const translation = store.vocabTranslations[word] ?? word;
      const imageUrl = store.vocabImages[word]?.imageUrl;
      const wordType: 'verb' | 'noun' = word === store.hook!.verbWord ? 'verb' : 'noun';
      upsertVocabularyItem(user.uid, word, translation, language, imageUrl, wordType).catch(console.error);
    });

    if (store.hook.verbWord) {
      getVerbConjugation(store.hook.verbWord, language).catch(console.error);
    }

    const nextLessonId = getNextLessonId(language, store.lesson.id);
    if (nextLessonId && user) {
      const nextLesson = getLessonById(nextLessonId);
      if (nextLesson) {
        pregenerateNextLesson(user.uid, nextLesson, profile?.interests ?? []).catch(console.error);
      }
    }
  }, [user, profile, store, setProfile]);

  const exitLesson = useCallback(() => {
    exitingRef.current = true;
    store.reset();
    router.replace('/');
  }, [exitingRef, store, router]);

  return {
    fetchAiExercises,
    buildClientExercises,
    advanceFromVocabulary,
    advanceFromHook,
    advanceFromGrammar,
    finishLesson,
    exitLesson,
  };
}
