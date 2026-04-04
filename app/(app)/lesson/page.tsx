'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Trophy, Volume2, VolumeX } from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import { useLessonStore } from '@/store/lessonStore';
import { getNextLesson, getNextLessonId, getLessonById, getPreviousTopics } from '@/lib/curriculum';

import { generateHook } from '@/app/actions/generateHook';
import { synthesizeDialogue } from '@/app/actions/synthesizeSpeech';
import { generateGrammarBridge } from '@/app/actions/generateGrammarBridge';
import { getVocabImage } from '@/app/actions/getVocabImage';
import { generatePracticeExercises } from '@/app/actions/generatePracticeExercises';
import { generateMistakeReview } from '@/app/actions/generateMistakeReview';
import { translateWord } from '@/app/actions/translateWord';
import { getVerbConjugation } from '@/app/actions/getVerbConjugation';
import { pregenerateNextLesson } from '@/app/actions/pregenerateNextLesson';
import {
  upsertVocabularyItem,
  logLesson,
  updateLessonStats,
  saveLessonMistake,
  getOldestMistake,
  deleteLessonMistake,
  getPregeneratedLesson,
  deletePregeneratedLesson,
  getUserVocabulary,
} from '@/services/firestore';

import { LessonProgressHeader } from '@/components/lesson/LessonProgressHeader';
import { ClickableSentence } from '@/components/lesson/ClickableSentence';
import { TranslationTooltip } from '@/components/lesson/TranslationTooltip';
import { GrammarBridgeCard } from '@/components/lesson/GrammarBridgeCard';
import { VisualVocabCard } from '@/components/lesson/VisualVocabCard';
import { CheckButton } from '@/components/lesson/CheckButton';
import { ContextChoiceExercise } from '@/components/lesson/ContextChoiceExercise';
import { SentenceBuilder } from '@/components/lesson/SentenceBuilder';
import { ReverseTranslationInput } from '@/components/lesson/ReverseTranslationInput';
import { DictationInput } from '@/components/lesson/DictationInput';
import { ErrorCorrectionExercise } from '@/components/lesson/ErrorCorrectionExercise';
import { VerbConjugationDrill } from '@/components/lesson/VerbConjugationDrill';
import { SpeakRepeatExercise } from '@/components/lesson/SpeakRepeatExercise';
import { ImageMatchExercise } from '@/components/lesson/ImageMatchExercise';

import type { LessonStage, GrammarBridgeResult, Exercise } from '@/types';
import type { WordClickPayload } from '@/components/lesson/ClickableWord';

/** Builds a short description of an exercise + wrong answer for the AI review prompt. */
function buildMistakeContext(exercise: Exercise): string {
  switch (exercise.type) {
    case 'context-choice':
      return `Fill-in-the-blank: "${exercise.data.sentence}" — correct answer: "${exercise.data.blankWord}"`;
    case 'error-correction':
      return `Error correction: "${exercise.data.sentence_with_error}" — error: "${exercise.data.error_word}", correct: "${exercise.data.correct_word}"`;
    case 'reverse-translation':
      return `Reverse translation: "${exercise.data.portuguese_sentence}" → "${exercise.data.target_translation}"`;
    case 'audio-dictation':
      return `Audio dictation: "${exercise.data.text}"`;
    case 'speak-repeat':
      return `Speak & repeat: "${exercise.data.text}"`;
    case 'sentence-builder':
      return `Sentence builder: correct order "${exercise.data.correctOrder.join(' ')}"`;
    case 'image-match':
      return `Image match: correct word "${exercise.data.word}"`;
    case 'verb-conjugation-drill':
      return `Verb conjugation: "${exercise.data.verb}" in ${exercise.data.tense}`;
  }
}

// ── Map LessonPhase → LessonStage for progress header ────────────────────────

function phaseToStage(phase: string): LessonStage {
  switch (phase) {
    case 'vocabulary': return 'vocabulary';
    case 'hook':       return 'hook';
    case 'grammar':    return 'grammar';
    case 'practice':   return 'practice';
    case 'review':     return 'review';
    case 'complete':   return 'review';
    default:           return 'hook';
  }
}

// ── Tooltip state shape ───────────────────────────────────────────────────────

interface TooltipState {
  isOpen: boolean;
  word: string;
  isLoading: boolean;
  translation?: string;
  explanation?: string;
  example?: string;
}

const CLOSED_TOOLTIP: TooltipState = { isOpen: false, word: '', isLoading: false };

// ─────────────────────────────────────────────────────────────────────────────

export default function LessonPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedLessonId = searchParams.get('id') ?? undefined;
  const { user, profile, setProfile } = useAuthStore();
  const store = useLessonStore();

  // Per-exercise answer state
  const [exerciseAnswer, setExerciseAnswer] = useState<boolean | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>(CLOSED_TOOLTIP);
  const [hookError, setHookError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingLineIdx, setPlayingLineIdx] = useState(-1);

  // ── Audio (Google Cloud TTS — two-voice dialogue) ────────────────────────

  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  // Set to true once the user deliberately navigates away so the bootstrap
  // effect doesn't start generating a new lesson after store.reset().
  const exitingRef = useRef(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cachedChunksRef = useRef<string[] | null>(null);
  // Monotonically-increasing session ID prevents stale onended callbacks
  // from a previous play session from triggering the next chunk.
  const playSessionRef = useRef(0);

  // Prevents the bootstrap from running more than once per component lifecycle.
  // Resets on handleRetry() so that retries work correctly.
  const lessonInitiatedRef = useRef(false);

  // Prefetch promises — start fetching the next screen's data while the user
  // is still reading/listening on the current screen.
  const grammarBridgePrefetchRef = useRef<Promise<GrammarBridgeResult | null> | null>(null);
  const exercisesPrefetchRef = useRef<Promise<Exercise[] | null> | null>(null);

  function stopAudio() {
    playSessionRef.current++;        // invalidate any in-flight callbacks
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
    setIsPlaying(false);
    setPlayingLineIdx(-1);
  }

  function startAudio(chunks: string[]) {
    stopAudio();                          // increments playSessionRef.current
    if (chunks.length === 0) return;
    const session = playSessionRef.current;
    setIsPlaying(true);

    // Reuse ONE Audio element for the entire sequence so the browser's
    // autoplay-activation context carries over from chunk to chunk.
    const audio = new Audio();
    audioRef.current = audio;

    function playIndex(i: number) {
      if (session !== playSessionRef.current) return; // cancelled
      if (i >= chunks.length) { setIsPlaying(false); setPlayingLineIdx(-1); return; }

      setPlayingLineIdx(i);
      audio.onended = () => setTimeout(() => playIndex(i + 1), 300);
      audio.onerror = () => {
        if (session === playSessionRef.current) { setIsPlaying(false); setPlayingLineIdx(-1); }
      };
      audio.src = `data:audio/mp3;base64,${chunks[i]}`;
      audio.play().catch(() => {
        if (session === playSessionRef.current) { setIsPlaying(false); setPlayingLineIdx(-1); }
      });
    }

    playIndex(0);
  }

  function handleAudioButton() {
    if (isPlaying) { stopAudio(); return; }
    if (!store.hook) return;
    if (cachedChunksRef.current) { startAudio(cachedChunksRef.current); return; }
    if (!store.lesson || isLoadingAudio) return;
    const lines = store.hook.dialogue.split('\n').filter((l) => l.trim().length > 0);
    const language = store.lesson.language;
    (async () => {
      setIsLoadingAudio(true);
      try {
        const chunks = await synthesizeDialogue(lines, language);
        if (chunks.length > 0) { cachedChunksRef.current = chunks; startAudio(chunks); }
      } finally {
        setIsLoadingAudio(false);
      }
    })();
  }

  // Auto-fetch + play when entering hook phase
  useEffect(() => {
    if (store.phase !== 'hook') {
      stopAudio();
      cachedChunksRef.current = null;
      return;
    }
    if (!store.hook || !store.lesson) return;
    const lines = store.hook.dialogue.split('\n').filter((l) => l.trim().length > 0);
    const language = store.lesson.language;
    let cancelled = false;

    (async () => {
      setIsLoadingAudio(true);
      try {
        const chunks = await synthesizeDialogue(lines, language);
        if (!cancelled && chunks.length > 0) {
          cachedChunksRef.current = chunks;
          startAudio(chunks);
        }
      } catch (err) {
        console.error('[LessonPage] TTS error:', err);
      } finally {
        if (!cancelled) setIsLoadingAudio(false);
      }
    })();

    return () => { cancelled = true; stopAudio(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.phase]);

  // ── Redirect if not authenticated ────────────────────────────────────────

  useEffect(() => {
    if (!user || !profile) {
      router.replace('/login');
    }
  }, [user, profile, router]);

  // ── Lesson bootstrap ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!profile) return;
    if (exitingRef.current) return;
    if (store.phase !== 'idle') return;
    if (lessonInitiatedRef.current) return;
    lessonInitiatedRef.current = true;

    setHookError(false);
    const language = profile.currentTargetLanguage;
    // If a specific lesson was requested (replay), use it; otherwise use progress
    const lesson =
      (requestedLessonId ? getLessonById(requestedLessonId) : undefined) ??
      getNextLesson(language, profile.lessonProgress?.[language]);
    store.init(lesson, profile.interests ?? []);

    (async () => {
      store.setIsLoading(true);
      try {
        // Check if we have a pre-generated lesson ready (from previous lesson completion).
        // Wrapped in its own try/catch so a Firestore permission error never crashes the bootstrap.
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

        // Fetch user's known vocabulary (needed both for hook generation and exercise constraints)
        const vocabDocs = user ? await getUserVocabulary(user.uid, lesson.language) : [];
        const knownVocabulary = vocabDocs.map((v) => v.word);
        store.setKnownVocabulary(knownVocabulary);

        if (!hook) {
          // No cache — generate normally (super-hook: dialogue + grammar bridge + keywords + translations)
          hook = await generateHook({
            language: lesson.language,
            level: lesson.level,
            interests: profile.interests ?? [],
            grammarFocus: lesson.grammarFocus,
            knownVocabulary,
          });
        }

        if (hook) {
          store.setHook(hook);
          store.setPhase('vocabulary');
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

  // ── Prefetch: start next-screen data while user reads/listens ────────────

  // 1. Phase active → resolve grammar bridge + start vocab images + translations early
  useEffect(() => {
    if ((store.phase !== 'hook' && store.phase !== 'vocabulary') || !store.hook || !store.lesson) return;
    const { hook, lesson } = store;

    // Grammar bridge: use bundled data if available, otherwise fall back to a separate call
    if (hook.grammarBridge) {
      grammarBridgePrefetchRef.current = Promise.resolve(hook.grammarBridge);
    } else {
      grammarBridgePrefetchRef.current = generateGrammarBridge({
        dialogue: hook.dialogue,
        grammarFocus: hook.grammarFocus,
        language: lesson.language,
      });
    }

    // Translations: populate from bundled data immediately, or fire separate calls as fallback
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

    // Images: start Pexels fetches now using bundled keywords (or Gemini fallback per-word)
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.phase]);

  // 2. Grammar phase active → prefetch AI practice exercises (moved up from vocabulary phase)
  useEffect(() => {
    if (store.phase !== 'grammar' || !store.hook || !store.lesson) return;
    exercisesPrefetchRef.current = fetchAiExercises();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.phase]);

  // 3. Complete phase → prefetch home page so navigation is instant
  useEffect(() => {
    if (store.phase === 'complete') {
      router.prefetch('/');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.phase]);

  // ── Stage advance handlers ────────────────────────────────────────────────

  /** Fetches only the AI-generated exercises (Gemini). Used for prefetch. */
  async function fetchAiExercises(): Promise<Exercise[] | null> {
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
  }

  /**
   * Builds client-side exercises (sentence-builder + image-match) synchronously
   * from current store state. Called at transition time so vocabImages is populated.
   */
  function buildClientExercises(): Exercise[] {
    if (!store.hook) return [];
    const exercises: Exercise[] = [];

    // image-match: first vocab word with an image (vocabImages is populated by now)
    const vocabWithImage = store.hook.newVocabulary.find(
      (w) => store.vocabImages[w]?.imageUrl,
    );
    if (vocabWithImage) {
      const imgData = store.vocabImages[vocabWithImage]!;
      // Use pre-computed visually distinct distractors from the super-hook;
      // fall back to other lesson vocab words if the field is absent (old cache).
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
  }

  function advanceFromVocabulary() {
    if (!store.lesson || !store.hook) return;
    store.setPhase('hook');
  }

  async function advanceFromHook() {
    if (!store.lesson || !store.hook || store.isLoading) return;
    store.setIsLoading(true);

    // Use the prefetched promise (likely already resolved) or fall back to fetching now
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
  }

  async function advanceFromGrammar() {
    if (!store.lesson || !store.hook || store.isLoading) return;
    store.setIsLoading(true);

    // AI exercises prefetched; client-side exercises built NOW so vocabImages is populated
    const aiExercises = await (exercisesPrefetchRef.current ?? fetchAiExercises());
    exercisesPrefetchRef.current = null;
    const clientExercises = buildClientExercises();

    store.setExercises([...(aiExercises ?? []), ...clientExercises]);
    store.setPhase('practice');
  }

  async function finishLesson() {
    if (!user || !store.lesson || !store.hook) return;
    const total = store.exercises.length;
    const score = total > 0 ? Math.round((store.correctCount / total) * 100) : 0;

    // Fire-and-forget — don't block the UI
    logLesson({
      uid: user.uid,
      lessonId: store.lesson.id,
      language: store.lesson.language,
      score,
    }).catch(console.error);

    // Update totalLessonsCompleted + streak + lesson progress, then refresh local profile
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

    // Pre-cache verb conjugation so the Verbs page loads it instantly
    if (store.hook.verbWord) {
      getVerbConjugation(store.hook.verbWord, language).catch(console.error);
    }

    // Pre-generate the next lesson in the background so it starts instantly
    const nextLessonId = getNextLessonId(language, store.lesson.id);
    if (nextLessonId && user) {
      const nextLesson = getLessonById(nextLessonId);
      if (nextLesson) {
        pregenerateNextLesson(user.uid, nextLesson, profile?.interests ?? []).catch(console.error);
      }
    }
  }

  function exitLesson() {
    exitingRef.current = true;
    store.reset();
    router.replace('/');
  }

  function handleRetry() {
    setHookError(false);
    lessonInitiatedRef.current = false;
    store.reset(); // resets phase to 'idle' → bootstrap effect re-runs
  }

  // ── Exercise check / continue ─────────────────────────────────────────────

  function handleAnswer(correct: boolean) {
    setExerciseAnswer(correct);
    if (correct) {
      store.recordCorrect();
    } else if (store.lesson) {
      // Record this mistake to Firestore (fire-and-forget, deduplicates by grammarFocus)
      const exercise = store.exercises[store.exerciseIndex];
      if (exercise) {
        saveLessonMistake(
          user!.uid,
          store.lesson.language,
          store.lesson.grammarFocus,
          buildMistakeContext(exercise),
          store.lesson.id,
          store.lesson.level,
        ).catch(console.error);
      }
    }
  }

  function handleCheck() {
    // CheckButton in 'idle' state — nothing to do here; exercises call onAnswer directly
  }

  function handleReviewAnswer(correct: boolean) {
    setExerciseAnswer(correct);
    if (correct) store.recordReviewCorrect();
  }

  async function handleContinue() {
    const isLast = store.exerciseIndex >= store.exercises.length - 1;
    if (!isLast) {
      setExerciseAnswer(null);
      store.nextExercise();
      return;
    }

    // Last practice exercise — finish lesson stats, then check for a mistake to review
    store.setPhase('complete'); // optimistic: overridden below if review is needed
    setExerciseAnswer(null);
    finishLesson();

    if (!user || !store.lesson) return;
    try {
      store.setIsLoading(true);
      const mistake = await getOldestMistake(user.uid, store.lesson.language);
      if (mistake) {
        const exercises = await generateMistakeReview({
          grammarFocus: mistake.grammarFocus,
          mistakeContext: mistake.mistakeContext,
          language: store.lesson.language,
          level: store.lesson.level,
          knownVocabulary: [...store.knownVocabulary, ...(store.hook?.newVocabulary ?? [])],
        });
        if (exercises) {
          store.setReview(mistake, exercises);
          store.setPhase('review');
          return;
        }
      }
    } catch (err) {
      console.error('[LessonPage] mistake review error:', err);
    } finally {
      store.setIsLoading(false);
    }
  }

  async function handleReviewContinue() {
    const isLastReview = store.reviewIndex >= store.reviewExercises.length - 1;
    if (!isLastReview) {
      setExerciseAnswer(null);
      store.nextReviewExercise();
      return;
    }

    // Last review exercise — if all 3 correct, delete the mistake
    setExerciseAnswer(null);
    if (store.reviewMistake?.id && store.reviewCorrectCount + (exerciseAnswer === true ? 1 : 0) >= store.reviewExercises.length) {
      deleteLessonMistake(store.reviewMistake.id).catch(console.error);
    }
    store.setPhase('complete');
  }

  // ── Click-to-translate ────────────────────────────────────────────────────

  const handleWordClick = useCallback(
    async ({ word }: WordClickPayload) => {
      if (!store.lesson) return;
      setTooltip({ isOpen: true, word, isLoading: true });
      const result = await translateWord(word, store.hook?.dialogue ?? '', store.lesson.language);
      setTooltip({
        isOpen: true,
        word,
        isLoading: false,
        translation: result?.translation,
        explanation: result?.explanation,
        example: result?.example,
      });
    },
    [store.lesson, store.hook],
  );

  // ── Derived state ─────────────────────────────────────────────────────────

  const phase = store.phase;
  const currentExercise = store.exercises[store.exerciseIndex];
  const currentReviewExercise = store.reviewExercises[store.reviewIndex];
  const activeExercise = phase === 'review' ? currentReviewExercise : currentExercise;

  const checkState = (() => {
    if (exerciseAnswer === null) return 'disabled' as const;
    return exerciseAnswer ? 'correct' as const : 'incorrect' as const;
  })();

  // Correct answer shown in CheckButton banner when wrong
  // (reverse-translation, audio-dictation, and sentence-builder already show it inline)
  const correctAnswerForBanner: string | undefined = (() => {
    if (!activeExercise || exerciseAnswer !== false) return undefined;
    switch (activeExercise.type) {
      case 'context-choice':   return activeExercise.data.blankWord;
      case 'error-correction': return activeExercise.data.correct_word;
      default:                 return undefined;
    }
  })();

  // For exercises that require manual Verificar (like ReverseTranslation / Dictation)
  // those components call onAnswer internally; CheckButton state is driven by exerciseAnswer

  // ── Error screen (must come before loading screen) ───────────────────────

  if (hookError) {
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 py-12 text-center"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div
          className="flex h-20 w-20 items-center justify-center rounded-3xl text-4xl animate-scale-in"
          style={{
            backgroundColor: 'var(--color-error-bg)',
            border: '1.5px solid rgba(220,38,38,0.2)',
          }}
        >
          ⚠️
        </div>
        <div className="animate-slide-up delay-75">
          <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Erro ao gerar lição
          </h2>
          <p className="mt-2 text-sm leading-relaxed max-w-xs mx-auto" style={{ color: 'var(--color-text-muted)' }}>
            Não foi possível conectar ao servidor de IA. Verifique sua conexão e tente novamente.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 w-full max-w-xs animate-slide-up delay-150">
          <button
            type="button"
            onClick={handleRetry}
            className="cta-shimmer relative w-full overflow-hidden rounded-2xl px-8 py-4 text-base font-bold text-white transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary) 0%, #2563eb 100%)',
              boxShadow: '0 6px 20px rgba(29,94,212,0.3)',
            }}
          >
            Tentar novamente
          </button>
          <button
            type="button"
            onClick={() => exitLesson()}
            className="text-sm font-medium transition-opacity hover:opacity-70 py-2"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  // ── Navigating away — render nothing to avoid loading screen flash ────────

  if (exitingRef.current) {
    return <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100dvh' }} />;
  }

  // ── Loading screen ────────────────────────────────────────────────────────

  if (phase === 'idle' || phase === 'loading') {
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div
          className="flex h-20 w-20 items-center justify-center rounded-3xl animate-pulse"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-surface-raised))',
            border: '1.5px solid var(--color-border)',
          }}
        >
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
        </div>
        <div className="text-center">
          <p className="font-display text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Preparando sua lição
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            A IA está gerando o conteúdo…
          </p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full animate-bounce"
              style={{ backgroundColor: 'var(--color-primary)', animationDelay: `${i * 150}ms`, opacity: 0.5 }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Complete screen ───────────────────────────────────────────────────────

  if (phase === 'complete') {
    const total = store.exercises.length;
    const correct = store.correctCount;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 100;
    const isPerfect = pct === 100;

    return (
      <div
        className="relative flex min-h-dvh flex-col items-center justify-center gap-6 px-5 py-12 overflow-hidden"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        {/* Background glow orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full blur-3xl opacity-30"
            style={{ background: 'radial-gradient(circle, rgba(29,94,212,0.4) 0%, transparent 70%)' }}
          />
          {isPerfect && (
            <div
              className="absolute bottom-1/4 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full blur-3xl opacity-25"
              style={{ background: 'radial-gradient(circle, rgba(217,119,6,0.5) 0%, transparent 70%)' }}
            />
          )}
        </div>

        {/* Trophy icon */}
        <div className="relative animate-scale-in">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-3xl animate-glow-amber"
            style={{
              background: isPerfect
                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                : 'linear-gradient(135deg, var(--color-primary), #2563eb)',
              boxShadow: isPerfect
                ? '0 12px 40px rgba(217,119,6,0.4)'
                : '0 12px 40px rgba(29,94,212,0.4)',
            }}
          >
            <Trophy size={44} color="white" />
          </div>
          {isPerfect && (
            <span className="absolute -top-2 -right-2 text-2xl animate-bounce">⭐</span>
          )}
        </div>

        {/* Score */}
        <div className="text-center animate-slide-up delay-75">
          <h1 className="font-display text-4xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {isPerfect ? 'Perfeito!' : 'Lição concluída!'}
          </h1>
          <div className="mt-3 flex items-baseline justify-center gap-1">
            <span
              className="font-display text-5xl font-bold"
              style={{ color: isPerfect ? 'var(--color-vocab)' : 'var(--color-primary)' }}
            >
              {pct}%
            </span>
            <span className="text-lg font-medium" style={{ color: 'var(--color-text-muted)' }}>de acerto</span>
          </div>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {correct} de {total} exercícios corretos
          </p>
        </div>

        {/* Score bar */}
        <div className="w-full max-w-xs animate-slide-up delay-150">
          <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: isPerfect
                  ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                  : 'linear-gradient(90deg, var(--color-primary), #60a5fa)',
              }}
            />
          </div>
        </div>

        {/* Learned words */}
        {store.hook && store.hook.newVocabulary.length > 0 && (
          <div
            className="w-full max-w-sm rounded-2xl p-4 animate-slide-up delay-225"
            style={{ backgroundColor: 'var(--color-surface)', border: '1.5px solid var(--color-border)' }}
          >
            <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
              Palavras aprendidas
            </p>
            <div className="flex flex-wrap gap-2">
              {store.hook.newVocabulary.map((w, i) => (
                <span
                  key={w}
                  className="rounded-xl px-3 py-1.5 text-sm font-semibold animate-scale-in"
                  style={{
                    animationDelay: `${300 + i * 80}ms`,
                    animationFillMode: 'both',
                    backgroundColor: 'var(--color-vocab-bg)',
                    color: 'var(--color-vocab)',
                    border: '1px solid rgba(217,119,6,0.2)',
                  }}
                >
                  {w}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="w-full max-w-sm animate-slide-up delay-300">
          <button
            type="button"
            onClick={() => exitLesson()}
            className="cta-shimmer relative w-full overflow-hidden rounded-2xl py-4 text-base font-bold text-white transition-all active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary) 0%, #2563eb 100%)',
              boxShadow: '0 8px 24px rgba(29,94,212,0.35)',
            }}
          >
            Continuar →
          </button>
        </div>
      </div>
    );
  }

  // ── Main lesson layout ────────────────────────────────────────────────────

  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100dvh' }}>
      <LessonProgressHeader
        currentStage={phaseToStage(phase)}
        onExit={exitLesson}
      />

      <main className="mx-auto max-w-lg md:max-w-2xl lg:max-w-4xl px-5 pt-6 pb-48">

        {/* ── Vocabulary phase ── */}
        {phase === 'vocabulary' && store.hook && store.lesson && (
          <div className="flex flex-col gap-5 animate-slide-up-spring">
            <div className="flex items-center gap-2">
              <span className="text-base">📖</span>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                Vocabulário da Lição
              </p>
            </div>
            {store.isLoading && store.hook.newVocabulary.length === 0 && (
              <div
                className="flex items-center gap-3 rounded-2xl px-4 py-3"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                <Loader2 size={16} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Carregando imagens…</span>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...new Set(store.hook.newVocabulary)].map((word, idx) => {
                const img = store.vocabImages[word];
                const translation = store.vocabTranslations[word] ?? word;
                return (
                  <div
                    key={word}
                    className="animate-slide-up"
                    style={{ animationDelay: `${idx * 80}ms`, animationFillMode: 'both' }}
                  >
                    <VisualVocabCard
                      word={word}
                      translation={translation}
                      language={store.lesson!.language}
                      imageUrl={img?.imageUrl}
                      imageAlt={img?.imageAlt}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Hook phase ── */}
        {phase === 'hook' && store.hook && (
          <div className="flex flex-col gap-5 animate-slide-up-spring">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">💬</span>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                  Diálogo
                </p>
              </div>
              <button
                type="button"
                onClick={handleAudioButton}
                disabled={isLoadingAudio}
                aria-label={isPlaying ? 'Parar áudio' : 'Ouvir diálogo'}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all active:scale-90 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: isPlaying ? 'var(--color-primary)' : 'var(--color-surface)',
                  border: `1.5px solid ${isPlaying ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  color: isPlaying ? '#fff' : 'var(--color-text-muted)',
                }}
              >
                {isLoadingAudio
                  ? <Loader2 size={13} className="animate-spin" />
                  : isPlaying
                    ? <VolumeX size={13} />
                    : <Volume2 size={13} />}
                {isPlaying ? 'Parar' : isLoadingAudio ? 'Carregando…' : 'Ouvir'}
              </button>
            </div>

            {/* Dialogue bubbles */}
            <div className="flex flex-col gap-3">
              {store.hook.dialogue.split('\n').filter((l) => l.trim()).map((line, i) => {
                const match = line.match(/^([^:]+):\s*(.+)/);
                const speakerName = match?.[1]?.trim();
                const text = match?.[2]?.trim() ?? line;
                const isEven = i % 2 === 0;
                const isActive = playingLineIdx === i;

                const speakerColor = isEven ? 'var(--color-primary)' : '#d97706';
                const bubbleBg = isEven ? 'var(--color-primary-light)' : 'var(--color-vocab-bg)';
                const bubbleBorder = isEven
                  ? `1.5px solid ${isActive ? 'var(--color-primary)' : 'rgba(29,94,212,0.2)'}`
                  : `1.5px solid ${isActive ? '#d97706' : 'rgba(217,119,6,0.2)'}`;

                return (
                  <div
                    key={i}
                    className={`flex flex-col ${isEven ? 'items-start' : 'items-end'} animate-slide-up`}
                    style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
                  >
                    {speakerName && (
                      <p
                        className="mb-1 px-1 text-xs font-bold uppercase tracking-wide"
                        style={{ color: speakerColor }}
                      >
                        {speakerName}
                      </p>
                    )}
                    <div
                      className="max-w-[88%] rounded-2xl px-4 py-3 transition-all duration-300"
                      style={{
                        backgroundColor: bubbleBg,
                        border: bubbleBorder,
                        borderRadius: isEven
                          ? '4px 18px 18px 18px'
                          : '18px 4px 18px 18px',
                        boxShadow: isActive
                          ? `0 4px 16px ${isEven ? 'rgba(29,94,212,0.2)' : 'rgba(217,119,6,0.2)'}`
                          : 'none',
                      }}
                    >
                      <ClickableSentence
                        text={text}
                        newVocabulary={[...new Set(store.hook!.newVocabulary)]}
                        onWordClick={handleWordClick}
                        className="text-lg"
                      />
                      {store.hook!.dialogueTranslations?.[i]?.trim() && (
                        <p
                          className="mt-1.5 text-sm italic border-t pt-1.5"
                          style={{
                            color: 'var(--color-bridge)',
                            borderColor: isEven ? 'rgba(29,94,212,0.15)' : 'rgba(217,119,6,0.15)',
                          }}
                        >
                          {store.hook!.dialogueTranslations[i]}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <p
              className="text-center text-xs italic"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Toque nas palavras destacadas para ver a tradução
            </p>
          </div>
        )}

        {/* ── Grammar phase ── */}
        {phase === 'grammar' && store.grammarBridge && store.lesson && (
          <div className="flex flex-col gap-5 animate-slide-up-spring">
            <div className="flex items-center gap-2">
              <span className="text-base">🧠</span>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                Ponte Gramatical
              </p>
            </div>
            <GrammarBridgeCard
              bridge={store.grammarBridge}
              language={store.lesson.language}
            />
          </div>
        )}


        {/* ── Practice phase ── */}
        {phase === 'practice' && currentExercise && store.lesson && (
          <div key={store.exerciseIndex} className="animate-slide-up-spring">
            {/* Progress header */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">✏️</span>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                    Prática
                  </p>
                </div>
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-bold tabular-nums"
                  style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                >
                  {store.exerciseIndex + 1} / {store.exercises.length}
                </span>
              </div>
              {/* Segmented progress bar */}
              <div className="flex gap-1">
                {store.exercises.map((_, i) => (
                  <div
                    key={i}
                    className="h-1.5 flex-1 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: i < store.exerciseIndex
                        ? 'var(--color-success)'
                        : i === store.exerciseIndex
                          ? 'var(--color-primary)'
                          : 'var(--color-border)',
                      transform: i === store.exerciseIndex ? 'scaleY(1.3)' : 'scaleY(1)',
                    }}
                  />
                ))}
              </div>
            </div>

            {currentExercise.type === 'context-choice' && (
              <ContextChoiceExercise
                data={currentExercise.data}
                onAnswer={handleAnswer}
                answered={exerciseAnswer !== null}
              />
            )}
            {currentExercise.type === 'sentence-builder' && (
              <SentenceBuilder
                data={currentExercise.data}
                onAnswer={handleAnswer}
                answered={exerciseAnswer !== null}
              />
            )}
            {currentExercise.type === 'reverse-translation' && (
              <ReverseTranslationInput
                data={currentExercise.data}
                language={store.lesson.language}
                onAnswer={handleAnswer}
                answered={exerciseAnswer !== null}
              />
            )}
            {currentExercise.type === 'audio-dictation' && (
              <DictationInput
                data={currentExercise.data}
                language={store.lesson.language}
                onAnswer={handleAnswer}
                answered={exerciseAnswer !== null}
              />
            )}
            {currentExercise.type === 'error-correction' && (
              <ErrorCorrectionExercise
                data={currentExercise.data}
                onAnswer={handleAnswer}
                answered={exerciseAnswer !== null}
              />
            )}
            {currentExercise.type === 'verb-conjugation-drill' && (
              <VerbConjugationDrill
                data={currentExercise.data}
                onAnswer={handleAnswer}
                answered={exerciseAnswer !== null}
              />
            )}
            {currentExercise.type === 'speak-repeat' && (
              <SpeakRepeatExercise
                data={currentExercise.data}
                language={store.lesson.language}
                onAnswer={handleAnswer}
                answered={exerciseAnswer !== null}
              />
            )}
            {currentExercise.type === 'image-match' && (
              <ImageMatchExercise
                data={currentExercise.data}
                onAnswer={handleAnswer}
                answered={exerciseAnswer !== null}
              />
            )}
          </div>
        )}

        {/* ── Review phase ── */}
        {phase === 'review' && currentReviewExercise && store.lesson && (
          <div key={`review-${store.reviewIndex}`} className="animate-slide-up-spring">
            {/* Review header */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-full animate-ping"
                    style={{ backgroundColor: 'var(--color-error)', opacity: 0.4 }}
                  />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-error)' }}>
                      Revisão de erros
                    </p>
                    {store.reviewMistake?.grammarFocus && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        {store.reviewMistake.grammarFocus}
                      </p>
                    )}
                  </div>
                </div>
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-bold tabular-nums"
                  style={{ backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)' }}
                >
                  {store.reviewIndex + 1} / {store.reviewExercises.length}
                </span>
              </div>
              <div className="flex gap-1">
                {store.reviewExercises.map((_, i) => (
                  <div
                    key={i}
                    className="h-1.5 flex-1 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor:
                        i < store.reviewIndex
                          ? 'var(--color-success)'
                          : i === store.reviewIndex
                            ? 'var(--color-error)'
                            : 'var(--color-border)',
                      transform: i === store.reviewIndex ? 'scaleY(1.3)' : 'scaleY(1)',
                    }}
                  />
                ))}
              </div>
            </div>

            {currentReviewExercise.type === 'context-choice' && (
              <ContextChoiceExercise
                data={currentReviewExercise.data}
                onAnswer={handleReviewAnswer}
                answered={exerciseAnswer !== null}
              />
            )}
            {currentReviewExercise.type === 'error-correction' && (
              <ErrorCorrectionExercise
                data={currentReviewExercise.data}
                onAnswer={handleReviewAnswer}
                answered={exerciseAnswer !== null}
              />
            )}
            {currentReviewExercise.type === 'reverse-translation' && (
              <ReverseTranslationInput
                data={currentReviewExercise.data}
                language={store.lesson.language}
                onAnswer={handleReviewAnswer}
                answered={exerciseAnswer !== null}
              />
            )}
          </div>
        )}
      </main>

      {/* ── Bottom CTA bar (non-practice, non-review phases) ── */}
      {phase !== 'practice' && phase !== 'review' && (
        <div
          className="fixed bottom-0 left-0 right-0 z-20 px-5 pb-6 pt-3"
          style={{
            backgroundColor: 'var(--color-bg)',
            borderTop: '1px solid var(--color-border)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <div className="mx-auto max-w-lg md:max-w-2xl lg:max-w-4xl">
            <button
              type="button"
              disabled={store.isLoading}
              onClick={
                phase === 'vocabulary'
                  ? advanceFromVocabulary
                  : phase === 'hook'
                    ? advanceFromHook
                    : advanceFromGrammar
              }
              className="cta-shimmer relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl px-6 py-4 text-base font-bold transition-all active:scale-[0.98] disabled:cursor-not-allowed"
              style={{
                background: store.isLoading
                  ? 'var(--color-surface-raised)'
                  : 'linear-gradient(135deg, var(--color-primary) 0%, #2563eb 100%)',
                color: store.isLoading ? 'var(--color-text-muted)' : '#fff',
                boxShadow: store.isLoading ? 'none' : '0 6px 20px rgba(29,94,212,0.35)',
              }}
            >
              {store.isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Carregando…
                </>
              ) : phase === 'grammar' ? (
                <>Praticar ✏️</>
              ) : phase === 'hook' ? (
                <>Entendi 🧠</>
              ) : (
                <>Continuar →</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── CheckButton (practice + review phases) ── */}
      {(phase === 'practice' || phase === 'review') && (
        <CheckButton
          state={checkState}
          correctAnswer={correctAnswerForBanner}
          onCheck={handleCheck}
          onContinue={phase === 'review' ? handleReviewContinue : handleContinue}
        />
      )}

      {/* ── Translation tooltip ── */}
      {store.lesson && (
        <TranslationTooltip
          word={tooltip.word}
          language={store.lesson.language}
          translation={tooltip.translation}
          explanation={tooltip.explanation}
          example={tooltip.example}
          isOpen={tooltip.isOpen}
          isLoading={tooltip.isLoading}
          onClose={() => setTooltip(CLOSED_TOOLTIP)}
        />
      )}
    </div>
  );
}
