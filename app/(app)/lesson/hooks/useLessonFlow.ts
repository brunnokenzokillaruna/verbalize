import { devLog } from '@/lib/devLog';
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useLessonStore } from '@/store/lessonStore';
import { getPreviousTopics } from '@/lib/curriculum';
import { generateGrammarBridge } from '@/app/actions/generateGrammarBridge';
import { generatePracticeExercises } from '@/app/actions/generatePracticeExercises';
import { getVerbConjugation } from '@/app/actions/getVerbConjugation';
import { logLesson, updateLessonStats, upsertVocabularyItem, saveLessonMistake, updateUser } from '@/services/firestore';
import { canonicalVocabKey } from '@/lib/vocabCanonical';
import { sessionHasProduction } from '@/lib/practiceExercises/productionTypes';
import { applyAdaptiveTier } from '@/lib/practiceExercises/adaptiveTier';
import { assemblePracticeSession, injectImageMatchIntoPool } from '@/utils/assemblePracticeExercises';
import { buildImageMatchFromLessonVocab } from '@/utils/imageMatchBuilder';
import type { GrammarBridgeResult, Exercise, LessonTag } from '@/types';
import type { LessonPhase } from '@/store/lessonStore';

const LESSON_FLOW: Record<LessonTag, LessonPhase[]> = {
  GRAM: ['vocabulary', 'hook', 'grammar',   'practice', 'complete'],
  VOC:  ['vocabulary', 'hook', 'grammar',   'practice', 'complete'],
  PRON: ['vocabulary', 'hook', 'phonetics', 'practice', 'complete'],
  DIAL: ['vocabulary', 'hook', 'grammar',   'practice', 'complete'],
  MISS: ['mission',    'vocabulary', 'role-play', 'practice', 'complete'],
  VERB: ['vocabulary', 'hook', 'grammar',   'practice', 'complete'],
  EXPR: ['vocabulary', 'hook', 'grammar',   'practice', 'complete'],
  CULT: ['vocabulary', 'hook', 'grammar',   'practice', 'complete'],
  REVIEW: ['briefing', 'comprehension', 'production', 'debrief', 'complete'],
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
      theme: store.lesson.theme,
      uiTitle: store.lesson.uiTitle,
      tag: store.lesson.tag,
      language: store.lesson.language,
      level: store.lesson.level,
      knownVocabulary: store.knownVocabulary,
      masteredVocabulary: store.masteredVocabulary,
      previousTopics: getPreviousTopics(store.lesson.language, store.lesson.id),
      grammarBridge: store.grammarBridge,
    });
  }, [store]);

  const buildClientExercises = useCallback((): Exercise[] => {
    if (!store.hook) return [];
    const imageMatch = buildImageMatchFromLessonVocab({
      hook: store.hook,
      vocabImages: store.vocabImages,
      vocabTranslations: store.vocabTranslations,
    });
    return imageMatch ? [imageMatch] : [];
  }, [store.hook, store.vocabImages, store.vocabTranslations]);

  const advanceFromGrammar = useCallback(async () => {
    if (!store.lesson || !store.hook || store.isLoading) return;
    store.setIsLoading(true);

    const tEx = performance.now();
    const fromCache = !!exercisesPrefetchRef.current;
    const aiExercises = await (exercisesPrefetchRef.current ?? fetchAiExercises());
    exercisesPrefetchRef.current = null;
    devLog(`[Timing] Exercícios (${fromCache ? 'do cache' : 'gerados agora'}): ${(performance.now() - tEx).toFixed(0)}ms (${aiExercises?.length ?? 0} exercícios)`);

    const clientExercises = buildClientExercises();
    const imageMatchForPool = clientExercises[0] ?? buildImageMatchFromLessonVocab({
      hook: store.hook,
      vocabImages: store.vocabImages,
      vocabTranslations: store.vocabTranslations,
    });

    let merged = assemblePracticeSession(
      aiExercises ?? [],
      clientExercises,
      store.lesson.tag,
      store.bridgeQuizPassed,
      store.lesson.level,
    );

    if (store.lesson.tag !== 'VOC' || !clientExercises.length) {
      merged = injectImageMatchIntoPool(merged, imageMatchForPool);
    }

    merged = applyAdaptiveTier(merged, store.masteredVocabulary);

    if (merged.length === 0) {
      console.error('[useLessonFlow] Empty practice session — staying on grammar phase');
      store.setIsLoading(false);
      return;
    }

    if (!sessionHasProduction(merged)) {
      devLog('[useLessonFlow] Warning: practice session has no production exercise after assembly');
    }

    store.setExercises(merged);
    store.setPhase('practice');
  }, [store, exercisesPrefetchRef, fetchAiExercises, buildClientExercises]);

  const advanceFromBriefing = useCallback(() => {
    if (!store.lesson) return;
    store.setPhase('comprehension');
  }, [store]);

  const advanceFromComprehension = useCallback(() => {
    if (!store.lesson || !store.checkpointSession) return;
    const total = store.checkpointSession.comprehensionQuestions.length;
    if (store.comprehensionIndex < total - 1) {
      store.nextComprehensionQuestion();
      return;
    }
    store.setExercises(store.checkpointSession.productionExercises);
    store.setPhase('production');
  }, [store]);

  const advanceFromCheckpointProduction = useCallback(() => {
    if (!store.lesson || !store.checkpointSession) return;
    const total = store.checkpointSession.productionExercises.length;
    if (store.checkpointProductionIndex < total - 1) {
      store.nextCheckpointProduction();
      return;
    }

    const compTotal = store.checkpointSession.comprehensionQuestions.length;
    const prodTotal = store.checkpointSession.productionExercises.length;
    const compPass = store.comprehensionCorrect >= Math.ceil(compTotal / 2);
    const prodPass = store.checkpointProductionCorrect >= Math.ceil(prodTotal / 2);
    const passed = compPass && prodPass;
    store.setCheckpointPassed(passed);

    if (!passed && user && store.lesson) {
      saveLessonMistake(
        user.uid,
        store.lesson.language,
        store.lesson.grammarFocus,
        `Checkpoint reprovado: compreensão ${store.comprehensionCorrect}/${compTotal}, produção ${store.checkpointProductionCorrect}/${prodTotal}`,
        store.lesson.id,
        store.lesson.level,
      ).catch(console.error);
    }

    store.setPhase('debrief');
  }, [store, user]);

  const advanceFromDebrief = useCallback(() => {
    store.setPhase('complete');
  }, [store]);

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

  const advanceFromRolePlay = useCallback(() => {
    if (!store.lesson || !store.hook) return;
    advanceFromGrammar();
  }, [store, advanceFromGrammar]);

  const advanceFromHook = useCallback(async () => {
    if (!store.lesson || !store.hook || store.isLoading) return;
    const next = getNextPhase(store.lesson.tag, 'hook');
    if (!next) return;

    if (next === 'grammar') {
      store.setIsLoading(true);
      const tBridge = performance.now();
      const fromCache = !!grammarBridgePrefetchRef.current;
      const bridge = await (
        grammarBridgePrefetchRef.current ??
        generateGrammarBridge({
          dialogue: store.hook.dialogue,
          grammarFocus: store.lesson.tag === 'VOC' ? store.lesson.grammarFocus : store.hook.grammarFocus,
          language: store.lesson.language,
          tag: store.lesson.tag,
        })
      );
      devLog(`[Timing] Grammar bridge (${fromCache ? 'do cache' : 'gerado agora'}): ${(performance.now() - tBridge).toFixed(0)}ms`);
      grammarBridgePrefetchRef.current = null;
      if (bridge) {
        store.setGrammarBridge(bridge);
        store.setPhase('grammar');
      } else {
        // Accuracy gate exhausted / generation failed — skip grammar rather than teach nothing or wrong.
        console.warn('[useLessonFlow] Grammar bridge unavailable — skipping to practice');
        store.setIsLoading(false);
        advanceFromGrammar();
      }
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
    if (!user || !store.lesson) return;

    const persistScenarioSummary = (summary: string) => {
      const trimmed = summary.trim().slice(0, 240);
      if (!trimmed) return;
      updateUser(user.uid, { lastScenarioSummary: trimmed }).catch(console.error);
      if (profile) {
        setProfile({ ...profile, lastScenarioSummary: trimmed });
      }
    };

    if (store.lesson.tag === 'REVIEW') {
      const compTotal = store.checkpointSession?.comprehensionQuestions.length ?? 0;
      const prodTotal = store.checkpointSession?.productionExercises.length ?? 0;
      const totalItems = compTotal + prodTotal;
      const correctItems = store.comprehensionCorrect + store.checkpointProductionCorrect;
      const score = totalItems > 0 ? Math.min(Math.round((correctItems / totalItems) * 100), 100) : 0;

      logLesson({
        uid: user.uid,
        lessonId: store.lesson.id,
        language: store.lesson.language,
        score,
        lessonTag: store.lesson.tag,
        hadSpontaneousProductionAccepted: store.spontaneousProductionAccepted,
      }).catch(console.error);

      if (profile) {
        updateLessonStats(user.uid, profile, store.lesson.id, store.lesson.language)
          .then((updates) => setProfile({ ...profile, ...updates }))
          .catch(console.error);
      }

      const reviewSummary =
        store.checkpointSession?.briefing ??
        store.lesson.uiTitle ??
        '';
      persistScenarioSummary(reviewSummary);
      return;
    }

    if (!store.hook) return;
    const total = store.exercises.length;
    const score = total > 0 ? Math.min(Math.round((store.correctCount / total) * 100), 100) : 0;

    logLesson({
      uid: user.uid,
      lessonId: store.lesson.id,
      language: store.lesson.language,
      score,
      lessonTag: store.lesson.tag,
      hadSpontaneousProductionAccepted: store.spontaneousProductionAccepted,
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

    store.hook.newChunks?.forEach((chunk) => {
      upsertVocabularyItem(
        user.uid,
        chunk.phrase,
        chunk.translation,
        language,
        undefined,
        'noun',
        chunk.entryType,
      ).catch(console.error);
    });

    // Keep the in-session known list in sync with what was just persisted, so a
    // pregeneration triggered later in this session cannot reuse these words.
    const learnedNow = [
      ...store.hook.newVocabulary,
      ...(store.hook.newChunks?.map((chunk) => chunk.phrase) ?? []),
    ].map(canonicalVocabKey);
    store.setKnownVocabulary([...new Set([...store.knownVocabulary, ...learnedNow])]);

    if (store.hook.verbWord) {
      getVerbConjugation(store.hook.verbWord, language).catch(console.error);
    }

    if (store.lesson.tag === 'MISS') {
      const missSummary =
        store.missionBriefing?.scenario ??
        store.hook.dialogue.split('\n').slice(0, 2).join(' ') ??
        store.lesson.uiTitle ??
        '';
      persistScenarioSummary(missSummary);
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
    advanceFromRolePlay,
    advanceFromBriefing,
    advanceFromComprehension,
    advanceFromCheckpointProduction,
    advanceFromDebrief,
    finishLesson,
    skipLesson,
    exitLesson,
  };
}
