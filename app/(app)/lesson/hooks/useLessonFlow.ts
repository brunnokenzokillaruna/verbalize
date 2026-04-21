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
import type { GrammarBridgeResult, Exercise, LessonTag } from '@/types';
import type { LessonPhase } from '@/store/lessonStore';

const LESSON_FLOW: Record<LessonTag, LessonPhase[]> = {
  GRAM: ['vocabulary', 'hook', 'grammar',   'practice', 'complete'],
  VOC:  ['vocabulary', 'hook',               'practice', 'complete'],
  PRON: ['vocabulary', 'hook', 'phonetics', 'practice', 'complete'],
  DIAL: ['vocabulary', 'hook',               'practice', 'complete'],
  MISS: ['mission',    'vocabulary', 'hook', 'practice', 'complete'],
};

export function getInitialPhase(tag: LessonTag): LessonPhase {
  return LESSON_FLOW[tag][0];
}

function getNextPhase(tag: LessonTag, current: LessonPhase): LessonPhase | null {
  const flow = LESSON_FLOW[tag];
  const idx = flow.indexOf(current);
  return (idx === -1 || idx === flow.length - 1) ? null : flow[idx + 1];
}

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
      verbWord: store.hook.verbWord ?? '',
      grammarFocus: store.lesson.grammarFocus,
      tag: store.lesson.tag,
      language: store.lesson.language,
      level: store.lesson.level,
      knownVocabulary: store.knownVocabulary,
      previousTopics: getPreviousTopics(store.lesson.language, store.lesson.id),
    });
  }, [store]);

  const buildClientExercises = useCallback((): Exercise[] => {
    return [];
  }, []);

  const advanceFromGrammar = useCallback(async () => {
    if (!store.lesson || !store.hook || store.isLoading) return;
    store.setIsLoading(true);

    const aiExercises = await (exercisesPrefetchRef.current ?? fetchAiExercises());
    exercisesPrefetchRef.current = null;
    const clientExercises = buildClientExercises();

    store.setExercises([...(aiExercises ?? []), ...clientExercises]);
    store.setPhase('practice');
  }, [store, exercisesPrefetchRef, fetchAiExercises, buildClientExercises]);

  const advanceFromIntro = useCallback(() => {
    if (!store.lesson) return;
    const initial = getInitialPhase(store.lesson.tag);
    store.setPhase(initial);
  }, [store]);

  const advanceFromMission = useCallback(() => {
    if (!store.lesson) return;
    const next = getNextPhase(store.lesson.tag, 'mission');
    if (next) store.setPhase(next);
  }, [store]);

  const advanceFromVocabulary = useCallback(() => {
    if (!store.lesson || !store.hook) return;
    const next = getNextPhase(store.lesson.tag, 'vocabulary');
    if (next) store.setPhase(next);
  }, [store]);

  const advanceFromPhonetics = useCallback(() => {
    if (!store.lesson) return;
    advanceFromGrammar();
  }, [store, advanceFromGrammar]);

  const advanceFromHook = useCallback(async () => {
    if (!store.lesson || !store.hook || store.isLoading) return;
    const next = getNextPhase(store.lesson.tag, 'hook');
    if (!next) return;

    if (next === 'grammar') {
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
    } else if (next === 'phonetics') {
      if (store.hook.phoneticsTip) {
        store.setPhase('phonetics');
      } else {
        console.warn('[useLessonFlow] phoneticsTip missing — skipping to practice');
        advanceFromGrammar();
      }
    } else {
      advanceFromGrammar();
    }
  }, [store, grammarBridgePrefetchRef, advanceFromGrammar]);

  const finishLesson = useCallback(async () => {
    if (!user || !store.lesson || !store.hook) return;
    const total = store.exercises.length;
    const score = total > 0 ? Math.min(Math.round((store.correctCount / total) * 100), 100) : 0;

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

  const skipLesson = useCallback(async () => {
    if (!store.lesson || !user) return;

    const lessonId = store.lesson.id;
    const language = store.lesson.language;

    try {
      await logLesson({ uid: user.uid, lessonId, language, score: 100 });

      if (profile) {
        const updates = await updateLessonStats(user.uid, profile, lessonId, language);
        setProfile({ ...profile, ...updates });
      }

      // Skip the complete screen — go straight to dashboard
      exitingRef.current = true;
      store.reset();
      router.replace('/dashboard');
    } catch (err) {
      console.error('[useLessonFlow] skipLesson error:', err);
    }
  }, [user, profile, store, setProfile, exitingRef, router]);

  const exitLesson = useCallback(() => {
    exitingRef.current = true;
    store.reset();
    router.replace('/dashboard');
  }, [exitingRef, store, router]);

  return {
    fetchAiExercises,
    buildClientExercises,
    advanceFromIntro,
    advanceFromMission,
    advanceFromVocabulary,
    advanceFromHook,
    advanceFromGrammar,
    advanceFromPhonetics,
    finishLesson,
    skipLesson,
    exitLesson,
  };
}
