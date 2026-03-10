'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Trophy, Volume2, VolumeX } from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import { useLessonStore } from '@/store/lessonStore';
import { getNextLesson, getNextLessonId, getLessonById } from '@/lib/curriculum';

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
    case 'hook':       return 'hook';
    case 'grammar':    return 'grammar';
    case 'vocabulary': return 'vocabulary';
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
  const [showDialogueTranslation, setShowDialogueTranslation] = useState(true);

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
      if (i >= chunks.length) { setIsPlaying(false); return; }

      audio.onended = () => setTimeout(() => playIndex(i + 1), 300);
      audio.onerror = () => {
        if (session === playSessionRef.current) setIsPlaying(false);
      };
      audio.src = `data:audio/mp3;base64,${chunks[i]}`;
      audio.play().catch(() => {
        if (session === playSessionRef.current) setIsPlaying(false);
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

        if (!hook) {
          // No cache — generate normally (super-hook: dialogue + grammar bridge + keywords + translations)
          hook = await generateHook({
            language: lesson.language,
            level: lesson.level,
            interests: profile.interests ?? [],
            grammarFocus: lesson.grammarFocus,
          });
        }

        if (hook) {
          store.setHook(hook);
          store.setPhase('hook');
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

  // 1. Hook phase active → resolve grammar bridge + start vocab images + translations early
  useEffect(() => {
    if (store.phase !== 'hook' || !store.hook || !store.lesson) return;
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
    });
  }

  /**
   * Builds client-side exercises (sentence-builder + image-match) synchronously
   * from current store state. Called at transition time so vocabImages is populated.
   */
  function buildClientExercises(): Exercise[] {
    if (!store.hook) return [];
    const exercises: Exercise[] = [];

    // sentence-builder: first suitable dialogue line
    const dialogueSentences = store.hook.dialogue
      .split('\n')
      .filter((l) => l.trim().length > 0)
      .map((line) => {
        const m = line.match(/^[^:]+:\s*(.+)/);
        return m ? m[1].trim() : line.trim();
      })
      .filter((text) => {
        const wc = text.split(/\s+/).length;
        return wc >= 3 && wc <= 10;
      });
    if (dialogueSentences[0]) {
      const words = dialogueSentences[0].split(/\s+/).filter(Boolean);
      exercises.push({
        type: 'sentence-builder',
        data: { words: [...words].sort(() => Math.random() - 0.5), correctOrder: words, translation: '' },
      });
    }

    // image-match: first vocab word with an image (vocabImages is populated by now)
    const vocabWithImage = store.hook.newVocabulary.find(
      (w) => store.vocabImages[w]?.imageUrl,
    );
    if (vocabWithImage) {
      const imgData = store.vocabImages[vocabWithImage]!;
      const distractors = store.hook.newVocabulary
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

  function advanceFromGrammar() {
    if (!store.lesson || !store.hook) return;
    // Vocab translations + images are already being fetched by the grammar-phase
    // prefetch effect — just transition immediately.
    store.setPhase('vocabulary');
  }

  async function advanceFromVocabulary() {
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
        className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 py-12 text-center"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full text-3xl"
          style={{ backgroundColor: 'var(--color-error-bg)' }}
        >
          ⚠️
        </div>
        <div>
          <h2
            className="font-display text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Erro ao gerar lição
          </h2>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Não foi possível conectar ao servidor de IA.{'\n'}Verifique sua conexão e tente novamente.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRetry}
          className="rounded-2xl px-8 py-4 text-base font-semibold transition-all active:scale-95"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-text-inverse)' }}
        >
          Tentar novamente
        </button>
        <button
          type="button"
          onClick={() => exitLesson()}
          className="text-sm transition-opacity hover:opacity-70"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Voltar ao início
        </button>
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
        className="flex min-h-dvh flex-col items-center justify-center gap-4"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <Loader2 size={36} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Gerando sua lição…
        </p>
      </div>
    );
  }

  // ── Complete screen ───────────────────────────────────────────────────────

  if (phase === 'complete') {
    const total = store.exercises.length;
    const correct = store.correctCount;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 100;

    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center gap-6 px-5 py-12"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full"
          style={{ backgroundColor: 'var(--color-primary-light)' }}
        >
          <Trophy size={40} style={{ color: 'var(--color-primary)' }} />
        </div>

        <div className="text-center">
          <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Lição concluída!
          </h1>
          <p className="mt-2 text-lg font-semibold" style={{ color: 'var(--color-primary)' }}>
            {pct}% de acerto
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {correct} de {total} exercícios corretos
          </p>
        </div>

        {store.hook && store.hook.newVocabulary.length > 0 && (
          <div
            className="w-full max-w-sm rounded-2xl p-4"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
              Palavras aprendidas
            </p>
            <div className="flex flex-wrap gap-2">
              {store.hook.newVocabulary.map((w) => (
                <span
                  key={w}
                  className="rounded-lg px-3 py-1 text-sm font-medium"
                  style={{ backgroundColor: 'var(--color-vocab-bg)', color: 'var(--color-vocab)' }}
                >
                  {w}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => exitLesson()}
          className="rounded-2xl px-8 py-4 text-base font-semibold transition-all active:scale-95"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-text-inverse)' }}
        >
          Voltar ao início
        </button>
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

        {/* ── Hook phase ── */}
        {phase === 'hook' && store.hook && (
          <div className="flex flex-col gap-5 animate-slide-up">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                  Diálogo
                </p>
                <div className="flex items-center gap-2">
                  {store.hook.dialogueTranslations && store.hook.dialogueTranslations.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowDialogueTranslation((v) => !v)}
                      className="rounded-full px-3 py-1 text-xs font-medium transition-all active:scale-90"
                      style={{
                        backgroundColor: showDialogueTranslation ? 'var(--color-bridge-bg)' : 'var(--color-surface-raised)',
                        color: showDialogueTranslation ? 'var(--color-bridge)' : 'var(--color-text-muted)',
                        border: `1px solid ${showDialogueTranslation ? 'var(--color-bridge)' : 'var(--color-border)'}`,
                      }}
                    >
                      PT
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleAudioButton}
                    disabled={isLoadingAudio}
                    aria-label={isPlaying ? 'Parar áudio' : 'Ouvir diálogo'}
                    className="flex h-8 w-8 items-center justify-center rounded-full transition-all active:scale-90 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: isPlaying ? 'var(--color-primary)' : 'var(--color-surface-raised)',
                      color: isPlaying ? 'var(--color-text-inverse)' : 'var(--color-text-muted)',
                    }}
                  >
                    {isLoadingAudio
                      ? <Loader2 size={15} className="animate-spin" />
                      : isPlaying
                        ? <VolumeX size={15} />
                        : <Volume2 size={15} />}
                  </button>
                </div>
              </div>
              {store.hook.dialogue.split('\n').filter((l) => l.trim()).map((line, i) => {
                const match = line.match(/^([^:]+):\s*(.+)/);
                const speakerName = match?.[1]?.trim();
                const text = match?.[2]?.trim() ?? line;
                const isEven = i % 2 === 0;
                const ptTranslation = store.hook!.dialogueTranslations?.[i];
                return (
                  <div key={i} className="mb-4">
                    {speakerName && (
                      <p
                        className="mb-1 text-xs font-bold uppercase tracking-wide"
                        style={{ color: isEven ? 'var(--color-primary)' : 'var(--color-accent, #e05c2a)' }}
                      >
                        {speakerName}
                      </p>
                    )}
                    <ClickableSentence
                      text={text}
                      newVocabulary={store.hook!.newVocabulary}
                      onWordClick={handleWordClick}
                      className="text-lg"
                    />
                    {showDialogueTranslation && ptTranslation?.trim() && (
                      <p
                        className="mt-1 text-sm italic"
                        style={{ color: 'var(--color-bridge)' }}
                      >
                        {ptTranslation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              Toque nas palavras para ver a tradução
            </p>
          </div>
        )}

        {/* ── Grammar phase ── */}
        {phase === 'grammar' && store.grammarBridge && store.lesson && (
          <div className="animate-slide-up">
            <GrammarBridgeCard
              rule={store.grammarBridge.rule}
              targetExample={store.grammarBridge.targetExample}
              portugueseComparison={store.grammarBridge.portugueseComparison}
              language={store.lesson.language}
              additionalExamples={store.grammarBridge.additionalExamples}
            />
          </div>
        )}

        {/* ── Vocabulary phase ── */}
        {phase === 'vocabulary' && store.hook && store.lesson && (
          <div className="flex flex-col gap-4 animate-slide-up">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
              Novo vocabulário
            </p>
            {store.isLoading && store.hook.newVocabulary.length === 0 && (
              <div className="flex items-center gap-3">
                <Loader2 size={18} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Carregando imagens…</span>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {store.hook.newVocabulary.map((word) => {
                const img = store.vocabImages[word];
                const translation = store.vocabTranslations[word] ?? word;
                return (
                  <VisualVocabCard
                    key={word}
                    word={word}
                    translation={translation}
                    language={store.lesson!.language}
                    imageUrl={img?.imageUrl}
                    imageAlt={img?.imageAlt}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* ── Practice phase ── */}
        {phase === 'practice' && currentExercise && store.lesson && (
          <div key={store.exerciseIndex} className="animate-slide-up">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                Exercício {store.exerciseIndex + 1} / {store.exercises.length}
              </p>
              <div className="flex gap-1">
                {store.exercises.map((_, i) => (
                  <div
                    key={i}
                    className="h-1.5 w-6 rounded-full"
                    style={{
                      backgroundColor: i < store.exerciseIndex
                        ? 'var(--color-success)'
                        : i === store.exerciseIndex
                          ? 'var(--color-primary)'
                          : 'var(--color-border)',
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
          <div key={`review-${store.reviewIndex}`} className="animate-slide-up">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-error)' }}>
                  Revisão de erros
                </p>
                <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {store.reviewMistake?.grammarFocus}
                </p>
              </div>
              <div className="flex gap-1">
                {store.reviewExercises.map((_, i) => (
                  <div
                    key={i}
                    className="h-1.5 w-6 rounded-full"
                    style={{
                      backgroundColor:
                        i < store.reviewIndex
                          ? 'var(--color-success)'
                          : i === store.reviewIndex
                            ? 'var(--color-error)'
                            : 'var(--color-border)',
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
          className="fixed bottom-0 left-0 right-0 z-20 mx-auto max-w-lg md:max-w-2xl lg:max-w-4xl px-5 pb-6 pt-3"
          style={{ backgroundColor: 'var(--color-bg)' }}
        >
          <button
            type="button"
            disabled={store.isLoading}
            onClick={
              phase === 'hook'
                ? advanceFromHook
                : phase === 'grammar'
                  ? advanceFromGrammar
                  : advanceFromVocabulary
            }
            className="flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed"
            style={{
              backgroundColor: store.isLoading ? 'var(--color-surface-raised)' : 'var(--color-primary)',
              color: store.isLoading ? 'var(--color-text-muted)' : 'var(--color-text-inverse)',
              boxShadow: store.isLoading ? 'none' : '0 4px 16px rgba(29, 94, 212, 0.3)',
            }}
          >
            {store.isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Carregando…
              </>
            ) : phase === 'vocabulary' ? (
              'Praticar'
            ) : (
              'Continuar'
            )}
          </button>
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
