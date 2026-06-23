import { devLog } from '@/lib/devLog';
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
import { generateCheckpointSession } from '@/app/actions/generateCheckpointSession';
import { PREGEN_SCHEMA_VERSION } from '@/lib/practiceExercises/constants';
import { pregenerateNextLesson } from '@/app/actions/pregenerateNextLesson';
import { isAggressivePregenEnabled } from '@/lib/geminiDevGuard';
import { translateWord } from '@/app/actions/translateWord';
import { prefetchVocabImages } from '@/lib/vocabImagePrefetch';
import { getPregeneratedLesson, deletePregeneratedLesson, getUserVocabulary, upsertVocabularyItem, tryStartPregeneratingLesson, abortPregeneratedLesson } from '@/services/firestore';
import { tooltipCacheKey } from '@/lib/wordTooltipUtils';
import type { GrammarBridgeResult, Exercise, LessonTag, MissionBriefingResult, HookResult, PregeneratedLessonDocument } from '@/types';

const TAGS_WITH_GRAMMAR_PHASE: ReadonlySet<LessonTag> = new Set(['GRAM', 'VERB', 'CULT', 'VOC', 'DIAL', 'EXPR']);

function applyPregenCache(
  pregenDoc: PregeneratedLessonDocument,
  store: ReturnType<typeof useLessonStore.getState>,
  grammarBridgePrefetchRef: React.MutableRefObject<Promise<GrammarBridgeResult | null> | null>,
  exercisesPrefetchRef: React.MutableRefObject<Promise<Exercise[] | null> | null>,
): HookResult {
  const schemaOk =
    pregenDoc.schemaVersion === undefined ||
    pregenDoc.schemaVersion >= PREGEN_SCHEMA_VERSION;

  if (pregenDoc.grammarBridge) {
    grammarBridgePrefetchRef.current = Promise.resolve(pregenDoc.grammarBridge);
  }
  if (schemaOk && pregenDoc.exercises && pregenDoc.exercises.length > 0) {
    exercisesPrefetchRef.current = Promise.resolve(pregenDoc.exercises);
  }
  if (pregenDoc.missionBriefing) {
    store.setMissionBriefing(pregenDoc.missionBriefing);
  }
  if (pregenDoc.checkpointSession) {
    store.setCheckpointSession(pregenDoc.checkpointSession);
  }

  return pregenDoc.hook!;
}

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
}: UseLessonBootstrapProps) {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const store = useLessonStore();
  
  const [hookError, setHookError] = useState(false);
  const prefetchFiredRef = useRef(false);
  const pregenFiredRef = useRef(false);
  const vocabImagesFiredRef = useRef(false);

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
      devLog(`[Timing] ⏱ Lição iniciando: ${lesson.id}`);
      try {
        let hook = null;
        if (user) {
          try {
            const tPregen = performance.now();
            let pregenDoc = await getPregeneratedLesson(user.uid, lesson.id);
            
            // Polling loop if lesson is currently generating
            if (pregenDoc?.status === 'generating') {
              devLog(`[Timing] Lição está sendo gerada em background. Iniciando polling...`);
              let attempts = 0;
              const maxAttempts = 90; // 3 minutes — matches pregen runway for hook + grammar + exercises
              while (pregenDoc?.status === 'generating' && attempts < maxAttempts) {
                await new Promise((resolve) => setTimeout(resolve, 2000));
                attempts++;
                try {
                  pregenDoc = await getPregeneratedLesson(user.uid, lesson.id);
                  devLog(`[Timing] Polling tentativa ${attempts}/${maxAttempts}: status = ${pregenDoc?.status ?? 'deleted'}`);
                } catch {
                  // Catch errors (like permission-denied or deletion) safely
                  break;
                }
              }
            }

            if (pregenDoc?.hook) {
              hook = applyPregenCache(pregenDoc, store, grammarBridgePrefetchRef, exercisesPrefetchRef);
              const parts: string[] = ['hook'];
              if (pregenDoc.grammarBridge) parts.push('grammarBridge');
              if (pregenDoc.exercises?.length) parts.push(`exercises(${pregenDoc.exercises.length})`);
              if (pregenDoc.missionBriefing) parts.push('missionBriefing');
              if (pregenDoc.checkpointSession) parts.push('checkpointSession');
              devLog(`[Timing] Cache pregen: ${(performance.now() - tPregen).toFixed(0)}ms — HIT ✅ [${parts.join(', ')}]`);
              deletePregeneratedLesson(user.uid, lesson.id).catch(console.error);
            } else {
              devLog(`[Timing] Cache pregen: ${(performance.now() - tPregen).toFixed(0)}ms — MISS`);
            }
          } catch {
            // Permission error or network issue — fall through to normal generation
          }
        }

        const tVocab = performance.now();
        const vocabDocs = user ? await getUserVocabulary(user.uid, lesson.language) : [];
        const knownVocabulary = vocabDocs.map((v) => v.word.toLowerCase());
        store.setKnownVocabulary(knownVocabulary);
        devLog(`[Timing] Vocabulário do usuário: ${(performance.now() - tVocab).toFixed(0)}ms (${knownVocabulary.length} palavras conhecidas)`);

        if (lesson.tag === 'REVIEW') {
          let checkpoint = useLessonStore.getState().checkpointSession;
          if (!checkpoint) {
            const tCp = performance.now();
            checkpoint = await generateCheckpointSession({
              language: lesson.language,
              level: lesson.level,
              lessonId: lesson.id,
              grammarFocus: lesson.grammarFocus,
              theme: lesson.theme,
              uiTitle: lesson.uiTitle,
              knownVocabulary,
            });
            devLog(`[Timing] generateCheckpointSession: ${(performance.now() - tCp).toFixed(0)}ms`);
          }
          if (checkpoint) {
            store.setCheckpointSession(checkpoint);
            store.setPhase('briefing');
            devLog(`[Timing] ✅ Bootstrap REVIEW total: ${(performance.now() - t0).toFixed(0)}ms`);
            return;
          }
          store.setIsLoading(false);
          setHookError(true);
          return;
        }

        // ── MISS fast-path: fire the briefing in parallel with the hook so the
        // mission screen renders as soon as the (shorter) briefing arrives,
        // without waiting for the full hook dialogue. Skip if the hook came
        // from cache and already has the briefing bundled somehow.
        let briefingPromise: Promise<MissionBriefingResult | null> | null = null;
        if (lesson.tag === 'MISS' && !hook) {
          const tBrief = performance.now();
          devLog(`[Timing] 🚀 Prefetch mission briefing iniciado (em paralelo com hook)`);
          briefingPromise = generateMissionBriefing({
            grammarFocus: lesson.grammarFocus,
            theme: lesson.theme,
            uiTitle: lesson.uiTitle,
            language: lesson.language,
          })
            .then((briefing) => {
              devLog(`[Timing] ✅ Mission briefing pronto: ${(performance.now() - tBrief).toFixed(0)}ms`);
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
          let acquiredPregenLock = false;

          if (user) {
            acquiredPregenLock = await tryStartPregeneratingLesson(user.uid, lesson.id);
            if (!acquiredPregenLock) {
              devLog(`[Timing] Outro processo está gerando a lição — aguardando pregen...`);
              let pregenDoc = await getPregeneratedLesson(user.uid, lesson.id);
              let attempts = 0;
              const maxAttempts = 90;
              while (!pregenDoc?.hook && pregenDoc?.status === 'generating' && attempts < maxAttempts) {
                await new Promise((resolve) => setTimeout(resolve, 2000));
                attempts++;
                pregenDoc = await getPregeneratedLesson(user.uid, lesson.id);
              }
              if (pregenDoc?.hook) {
                hook = applyPregenCache(pregenDoc, store, grammarBridgePrefetchRef, exercisesPrefetchRef);
                deletePregeneratedLesson(user.uid, lesson.id).catch(console.error);
                devLog(`[Timing] Hook recebido do pregen após polling: ${(performance.now() - tHook).toFixed(0)}ms`);
              }
            }
          }

          if (!hook) {
            devLog(`[Timing] Gerando hook via Gemini...`);
            hook = await generateHook({
              language: lesson.language,
              level: lesson.level,
              tag: lesson.tag,
              interests: profile.interests ?? [],
              theme: lesson.theme,
              uiTitle: lesson.uiTitle,
              grammarFocus: lesson.grammarFocus,
              knownVocabulary,
              arcCharacters: lesson.arcCharacters,
              arcSummary: lesson.arcSummary,
              lastScenarioSummary: profile.lastScenarioSummary,
            });
            devLog(`[Timing] generateHook: ${(performance.now() - tHook).toFixed(0)}ms`);

            if (user && acquiredPregenLock) {
              // Clear generating marker — hook lives in client store only.
              abortPregeneratedLesson(user.uid, lesson.id).catch(console.error);
            }
          }
        }

        if (hook) {
          store.setHook(hook);

          if (!vocabImagesFiredRef.current) {
            vocabImagesFiredRef.current = true;
            prefetchVocabImages({
              hook,
              lesson,
              setVocabImage: store.setVocabImage,
            }).catch((err) => console.error('[Prefetch] vocab images error:', err));
          }

          // For MISS, the briefing may have already flipped the phase to
          // 'mission' — only set initial phase if we're still in loading.
          const currentPhase = useLessonStore.getState().phase;
          if (currentPhase === 'loading') {
            const initialPhase = getInitialPhase(lesson.tag);
            store.setPhase(initialPhase);
          }
          devLog(`[Timing] ✅ Bootstrap total: ${(performance.now() - t0).toFixed(0)}ms → fase '${useLessonStore.getState().phase}'`);

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
        devLog(`[Timing] Grammar bridge: já vindo do pregen cache (0ms)`);
      } else if (hook.grammarBridge) {
        grammarBridgePrefetchRef.current = Promise.resolve(hook.grammarBridge);
      } else {
        const tBridge = performance.now();
        devLog(`[Timing] 🚀 Prefetch grammar bridge iniciado`);
        grammarBridgePrefetchRef.current = generateGrammarBridge({
          dialogue,
          grammarFocus: hook.grammarFocus,
          language,
          tag: lesson.tag,
        })
          .then((result) => {
            devLog(`[Timing] ✅ Prefetch grammar bridge terminou: ${(performance.now() - tBridge).toFixed(0)}ms`);
            return result;
          })
          .catch((err) => {
            console.error('[Prefetch] grammar bridge error:', err);
            return null;
          });
      }

      // Exercises prefetch chained after Grammar Bridge to avoid concurrency 429
      if (exercisesPrefetchRef.current) {
        devLog(`[Timing] Exercícios: já vindo do pregen cache (0ms)`);
      } else {
        devLog(`[Timing] 🚀 Prefetch exercícios encadeado após o Grammar Bridge`);
        exercisesPrefetchRef.current = grammarBridgePrefetchRef.current!.then(async (bridge) => {
          // Wait 500ms cooling period to avoid rapid subsequent requests
          await new Promise((resolve) => setTimeout(resolve, 500));
          const tEx = performance.now();
          devLog(`[Timing] 🚀 Prefetch exercícios iniciado`);
          const result = await generatePracticeExercises({
            dialogue,
            newVocabulary: words,
            verbWord: hook.verbWord ?? '',
            grammarFocus: lesson.grammarFocus,
            theme: lesson.theme,
            uiTitle: lesson.uiTitle,
            tag: lesson.tag,
            language,
            level: lesson.level,
            knownVocabulary: store.knownVocabulary,
            previousTopics: getPreviousTopics(language, lesson.id),
            grammarBridge: bridge ?? hook.grammarBridge ?? null,
          });
          devLog(`[Timing] ✅ Prefetch exercícios terminou: ${(performance.now() - tEx).toFixed(0)}ms (${result?.length ?? 0} exercícios)`);
          return result;
        }).catch((err) => {
          console.error('[Prefetch] exercises error:', err);
          return null;
        });
      }
    } else {
      // No grammar bridge, run exercises prefetch immediately
      if (exercisesPrefetchRef.current) {
        devLog(`[Timing] Exercícios: já vindo do pregen cache (0ms)`);
      } else {
        const tEx = performance.now();
        devLog(`[Timing] 🚀 Prefetch exercícios iniciado`);
        exercisesPrefetchRef.current = generatePracticeExercises({
          dialogue,
          newVocabulary: words,
          verbWord: hook.verbWord ?? '',
          grammarFocus: lesson.grammarFocus,
          theme: lesson.theme,
          uiTitle: lesson.uiTitle,
          tag: lesson.tag,
          language,
          level: lesson.level,
          knownVocabulary: store.knownVocabulary,
          previousTopics: getPreviousTopics(language, lesson.id),
        })
          .then((result) => {
            devLog(`[Timing] ✅ Prefetch exercícios terminou: ${(performance.now() - tEx).toFixed(0)}ms (${result?.length ?? 0} exercícios)`);
            return result;
          })
          .catch((err) => {
            console.error('[Prefetch] exercises error:', err);
            return null;
          });
      }
    }

    if (hook.vocabTranslations) {
      words.forEach((word) => {
        const result = hook.vocabTranslations![word];
        if (result?.translation) {
          store.setVocabTranslation(word, result.translation);
          store.cacheWordTooltip(tooltipCacheKey(word, language, false), result);
        }
      });
      devLog(`[Timing] Traduções do vocabulário: vindas do hook (0ms)`);
    } else {
      const tTrans = performance.now();
      (async () => {
        for (const word of words) {
          const t = performance.now();
          const result = await translateWord(word, dialogue, language);
          if (result?.translation) {
            store.setVocabTranslation(word, result.translation);
            store.cacheWordTooltip(tooltipCacheKey(word, language, false), result);
          }
          devLog(`[Timing] Tradução '${word}': ${(performance.now() - t).toFixed(0)}ms`);
          await new Promise((resolve) => setTimeout(resolve, 300)); // small cooldown
        }
      })();
      devLog(`[Timing] Traduções iniciadas sequencialmente (${words.length} palavras): ${(performance.now() - tTrans).toFixed(0)}ms`);
    }

    const tImages = performance.now();
    if (!vocabImagesFiredRef.current) {
      vocabImagesFiredRef.current = true;
      prefetchVocabImages({
        hook,
        lesson,
        setVocabImage: store.setVocabImage,
      })
        .then(() => {
          devLog(`[Timing] ✅ Prefetch imagens terminou: ${(performance.now() - tImages).toFixed(0)}ms`);
        })
        .catch((err) => console.error('[Prefetch] vocab images error:', err));
    } else {
      devLog(`[Timing] Imagens: já iniciadas no bootstrap (0ms)`);
    }
  // store.hook added so the effect re-fires when hook arrives while still on 'intro' phase
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.phase, store.hook]);


  useEffect(() => {
    if (store.phase === 'idle') {
      prefetchFiredRef.current = false;
      pregenFiredRef.current = false;
      vocabImagesFiredRef.current = false;
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
    if (!isAggressivePregenEnabled()) {
      devLog('[Timing] Pregen próxima lição ignorado (dev/preview mode).');
      return;
    }

    pregenFiredRef.current = true;

    const nextLessonId = getNextLessonId(store.lesson.language, store.lesson.id);
    if (!nextLessonId) return;
    const nextLesson = getLessonById(nextLessonId);
    if (!nextLesson) return;

    devLog(`[Timing] 🔮 Pregen próxima lição disparado (background): ${nextLessonId}`);
    pregenerateNextLesson(user.uid, nextLesson, profile.interests ?? [], store.knownVocabulary).catch(console.error);
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
