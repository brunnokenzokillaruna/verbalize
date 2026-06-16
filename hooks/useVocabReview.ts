import { useState, useCallback, useMemo } from 'react';
import { generateVocabReview } from '@/app/actions/generateVocabReview';
import type { VocabReviewItem } from '@/app/actions/generateVocabReview';
import { updateVocabSrsAfterReview } from '@/services/firestore';
import { getLessonById, getNextLesson } from '@/lib/curriculum';
import { pickReviewSession } from '@/utils/reviewSession';
import {
  getVisualReviewPlayableItems,
  MIN_VISUAL_REVIEW_ITEMS,
} from '@/utils/imageMatchBuilder';
import { isDueForReview } from '@/utils/vocabPageHelpers';
import { useReviewSoundFeedback } from '@/hooks/useReviewSoundFeedback';
import type { ReviewResult } from '@/components/vocabulary/reviewTypes';
import type { UserVocabularyDocument, SupportedLanguage, UserDocument } from '@/types';
import type { User } from 'firebase/auth';

export type ReviewMode = 'flashcard' | 'context' | 'visual';

type ReviewPhase = 'ready' | 'running' | 'done' | null;

export function useVocabReview(
  user: User | null,
  profile: UserDocument | null,
  items: UserVocabularyDocument[],
  language: SupportedLanguage,
  loadVocabulary: () => Promise<void>,
) {
  const [showPicker, setShowPicker] = useState(false);
  const [sessionItems, setSessionItems] = useState<UserVocabularyDocument[]>([]);
  const [sessionSeed, setSessionSeed] = useState(0);
  const [flashcardPhase, setFlashcardPhase] = useState<ReviewPhase>(null);
  const [visualPhase, setVisualPhase] = useState<ReviewPhase>(null);
  const [contextPhase, setContextPhase] = useState<'running' | 'done' | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [reviewItems, setReviewItems] = useState<VocabReviewItem[]>([]);
  const [cardIdx, setCardIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [results, setResults] = useState<ReviewResult[]>([]);
  const [savingResults, setSavingResults] = useState(false);
  const { playAnswer } = useReviewSoundFeedback();

  const rawDueToday = useMemo(
    () => items.filter((item) => isDueForReview(item)),
    [items],
  );

  const sessionPreview = useMemo(
    () => pickReviewSession(rawDueToday),
    [rawDueToday, sessionSeed],
  );

  const wordImageMap = useMemo(
    () => Object.fromEntries(items.filter((v) => v.imageUrl).map((v) => [v.word, v.imageUrl!])),
    [items],
  );

  const visualImagePool = useMemo(
    () =>
      items.map((item) => ({
        word: item.word,
        translation: item.translation,
        imageUrl: item.imageUrl,
      })),
    [items],
  );

  const prepareVisualSession = useCallback(
    (session: UserVocabularyDocument[]) =>
      getVisualReviewPlayableItems(session, visualImagePool),
    [visualImagePool],
  );

  const isReviewActive =
    showPicker || flashcardPhase !== null || contextPhase !== null || visualPhase !== null || contextLoading;

  const closeAllReview = useCallback(() => {
    setShowPicker(false);
    setFlashcardPhase(null);
    setContextPhase(null);
    setVisualPhase(null);
    setContextLoading(false);
    setReviewItems([]);
    setCardIdx(0);
    setAnswered(false);
    setLastCorrect(null);
    setResults([]);
  }, []);

  const reshuffleSession = useCallback(() => {
    setSessionSeed((s) => s + 1);
  }, []);

  const prepareSession = useCallback(() => {
    const session = pickReviewSession(rawDueToday);
    setSessionItems(session);
    setResults([]);
    setCardIdx(0);
    setAnswered(false);
    setLastCorrect(null);
    return session;
  }, [rawDueToday]);

  const openReviewPicker = useCallback(() => {
    if (!user || rawDueToday.length === 0) return;
    prepareSession();
    setShowPicker(true);
  }, [user, rawDueToday.length, prepareSession]);

  const saveResults = useCallback(
    async (reviewResults: ReviewResult[]) => {
      if (!user) return;
      setSavingResults(true);
      await Promise.all(
        reviewResults.map((r) => updateVocabSrsAfterReview(user.uid, r.word, language, r.correct)),
      );
      await loadVocabulary();
      setSavingResults(false);
    },
    [user, language, loadVocabulary],
  );

  const startReview = useCallback(
    async (mode: ReviewMode) => {
      if (!user || rawDueToday.length === 0) return;

      const session = sessionPreview.length > 0 ? sessionPreview : prepareSession();
      setSessionItems(session);
      setResults([]);
      setCardIdx(0);
      setAnswered(false);
      setLastCorrect(null);
      setShowPicker(false);

      if (mode === 'flashcard') {
        setFlashcardPhase('running');
        return;
      }

      if (mode === 'visual') {
        const visualSession = prepareVisualSession(session);
        if (visualSession.length === 0) return;
        setSessionItems(visualSession);
        setVisualPhase('running');
        return;
      }

      setContextLoading(true);
      const currentLessonId = profile?.lessonProgress?.[language];
      const currentLesson =
        (currentLessonId ? getLessonById(currentLessonId) : undefined) ??
        getNextLesson(language, undefined);
      const level = currentLesson?.level ?? 'A1';
      const knownVocabulary = items.map((v) => v.word);

      try {
        const generated = await generateVocabReview({
          words: session.map((v) => ({
            word: v.word,
            translation: v.translation,
            imageUrl: v.imageUrl,
          })),
          language,
          level,
          knownVocabulary,
        });

        if (!generated || generated.length === 0) return;

        setReviewItems(generated);
        setContextPhase('running');
      } catch (err) {
        console.error('[startReview:context] Failed:', err);
      } finally {
        setContextLoading(false);
      }
    },
    [user, rawDueToday.length, sessionPreview, prepareSession, prepareVisualSession, profile, language, items],
  );

  const finishAndClose = useCallback(
    async (reviewResults: ReviewResult[]) => {
      await saveResults(reviewResults);
      closeAllReview();
    },
    [saveResults, closeAllReview],
  );

  const startFlashcardMode = useCallback(() => {
    setShowPicker(false);
    setCardIdx(0);
    setResults([]);
    setFlashcardPhase('ready');
  }, []);

  const beginFlashcardSession = useCallback(() => setFlashcardPhase('running'), []);

  const handleFlashcardAnswer = useCallback(
    (correct: boolean) => {
      const item = sessionItems[cardIdx];
      setResults((prev) => [...prev, { word: item.word, correct }]);
      if (cardIdx + 1 >= sessionItems.length) {
        setFlashcardPhase('done');
      } else {
        setCardIdx((i) => i + 1);
      }
    },
    [sessionItems, cardIdx],
  );

  const finishFlashcardReview = useCallback(() => finishAndClose(results), [finishAndClose, results]);

  const startVisualMode = useCallback(() => {
    const session = sessionItems.length > 0 ? sessionItems : prepareSession();
    const visualSession = prepareVisualSession(session);
    setShowPicker(false);
    setSessionItems(visualSession);
    setCardIdx(0);
    setResults([]);
    setAnswered(false);
    setLastCorrect(null);
    setVisualPhase('ready');
  }, [sessionItems, prepareSession, prepareVisualSession]);

  const beginVisualSession = useCallback(() => {
    if (sessionItems.length === 0) return;
    setVisualPhase('running');
  }, [sessionItems.length]);

  const skipVisualItem = useCallback(() => {
    if (cardIdx + 1 >= sessionItems.length) {
      setVisualPhase('done');
      return;
    }
    setCardIdx((index) => index + 1);
    setAnswered(false);
    setLastCorrect(null);
  }, [cardIdx, sessionItems.length]);

  const handleVisualAnswer = useCallback(
    (correct: boolean) => {
      if (answered) return;
      setAnswered(true);
      setLastCorrect(correct);
      playAnswer(correct);
    },
    [answered, playAnswer],
  );

  const handleVisualContinue = useCallback(() => {
    if (!answered || lastCorrect === null) return;
    const item = sessionItems[cardIdx];
    const newResults = [...results, { word: item.word, correct: lastCorrect }];
    setResults(newResults);
    if (cardIdx + 1 >= sessionItems.length) {
      setVisualPhase('done');
    } else {
      setCardIdx(cardIdx + 1);
      setAnswered(false);
      setLastCorrect(null);
    }
  }, [answered, lastCorrect, sessionItems, cardIdx, results]);

  const finishVisualReview = useCallback(() => finishAndClose(results), [finishAndClose, results]);

  const startContextMode = useCallback(async () => {
    if (!user) return;
    setShowPicker(false);
    setContextLoading(true);
    setCardIdx(0);
    setResults([]);
    setAnswered(false);
    setLastCorrect(null);

    const currentLessonId = profile?.lessonProgress?.[language];
    const currentLesson =
      (currentLessonId ? getLessonById(currentLessonId) : undefined) ??
      getNextLesson(language, undefined);
    const level = currentLesson?.level ?? 'A1';
    const knownVocabulary = items.map((v) => v.word);

    try {
      const generated = await generateVocabReview({
        words: sessionItems.map((v) => ({
          word: v.word,
          translation: v.translation,
          imageUrl: v.imageUrl,
        })),
        language,
        level,
        knownVocabulary,
      });

      if (!generated || generated.length === 0) return;

      setReviewItems(generated);
      setContextPhase('running');
    } catch (err) {
      console.error('[startContextMode] Failed:', err);
    } finally {
      setContextLoading(false);
    }
  }, [user, profile, language, items, sessionItems]);

  const handleContextAnswer = useCallback(
    (correct: boolean) => {
      if (answered) return;
      setAnswered(true);
      setLastCorrect(correct);
      playAnswer(correct);
    },
    [answered, playAnswer],
  );

  const handleContextContinue = useCallback(() => {
    if (!answered || lastCorrect === null) return;

    const currentItem = reviewItems[cardIdx];
    const newResults = [...results, { word: currentItem.word, correct: lastCorrect }];
    setResults(newResults);

    if (cardIdx + 1 >= reviewItems.length) {
      setContextPhase('done');
    } else {
      setCardIdx(cardIdx + 1);
      setAnswered(false);
      setLastCorrect(null);
    }
  }, [answered, lastCorrect, reviewItems, cardIdx, results]);

  const finishContextReview = useCallback(() => finishAndClose(results), [finishAndClose, results]);

  return {
    rawDueToday,
    sessionPreview,
    wordImageMap,
    visualImagePool,
    minVisualReviewItems: MIN_VISUAL_REVIEW_ITEMS,
    isReviewActive,
    showPicker,
    sessionItems,
    flashcardPhase,
    visualPhase,
    contextPhase,
    contextLoading,
    reviewItems,
    cardIdx,
    answered,
    lastCorrect,
    results,
    savingResults,
    openReviewPicker,
    closeAllReview,
    reshuffleSession,
    startReview,
    startFlashcardMode,
    beginFlashcardSession,
    handleFlashcardAnswer,
    finishFlashcardReview,
    startVisualMode,
    beginVisualSession,
    skipVisualItem,
    handleVisualAnswer,
    handleVisualContinue,
    finishVisualReview,
    startContextMode,
    handleContextAnswer,
    handleContextContinue,
    finishContextReview,
  };
}
