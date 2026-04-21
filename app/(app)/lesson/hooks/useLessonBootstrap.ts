import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useLessonStore } from '@/store/lessonStore';
import { getNextLesson, getLessonById } from '@/lib/curriculum';
import { getInitialPhase } from './useLessonFlow';
import { generateHook } from '@/app/actions/generateHook';
import { generateGrammarBridge } from '@/app/actions/generateGrammarBridge';
import { generatePhoneticsTip } from '@/app/actions/generatePhoneticsTip';
import { generateMissionBriefing } from '@/app/actions/generateMissionBriefing';
import { getVocabImage } from '@/app/actions/getVocabImage';
import { translateWord } from '@/app/actions/translateWord';
import { getPregeneratedLesson, deletePregeneratedLesson, getUserVocabulary, upsertVocabularyItem } from '@/services/firestore';
import type { GrammarBridgeResult, Exercise } from '@/types';

interface UseLessonBootstrapProps {
  requestedLessonId: string | undefined;
  exitingRef: React.MutableRefObject<boolean>;
  lessonInitiatedRef: React.MutableRefObject<boolean>;
  grammarBridgePrefetchRef: React.MutableRefObject<Promise<GrammarBridgeResult | null> | null>;
  exercisesPrefetchRef: React.MutableRefObject<Promise<Exercise[] | null> | null>;
  fetchAiExercises: () => Promise<Exercise[] | null>;
}

export function useLessonBootstrap({
  requestedLessonId,
  exitingRef,
  lessonInitiatedRef,
  grammarBridgePrefetchRef,
  exercisesPrefetchRef,
  fetchAiExercises
}: UseLessonBootstrapProps) {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const store = useLessonStore();
  
  const [hookError, setHookError] = useState(false);
  const prefetchFiredRef = useRef(false);

  useEffect(() => {
    if (!profile) return;
    if (exitingRef.current) return;
    if (store.phase !== 'idle') return;
    if (lessonInitiatedRef.current) return;
    lessonInitiatedRef.current = true;

    setHookError(false);
    const language = profile.currentTargetLanguage;
    const lesson =
      (requestedLessonId ? getLessonById(requestedLessonId) : undefined) ??
      getNextLesson(language, profile.lessonProgress?.[language]);
    store.init(lesson, profile.interests ?? []);

    (async () => {
      store.setIsLoading(true);
      try {
        let hook = null;
        if (user) {
          try {
            const pregenDoc = await getPregeneratedLesson(user.uid, lesson.id);
            if (pregenDoc?.hook) {
              hook = pregenDoc.hook;
              deletePregeneratedLesson(user.uid, lesson.id).catch(console.error);
            }
          } catch {
            // Permission error or network issue — fall through to normal generation
          }
        }

        const vocabDocs = user ? await getUserVocabulary(user.uid, lesson.language) : [];
        const knownVocabulary = vocabDocs.map((v) => v.word.toLowerCase());
        store.setKnownVocabulary(knownVocabulary);

        if (!hook) {
          hook = await generateHook({
            language: lesson.language,
            level: lesson.level,
            tag: lesson.tag,
            interests: profile.interests ?? [],
            theme: lesson.theme,
            uiTitle: lesson.uiTitle,
            grammarFocus: lesson.grammarFocus,
            knownVocabulary,
          });
        }

        if (hook) {
          store.setHook(hook);
          const initialPhase = getInitialPhase(lesson.tag);
          store.setPhase(initialPhase);

          // Fire secondary AI calls in parallel — each merges into store as it resolves.
          // Skip when the pregen cache already supplied the field.
          const lang = lesson.language;
          const tag = lesson.tag;
          const focus = lesson.grammarFocus;
          const dialogue = hook.dialogue;

          if (tag === 'PRON' && !hook.phoneticsTip) {
            generatePhoneticsTip({ dialogue, grammarFocus: focus, language: lang })
              .then((phoneticsTip) => {
                if (phoneticsTip) useLessonStore.getState().mergeHook({ phoneticsTip });
              })
              .catch(console.error);
          }

          if (tag === 'MISS' && !hook.missionBriefing) {
            generateMissionBriefing({ 
              grammarFocus: focus, 
              theme: lesson.theme,
              uiTitle: lesson.uiTitle,
              language: lang, 
              dialogue 
            })
              .then((missionBriefing) => {
                if (missionBriefing) useLessonStore.getState().mergeHook({ missionBriefing });
              })
              .catch(console.error);
          }
        } else {
          store.setIsLoading(false);
          setHookError(true);
        }
      } catch (err) {
        console.error('[LessonPage] generateHook threw:', err);
        store.setIsLoading(false);
        setHookError(true);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, store.phase]);

  // Automatic Verb Registration
  useEffect(() => {
    if (!user || !store.hook?.dialogueVerbs || !store.lesson) return;
    
    const language = store.lesson.language;
    const knownSet = new Set(store.knownVocabulary.map(v => v.toLowerCase()));
    const newVerbsFound = store.hook.dialogueVerbs.filter(v => !knownSet.has(v.toLowerCase()));

    if (newVerbsFound.length === 0) return;

    // Register each new verb
    newVerbsFound.forEach((verb) => {
      // Upsert to Firestore. We don't wait for completion here (fire-and-forget)
      // because we want to update the store immediately.
      upsertVocabularyItem(
        user.uid,
        verb.toLowerCase(),
        verb, // placeholder translation; updated if user clicks tooltip
        language,
        undefined,
        'verb'
      ).catch(console.error);
    });

    // Update store's knownVocabulary so they don't get re-registered and
    // so the UI can use them if needed.
    store.setKnownVocabulary([...store.knownVocabulary, ...newVerbsFound]);
    store.setDiscoveredVerbs(newVerbsFound);
  }, [user, store.hook, store.lesson]);

  useEffect(() => {
    if ((store.phase !== 'hook' && store.phase !== 'vocabulary' && store.phase !== 'intro') || !store.hook || !store.lesson) return;
    // Only fire once per lesson regardless of how many times phase/hook change
    if (prefetchFiredRef.current) return;
    prefetchFiredRef.current = true;
    const { hook, lesson } = store;

    // Grammar bridge is only needed for GRAM lessons
    if (lesson.tag === 'GRAM') {
      if (hook.grammarBridge) {
        grammarBridgePrefetchRef.current = Promise.resolve(hook.grammarBridge);
      }
    }

    const words = hook.newVocabulary;
    const dialogue = hook.dialogue;
    const language = lesson.language;

    if (hook.vocabTranslations) {
      words.forEach((word) => {
        const result = hook.vocabTranslations![word];
        if (result?.translation) store.setVocabTranslation(word, result.translation);
      });
    } else {
      words.forEach(async (word) => {
        const result = await translateWord(word, dialogue, language);
        if (result?.translation) store.setVocabTranslation(word, result.translation);
      });
    }

    (async () => {
      const imagePromises = words.map(async (word) => {
        const precomputedKeyword = hook.imageKeywords?.[word];
        const result = await getVocabImage(word, dialogue, language, [], precomputedKeyword);
        store.setVocabImage(word, result);
        return { word, result };
      });
      const imageResults = await Promise.all(imagePromises);

      const usedUrls: string[] = [];
      const refetchWords: string[] = [];
      imageResults.forEach(({ word, result }) => {
        if (result?.imageUrl && usedUrls.includes(result.imageUrl)) {
          refetchWords.push(word);
          store.setVocabImage(word, null);
        } else if (result?.imageUrl) {
          usedUrls.push(result.imageUrl);
        }
      });

      if (refetchWords.length > 0) {
        await Promise.all(
          refetchWords.map(async (word) => {
            const precomputedKeyword = hook.imageKeywords?.[word];
            const result = await getVocabImage(word, dialogue, language, [...usedUrls], precomputedKeyword);
            store.setVocabImage(word, result);
            if (result?.imageUrl && !usedUrls.includes(result.imageUrl)) {
              usedUrls.push(result.imageUrl);
            }
          }),
        );
      }
    })();
  // store.hook added so the effect re-fires when hook arrives while still on 'intro' phase
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.phase, store.hook]);


  useEffect(() => {
    if (store.phase === 'idle') prefetchFiredRef.current = false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.phase]);

  useEffect(() => {
    if (store.phase === 'complete') {
      router.prefetch('/');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.phase]);

  return { hookError, setHookError };
}
