import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useLessonStore } from '@/store/lessonStore';
import { getNextLesson, getLessonById, getNextLessonId, getPreviousTopics } from '@/lib/curriculum';
import { getInitialPhase } from './useLessonFlow';
import { generateHook } from '@/app/actions/generateHook';
import { generateGrammarBridge } from '@/app/actions/generateGrammarBridge';
import { generatePhoneticsTip } from '@/app/actions/generatePhoneticsTip';
import { generateMissionBriefing } from '@/app/actions/generateMissionBriefing';
import { generatePracticeExercises } from '@/app/actions/generatePracticeExercises';
import { pregenerateNextLesson } from '@/app/actions/pregenerateNextLesson';
import { getVocabImage } from '@/app/actions/getVocabImage';
import { translateWord } from '@/app/actions/translateWord';
import { getPregeneratedLesson, deletePregeneratedLesson, getUserVocabulary, upsertVocabularyItem } from '@/services/firestore';
import type { GrammarBridgeResult, Exercise, LessonTag, MissionBriefingResult } from '@/types';

const TAGS_WITH_GRAMMAR_PHASE: ReadonlySet<LessonTag> = new Set(['GRAM', 'VERB', 'CULT']);

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
  const pregenFiredRef = useRef(false);

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
      const t0 = performance.now();
      console.log(`[Timing] ⏱ Lição iniciando: ${lesson.id}`);
      try {
        let hook = null;
        if (user) {
          try {
            const tPregen = performance.now();
            const pregenDoc = await getPregeneratedLesson(user.uid, lesson.id);
            if (pregenDoc?.hook) {
              hook = pregenDoc.hook;
              const parts: string[] = ['hook'];
              if (pregenDoc.grammarBridge) {
                grammarBridgePrefetchRef.current = Promise.resolve(pregenDoc.grammarBridge);
                parts.push('grammarBridge');
              }
              if (pregenDoc.exercises && pregenDoc.exercises.length > 0) {
                exercisesPrefetchRef.current = Promise.resolve(pregenDoc.exercises);
                parts.push(`exercises(${pregenDoc.exercises.length})`);
              }
              if (pregenDoc.missionBriefing) {
                store.setMissionBriefing(pregenDoc.missionBriefing);
                parts.push('missionBriefing');
              }
              console.log(`[Timing] Cache pregen: ${(performance.now() - tPregen).toFixed(0)}ms — HIT ✅ [${parts.join(', ')}]`);
              deletePregeneratedLesson(user.uid, lesson.id).catch(console.error);
            } else {
              console.log(`[Timing] Cache pregen: ${(performance.now() - tPregen).toFixed(0)}ms — MISS`);
            }
          } catch {
            // Permission error or network issue — fall through to normal generation
          }
        }

        const tVocab = performance.now();
        const vocabDocs = user ? await getUserVocabulary(user.uid, lesson.language) : [];
        const knownVocabulary = vocabDocs.map((v) => v.word.toLowerCase());
        store.setKnownVocabulary(knownVocabulary);
        console.log(`[Timing] Vocabulário do usuário: ${(performance.now() - tVocab).toFixed(0)}ms (${knownVocabulary.length} palavras conhecidas)`);

        // ── MISS fast-path: fire the briefing in parallel with the hook so the
        // mission screen renders as soon as the (shorter) briefing arrives,
        // without waiting for the full hook dialogue. Skip if the hook came
        // from cache and already has the briefing bundled somehow.
        let briefingPromise: Promise<MissionBriefingResult | null> | null = null;
        if (lesson.tag === 'MISS' && !hook) {
          const tBrief = performance.now();
          console.log(`[Timing] 🚀 Prefetch mission briefing iniciado (em paralelo com hook)`);
          briefingPromise = generateMissionBriefing({
            grammarFocus: lesson.grammarFocus,
            theme: lesson.theme,
            uiTitle: lesson.uiTitle,
            language: lesson.language,
          })
            .then((briefing) => {
              console.log(`[Timing] ✅ Mission briefing pronto: ${(performance.now() - tBrief).toFixed(0)}ms`);
              if (briefing) {
                const s = useLessonStore.getState();
                s.setMissionBriefing(briefing);
                // Enter mission phase immediately if we're still in loading —
                // the user sees the briefing while the hook keeps generating.
                if (s.phase === 'loading') s.setPhase('mission');
              }
              return briefing;
            })
            .catch((err) => {
              console.error('[useLessonBootstrap] mission briefing error:', err);
              return null;
            });
        }

        if (!hook) {
          const tHook = performance.now();
          console.log(`[Timing] Gerando hook via Gemini...`);
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
          console.log(`[Timing] generateHook: ${(performance.now() - tHook).toFixed(0)}ms`);
        }

        if (hook) {
          store.setHook(hook);

          // For MISS, the briefing may have already flipped the phase to
          // 'mission' — only set initial phase if we're still in loading.
          const currentPhase = useLessonStore.getState().phase;
          if (currentPhase === 'loading') {
            const initialPhase = getInitialPhase(lesson.tag);
            store.setPhase(initialPhase);
          }
          console.log(`[Timing] ✅ Bootstrap total: ${(performance.now() - t0).toFixed(0)}ms → fase '${useLessonStore.getState().phase}'`);

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

          // Briefing fallback: hook came from pregen cache (so the parallel
          // fast-path above didn't run) but the briefing wasn't cached.
          if (tag === 'MISS' && !briefingPromise && !useLessonStore.getState().missionBriefing) {
            generateMissionBriefing({
              grammarFocus: focus,
              theme: lesson.theme,
              uiTitle: lesson.uiTitle,
              language: lang,
              dialogue,
            })
              .then((briefing) => {
                if (briefing) useLessonStore.getState().setMissionBriefing(briefing);
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
    if ((store.phase !== 'hook' && store.phase !== 'role-play' && store.phase !== 'vocabulary' && store.phase !== 'intro') || !store.hook || !store.lesson) return;
    // Only fire once per lesson regardless of how many times phase/hook change
    if (prefetchFiredRef.current) return;
    prefetchFiredRef.current = true;
    const { hook, lesson } = store;

    const words = hook.newVocabulary;
    const dialogue = hook.dialogue;
    const language = lesson.language;

    // Grammar bridge prefetch — fires immediately so it's ready when the
    // user advances from 'hook' to 'grammar'. Only for tags that have a
    // 'grammar' phase in their LESSON_FLOW (GRAM / VERB / CULT).
    // Skipped when the pregen cache already supplied a ready Promise.
    if (TAGS_WITH_GRAMMAR_PHASE.has(lesson.tag)) {
      if (grammarBridgePrefetchRef.current) {
        console.log(`[Timing] Grammar bridge: já vindo do pregen cache (0ms)`);
      } else if (hook.grammarBridge) {
        grammarBridgePrefetchRef.current = Promise.resolve(hook.grammarBridge);
      } else {
        const tBridge = performance.now();
        console.log(`[Timing] 🚀 Prefetch grammar bridge iniciado (em paralelo)`);
        grammarBridgePrefetchRef.current = generateGrammarBridge({
          dialogue,
          grammarFocus: hook.grammarFocus,
          language,
          tag: lesson.tag,
        })
          .then((result) => {
            console.log(`[Timing] ✅ Prefetch grammar bridge terminou: ${(performance.now() - tBridge).toFixed(0)}ms`);
            return result;
          })
          .catch((err) => {
            console.error('[Prefetch] grammar bridge error:', err);
            return null;
          });
      }
    }

    // Exercises prefetch — always fires, every lesson ends on 'practice'.
    // Skipped when the pregen cache already supplied a ready Promise.
    if (exercisesPrefetchRef.current) {
      console.log(`[Timing] Exercícios: já vindo do pregen cache (0ms)`);
    } else {
      const tEx = performance.now();
      console.log(`[Timing] 🚀 Prefetch exercícios iniciado (em paralelo)`);
      exercisesPrefetchRef.current = generatePracticeExercises({
        dialogue,
        newVocabulary: words,
        verbWord: hook.verbWord ?? '',
        grammarFocus: lesson.grammarFocus,
        tag: lesson.tag,
        language,
        level: lesson.level,
        knownVocabulary: store.knownVocabulary,
        previousTopics: getPreviousTopics(language, lesson.id),
      })
        .then((result) => {
          console.log(`[Timing] ✅ Prefetch exercícios terminou: ${(performance.now() - tEx).toFixed(0)}ms (${result?.length ?? 0} exercícios)`);
          return result;
        })
        .catch((err) => {
          console.error('[Prefetch] exercises error:', err);
          return null;
        });
    }

    if (hook.vocabTranslations) {
      words.forEach((word) => {
        const result = hook.vocabTranslations![word];
        if (result?.translation) store.setVocabTranslation(word, result.translation);
      });
      console.log(`[Timing] Traduções do vocabulário: vindas do hook (0ms)`);
    } else {
      const tTrans = performance.now();
      words.forEach(async (word) => {
        const t = performance.now();
        const result = await translateWord(word, dialogue, language);
        if (result?.translation) store.setVocabTranslation(word, result.translation);
        console.log(`[Timing] Tradução '${word}': ${(performance.now() - t).toFixed(0)}ms`);
      });
      console.log(`[Timing] Traduções iniciadas (${words.length} palavras): ${(performance.now() - tTrans).toFixed(0)}ms`);
    }

    const tImages = performance.now();
    console.log(`[Timing] Buscando imagens (${words.length} palavras)...`);
    (async () => {
      const imagePromises = words.map(async (word) => {
        const t = performance.now();
        const precomputedKeyword = hook.imageKeywords?.[word];
        const result = await getVocabImage(word, dialogue, language, [], precomputedKeyword);
        store.setVocabImage(word, result);
        console.log(`[Timing] Imagem '${word}': ${(performance.now() - t).toFixed(0)}ms`);
        return { word, result };
      });
      const imageResults = await Promise.all(imagePromises);
      console.log(`[Timing] ✅ Todas as imagens (paralelo): ${(performance.now() - tImages).toFixed(0)}ms`);

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
    if (store.phase === 'idle') {
      prefetchFiredRef.current = false;
      pregenFiredRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.phase]);

  // Pre-generate the NEXT lesson's full payload (hook + bridge + exercises)
  // as soon as the user enters the 'practice' phase. This gives the pregen
  // ~60-180s of head start while the user works through the exercises, so
  // by the time they click "next lesson" everything is cached and instant.
  useEffect(() => {
    if (store.phase !== 'practice') return;
    if (pregenFiredRef.current) return;
    if (!user || !store.lesson || !profile) return;

    pregenFiredRef.current = true;

    const nextLessonId = getNextLessonId(store.lesson.language, store.lesson.id);
    if (!nextLessonId) return;
    const nextLesson = getLessonById(nextLessonId);
    if (!nextLesson) return;

    console.log(`[Timing] 🔮 Pregen próxima lição disparado (background): ${nextLessonId}`);
    pregenerateNextLesson(user.uid, nextLesson, profile.interests ?? []).catch(console.error);
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
