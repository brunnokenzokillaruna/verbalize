import { devLog } from '@/lib/devLog';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useLessonStore } from '@/store/lessonStore';
import { getNextLesson, getLessonById, getNextLessonId, getPreviousTopics } from '@/lib/curriculum';
import { generateHook, generateMinimalHook } from '@/app/actions/generateHook';
import { enrichHookMetadata } from '@/app/actions/enrichHookMetadata';
import { generateGrammarBridge } from '@/app/actions/generateGrammarBridge';
import { generatePhoneticsTip } from '@/app/actions/generatePhoneticsTip';
import { generateMissionBriefing } from '@/app/actions/generateMissionBriefing';
import { generatePracticeExercises } from '@/app/actions/generatePracticeExercises';
import { generateCheckpointSession } from '@/app/actions/generateCheckpointSession';
import { isPregenSchemaCurrent, PREGEN_SCHEMA_VERSION } from '@/lib/practiceExercises/constants';
import {
  markExercisesPrefetchReady,
  trackExercisesPrefetch,
} from '@/lib/practiceExercises/trackExercisesPrefetch';
import { pregenerateNextLesson } from '@/app/actions/pregenerateNextLesson';
import { isAggressivePregenEnabled } from '@/lib/geminiDevGuard';
import { translateWord, translateWordsBatch } from '@/app/actions/translateWord';
import { prefetchVocabImages } from '@/lib/vocabImagePrefetch';
import { getLessonSceneImage } from '@/app/actions/getLessonSceneImage';
import { fetchPregeneratedLessonWithWait } from '@/lib/waitForPregeneratedLesson';
import { deletePregeneratedLesson, getUserVocabulary, upsertVocabularyItem, tryStartPregeneratingLesson, abortPregeneratedLesson, getCachedImage } from '@/services/firestore';
import { sanitizeVocabularyToken } from '@/lib/hookSanitize';
import { MIN_VISUAL_REVIEW_ITEMS } from '@/utils/imageMatchBuilder';
import { canonicalVocabKey } from '@/lib/vocabCanonical';
import { filterHookVocabularyForKnownWords, filterKnownFromNewChunks } from '@/lib/hookVocabulary';
import { collectDialogueTranslationTargets } from '@/lib/dialogueNarration';
import { tooltipCacheKey } from '@/lib/wordTooltipUtils';
import type {
  GrammarBridgeResult,
  Exercise,
  LessonTag,
  HookResult,
  PregeneratedLessonDocument,
  UserVocabularyDocument,
  SupportedLanguage,
} from '@/types';

const TAGS_WITH_GRAMMAR_PHASE: ReadonlySet<LessonTag> = new Set(['GRAM', 'VERB', 'CULT', 'VOC', 'DIAL', 'EXPR']);

type VocabImagePoolItem = {
  word: string;
  translation: string;
  imageUrl?: string;
  srsLevel?: number;
  nextReviewMs?: number;
};

function nextReviewMsFromDoc(item: UserVocabularyDocument): number | undefined {
  const nextReview = item.nextReview as { toMillis?: () => number; toDate?: () => Date } | undefined;
  if (nextReview && typeof nextReview.toMillis === 'function') return nextReview.toMillis();
  if (nextReview && typeof nextReview.toDate === 'function') return nextReview.toDate().getTime();
  return undefined;
}

function poolItemFromVocabDoc(
  item: UserVocabularyDocument,
  imageUrl?: string,
): VocabImagePoolItem {
  return {
    word: item.word,
    translation: item.translation,
    imageUrl: imageUrl ?? item.imageUrl,
    srsLevel: item.srsLevel,
    nextReviewMs: nextReviewMsFromDoc(item),
  };
}

/**
 * Build the imaged-vocab pool for lesson visual drills.
 * Prefer imageUrl on the vocab doc; if the pool is thin, hydrate from image_cache.
 */
async function buildVocabImagePool(
  vocabDocs: UserVocabularyDocument[],
  language: SupportedLanguage,
): Promise<VocabImagePoolItem[]> {
  const byWord = new Map<string, VocabImagePoolItem>();

  for (const item of vocabDocs) {
    if (!item.imageUrl) continue;
    byWord.set(canonicalVocabKey(item.word), poolItemFromVocabDoc(item));
  }

  if (byWord.size >= MIN_VISUAL_REVIEW_ITEMS) {
    return [...byWord.values()];
  }

  // Newest-first candidates without a saved imageUrl (list is oldest-first).
  const missing = [...vocabDocs]
    .reverse()
    .filter((item) => !item.imageUrl)
    .slice(0, 40);

  const hydrated = await Promise.all(
    missing.map(async (item) => {
      const cacheKey = `${sanitizeVocabularyToken(item.word)}_${language}`;
      const cached = await getCachedImage(cacheKey).catch(() => null);
      if (!cached?.imageUrl) return null;
      return poolItemFromVocabDoc(item, cached.imageUrl);
    }),
  );

  for (const item of hydrated) {
    if (!item?.imageUrl) continue;
    const key = canonicalVocabKey(item.word);
    if (!byWord.has(key)) byWord.set(key, item);
  }

  return [...byWord.values()];
}

function applyPregenCache(
  pregenDoc: PregeneratedLessonDocument,
  store: ReturnType<typeof useLessonStore.getState>,
  grammarBridgePrefetchRef: React.MutableRefObject<Promise<GrammarBridgeResult | null> | null>,
  exercisesPrefetchRef: React.MutableRefObject<Promise<Exercise[] | null> | null>,
): HookResult | null {
  const schemaOk = isPregenSchemaCurrent(pregenDoc.schemaVersion);

  if (pregenDoc.grammarBridge) {
    grammarBridgePrefetchRef.current = Promise.resolve(pregenDoc.grammarBridge);
  }
  if (schemaOk && pregenDoc.exercises && pregenDoc.exercises.length > 0) {
    exercisesPrefetchRef.current = Promise.resolve(pregenDoc.exercises);
    markExercisesPrefetchReady(pregenDoc.exercises);
  } else if (!schemaOk && pregenDoc.exercises?.length) {
    devLog(
      `[Timing] Cache pregen exercises STALE (schema ${pregenDoc.schemaVersion ?? 'none'} < ${PREGEN_SCHEMA_VERSION}) — regenerating exercises`,
    );
  }
  if (pregenDoc.missionBriefing) {
    store.setMissionBriefing(pregenDoc.missionBriefing);
  }
  if (schemaOk && pregenDoc.checkpointSession) {
    store.setCheckpointSession(pregenDoc.checkpointSession);
  } else if (!schemaOk && pregenDoc.checkpointSession) {
    devLog(
      `[Timing] Cache pregen checkpoint STALE (schema ${pregenDoc.schemaVersion ?? 'none'} < ${PREGEN_SCHEMA_VERSION}) — regenerating checkpoint`,
    );
  }

  return pregenDoc.hook ?? null;
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

    // Show cover immediately while hook/scene load in the background.
    store.setPhase('intro');

    // Scene/cover image only needs LessonDefinition — start before hook generation.
    // Cache hit is cheap; always refetch on new lesson init (retry-safe).
    getLessonSceneImage({
      lessonId: lesson.id,
      theme: lesson.theme,
      uiTitle: lesson.uiTitle,
      language: lesson.language,
    })
      .then((img) => useLessonStore.getState().setSceneImage(img))
      .catch((err) => console.error('[Prefetch] scene image error:', err));

    (async () => {
      store.setIsLoading(true);
      const t0 = performance.now();
      devLog(`[Timing] ⏱ Lição iniciando: ${lesson.id}`);
      try {
        let hook = null;
        const vocabLoadPromise = user
          ? getUserVocabulary(user.uid, lesson.language)
          : Promise.resolve([]);

        if (user) {
          try {
            const tPregen = performance.now();
            const pregenDoc = await fetchPregeneratedLessonWithWait(user.uid, lesson.id);

            if (pregenDoc?.hook || pregenDoc?.checkpointSession) {
              hook = applyPregenCache(pregenDoc, store, grammarBridgePrefetchRef, exercisesPrefetchRef);
              const parts: string[] = [];
              if (pregenDoc.hook) parts.push('hook');
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
        const vocabDocs = await vocabLoadPromise;
        const knownVocabulary = vocabDocs.map((v) => canonicalVocabKey(v.word));
        const masteredVocabulary = vocabDocs
          .filter((v) => (v.srsLevel ?? 0) >= 4)
          .map((v) => canonicalVocabKey(v.word));
        store.setKnownVocabulary(knownVocabulary);
        store.setMasteredVocabulary(masteredVocabulary);
        const imagePool = await buildVocabImagePool(vocabDocs, lesson.language);
        store.setVocabImagePool(imagePool);
        devLog(
          `[Timing] Vocabulário do usuário: ${(performance.now() - tVocab).toFixed(0)}ms (${knownVocabulary.length} conhecidas, ${masteredVocabulary.length} dominadas, ${imagePool.length} com imagem p/ visual)`,
        );

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

        if (!hook) {
          const tHook = performance.now();
          let acquiredPregenLock = false;

          if (user) {
            try {
              acquiredPregenLock = await tryStartPregeneratingLesson(user.uid, lesson.id);
            } catch (err) {
              console.warn('[useLessonBootstrap] pregen lock unavailable:', err);
              acquiredPregenLock = false;
            }

            if (!acquiredPregenLock) {
              devLog(`[Timing] Lock pregen indisponível — verificando cache uma vez...`);
              const pregenDoc = await fetchPregeneratedLessonWithWait(user.uid, lesson.id);
              if (pregenDoc?.hook || pregenDoc?.checkpointSession) {
                hook = applyPregenCache(pregenDoc, store, grammarBridgePrefetchRef, exercisesPrefetchRef);
                deletePregeneratedLesson(user.uid, lesson.id).catch(console.error);
                devLog(`[Timing] Conteúdo recebido do pregen após lock: ${(performance.now() - tHook).toFixed(0)}ms`);
              }
            }
          }

          if (!hook) {
            devLog(`[Timing] Gerando hook mínimo via Gemini...`);
            hook = await generateMinimalHook({
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
            if (!hook) {
              devLog(`[Timing] Hook mínimo falhou — tentando generateHook completo...`);
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
            }
            devLog(`[Timing] generateMinimalHook: ${(performance.now() - tHook).toFixed(0)}ms`);

            if (user && acquiredPregenLock) {
              // Clear generating marker — hook lives in client store only.
              abortPregeneratedLesson(user.uid, lesson.id).catch(console.error);
            }
          }
        }

        if (hook) {
          hook = filterHookVocabularyForKnownWords(hook, knownVocabulary);
          store.setHook(hook);

          // MISS briefing must be derived from the hook dialogue so objectives
          // match the role-play scene (never generate briefing in parallel).
          if (lesson.tag === 'MISS' && !useLessonStore.getState().missionBriefing) {
            const tBrief = performance.now();
            devLog(`[Timing] Gerando mission briefing a partir do diálogo...`);
            const briefing = await generateMissionBriefing({
              grammarFocus: lesson.grammarFocus,
              theme: lesson.theme,
              uiTitle: lesson.uiTitle,
              language: lesson.language,
              dialogue: hook.dialogue,
            }).catch((err) => {
              console.error('[useLessonBootstrap] mission briefing error:', err);
              return null;
            });
            if (briefing) {
              store.setMissionBriefing(briefing);
              devLog(`[Timing] ✅ Mission briefing pronto: ${(performance.now() - tBrief).toFixed(0)}ms`);
            }
          }

          if (!vocabImagesFiredRef.current) {
            vocabImagesFiredRef.current = true;
            prefetchVocabImages({
              hook,
              lesson,
              setVocabImage: store.setVocabImage,
            }).catch((err) => console.error('[Prefetch] vocab images error:', err));
          }

          // Stay on intro until the learner taps "Começar" (advanceFromIntro).
          // REVIEW still jumps straight to briefing above.
          const currentPhase = useLessonStore.getState().phase;
          if (currentPhase === 'loading') {
            store.setPhase('intro');
          }
          devLog(`[Timing] ✅ Bootstrap total: ${(performance.now() - t0).toFixed(0)}ms → fase '${useLessonStore.getState().phase}'`);

          // Fire secondary AI calls in parallel — each merges into store as it resolves.
          // Skip when the pregen cache already supplied the field.
          const lang = lesson.language;
          const tag = lesson.tag;
          const focus = lesson.grammarFocus;
          const dialogue = hook.dialogue;

          const needsHookEnrichment =
            !hook.dialogueVerbs?.length ||
            ((tag === 'EXPR' || tag === 'CULT') && !hook.newChunks?.length) ||
            (tag === 'MISS' && !hook.rolePlayConsequences?.length);

          if (needsHookEnrichment) {
            const tEnrich = performance.now();
            enrichHookMetadata({ dialogue, language: lang, tag, level: lesson.level })
              .then((partial) => {
                if (Object.keys(partial).length === 0) return;
                if (partial.newChunks?.length) {
                  partial.newChunks = filterKnownFromNewChunks(partial.newChunks, knownVocabulary);
                }
                useLessonStore.getState().mergeHook(partial);
                devLog(`[Timing] ✅ Hook metadata enriquecido: ${(performance.now() - tEnrich).toFixed(0)}ms`);
              })
              .catch(console.error);
          }

          if (tag === 'PRON' && !hook.phoneticsTip) {
            generatePhoneticsTip({ dialogue, grammarFocus: focus, language: lang })
              .then((phoneticsTip) => {
                if (phoneticsTip) useLessonStore.getState().mergeHook({ phoneticsTip });
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
    const knownSet = new Set(store.knownVocabulary);
    const newVerbsFound = store.hook.dialogueVerbs.filter(
      (v) => !knownSet.has(canonicalVocabKey(v)),
    );

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
    store.setKnownVocabulary([...store.knownVocabulary, ...newVerbsFound.map(canonicalVocabKey)]);
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
        devLog(`[Timing] Exercícios: já no prefetch ref (status=${store.exercisesPrefetchStatus})`);
      } else {
        devLog(`[Timing] 🚀 Prefetch exercícios encadeado após o Grammar Bridge`);
        exercisesPrefetchRef.current = trackExercisesPrefetch(
          grammarBridgePrefetchRef.current!.then(async (bridge) => {
            // Wait 500ms cooling period to avoid rapid subsequent requests
            await new Promise((resolve) => setTimeout(resolve, 500));
            const tEx = performance.now();
            devLog(`[Timing] 🚀 Prefetch exercícios Gemini iniciado`);
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
              masteredVocabulary: store.masteredVocabulary,
              previousTopics: getPreviousTopics(language, lesson.id),
              grammarBridge: bridge ?? hook.grammarBridge ?? null,
            });
            devLog(
              `[Timing] ✅ Prefetch exercícios Gemini terminou: ${(performance.now() - tEx).toFixed(0)}ms (${result?.length ?? 0} exercícios)`,
            );
            return result;
          }),
        );
      }
    } else {
      // No grammar bridge, run exercises prefetch immediately
      if (exercisesPrefetchRef.current) {
        devLog(`[Timing] Exercícios: já no prefetch ref (status=${store.exercisesPrefetchStatus})`);
      } else {
        const tEx = performance.now();
        devLog(`[Timing] 🚀 Prefetch exercícios Gemini iniciado`);
        exercisesPrefetchRef.current = trackExercisesPrefetch(
          generatePracticeExercises({
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
            masteredVocabulary: store.masteredVocabulary,
            previousTopics: getPreviousTopics(language, lesson.id),
          }).then((result) => {
            devLog(
              `[Timing] ✅ Prefetch exercícios Gemini terminou: ${(performance.now() - tEx).toFixed(0)}ms (${result?.length ?? 0} exercícios)`,
            );
            return result;
          }),
        );
      }
    }

    const translatedKeys = new Set<string>();
    if (hook.vocabTranslations) {
      for (const [word, result] of Object.entries(hook.vocabTranslations)) {
        if (!result?.translation) continue;
        translatedKeys.add(canonicalVocabKey(word));
        store.setVocabTranslation(word, result.translation);
        store.cacheWordTooltip(tooltipCacheKey(word, language, false), result);
      }
    }
    hook.newChunks?.forEach((chunk) => {
      translatedKeys.add(canonicalVocabKey(chunk.phrase));
      store.setVocabTranslation(chunk.phrase, chunk.translation);
    });

    const dialogueTranslationTargets = collectDialogueTranslationTargets(
      dialogue,
      hook.newChunks,
    ).filter((target) => !translatedKeys.has(canonicalVocabKey(target)));
    const tTrans = performance.now();
    void (async () => {
      const batch = await translateWordsBatch(
        dialogueTranslationTargets,
        language,
        dialogue,
      );
      if (batch?.length) {
        for (const item of batch) {
          if (!item.translation) continue;
          store.setVocabTranslation(item.word, item.translation);
          store.cacheWordTooltip(tooltipCacheKey(item.word, language, false), {
            translation: item.translation,
            explanation: '',
            example: '',
          });
        }
        devLog(
          `[Timing] Traduções sincronizadas: ${(performance.now() - tTrans).toFixed(0)}ms (${batch.length} itens, 1 chamada Gemini)`,
        );
        return;
      }

      // Preserve the old resilient fallback for the two lesson vocabulary items.
      for (const word of words) {
        if (translatedKeys.has(canonicalVocabKey(word))) continue;
        const result = await translateWord(word, dialogue, language);
        if (result?.translation) {
          store.setVocabTranslation(word, result.translation);
          store.cacheWordTooltip(tooltipCacheKey(word, language, false), result);
        }
      }
    })();
    devLog(
      `[Timing] Traduções sincronizadas iniciadas (${dialogueTranslationTargets.length} itens)`,
    );

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
  }, [store.phase]);

  // Pre-generate the NEXT lesson's full payload (hook + bridge + exercises)
  // Fire-and-forget pregen for the *next* lesson while the learner is busy in
  // practice (normal lessons) or production (REVIEW checkpoints).
  useEffect(() => {
    if (store.phase !== 'practice' && store.phase !== 'production') return;
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

    // The words taught in THIS lesson only reach Firestore when it is completed,
    // so they must be appended by hand or the next lesson can present them again.
    const learnedThisLesson = [
      ...(store.hook?.newVocabulary ?? []),
      ...(store.hook?.newChunks?.map((chunk) => chunk.phrase) ?? []),
    ].map(canonicalVocabKey);
    const knownVocabulary = [...new Set([...store.knownVocabulary, ...learnedThisLesson])];

    devLog(`[Timing] 🔮 Pregen próxima lição disparado (background): ${nextLessonId}`);
    pregenerateNextLesson(user.uid, nextLesson, profile.interests ?? [], knownVocabulary, store.masteredVocabulary).catch(console.error);
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
