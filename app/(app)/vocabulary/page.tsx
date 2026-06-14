'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getUserVocabulary } from '@/services/firestore';
import type { UserVocabularyDocument, SupportedLanguage } from '@/types';

import { LANG_LABEL } from '@/components/vocabulary/constants';
import { VocabularyHeader } from '@/components/vocabulary/VocabularyHeader';
import { VocabularyToolbar } from '@/components/vocabulary/VocabularyToolbar';
import { VocabularyReviewBanner } from '@/components/vocabulary/VocabularyReviewBanner';
import { VocabularyNoResults } from '@/components/vocabulary/VocabularyNoResults';
import { VocabularyDueSection } from '@/components/vocabulary/VocabularyDueSection';
import { VocabularyLearnedSection } from '@/components/vocabulary/VocabularyLearnedSection';
import { VocabularyLoadingState } from '@/components/vocabulary/VocabularyLoadingState';
import { VocabularyEmptyState } from '@/components/vocabulary/VocabularyEmptyState';
import { ReviewModeSheet } from '@/components/vocabulary/ReviewModeSheet';
import { FlashcardReviewSession } from '@/components/vocabulary/FlashcardReviewSession';
import { ContextReviewSession } from '@/components/vocabulary/ContextReviewSession';
import { ContextReviewLoading } from '@/components/vocabulary/ContextReviewLoading';
import { VisualReviewSession } from '@/components/vocabulary/VisualReviewSession';

import { useVocabEnrich } from '@/hooks/useVocabEnrich';
import { useVocabReview } from '@/hooks/useVocabReview';
import {
  computeVocabCounts,
  filterVocabulary,
  splitDueAndLearned,
  type SrsFilter,
} from '@/utils/vocabPageHelpers';

export default function VocabularyPage() {
  const { user, profile } = useAuthStore();
  const [items, setItems] = useState<UserVocabularyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [srsFilter, setSrsFilter] = useState<SrsFilter>('all');

  const language = (profile?.currentTargetLanguage ?? 'fr') as SupportedLanguage;
  const lang = LANG_LABEL[language];

  const loadVocabulary = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const vocab = await getUserVocabulary(user.uid, language);
    setItems(vocab);
    setLoading(false);
  }, [user, language]);

  const handleImageLoaded = useCallback((word: string, imageUrl: string) => {
    setItems((prev) => prev.map((item) => (item.word === word ? { ...item, imageUrl } : item)));
  }, []);

  const { enrichingWords, handleEnrichItem } = useVocabEnrich(user, items, language, setItems);

  const {
    isReviewActive,
    closeAllReview,
    rawDueToday,
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
    wordImageMap,
    openReviewPicker,
    startFlashcardMode,
    beginFlashcardSession,
    handleFlashcardAnswer,
    finishFlashcardReview,
    startVisualMode,
    beginVisualSession,
    handleVisualAnswer,
    handleVisualContinue,
    finishVisualReview,
    startContextMode,
    handleContextAnswer,
    handleContextContinue,
    finishContextReview,
  } = useVocabReview(user, profile, items, language, loadVocabulary);

  useEffect(() => {
    loadVocabulary();
  }, [loadVocabulary]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isReviewActive) {
        closeAllReview();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isReviewActive, closeAllReview]);

  if (loading) return <VocabularyLoadingState />;
  if (items.length === 0) return <VocabularyEmptyState />;

  const counts = computeVocabCounts(items);
  const filteredItems = filterVocabulary(items, searchQuery, srsFilter);
  const { dueToday, learned } = splitDueAndLearned(filteredItems);
  const noMatches = filteredItems.length === 0;

  return (
    <>
      <div className="min-h-dvh pb-24 md:pb-10 animate-fade-in" style={{ backgroundColor: 'var(--color-bg)' }}>
        <VocabularyHeader
          langFlag={lang.flag}
          langLabel={lang.label}
          totalWords={items.length}
          dueCount={rawDueToday.length}
          masteredCount={counts.masteredCount}
        />

        <main className="mx-auto max-w-lg md:max-w-2xl lg:max-w-4xl px-5 pt-6 flex flex-col gap-6">
          <VocabularyToolbar
            searchQuery={searchQuery}
            layoutMode={layoutMode}
            srsFilter={srsFilter}
            totalCount={counts.totalCount}
            newCount={counts.newCount}
            learningCount={counts.learningCount}
            masteredCount={counts.masteredCount}
            onSearchChange={setSearchQuery}
            onLayoutChange={setLayoutMode}
            onSrsFilterChange={setSrsFilter}
          />

          {rawDueToday.length > 0 && (
            <VocabularyReviewBanner
              dueCount={rawDueToday.length}
              onStartReview={openReviewPicker}
            />
          )}

          {noMatches && (
            <VocabularyNoResults
              searchQuery={searchQuery}
              onClear={() => {
                setSearchQuery('');
                setSrsFilter('all');
              }}
            />
          )}

          <VocabularyDueSection
            dueToday={dueToday}
            layoutMode={layoutMode}
            language={language}
            enrichingWords={enrichingWords}
            onEnrich={handleEnrichItem}
            onImageLoaded={handleImageLoaded}
          />

          <VocabularyLearnedSection
            learned={learned}
            layoutMode={layoutMode}
            language={language}
            enrichingWords={enrichingWords}
            onEnrich={handleEnrichItem}
            onImageLoaded={handleImageLoaded}
          />
        </main>
      </div>

      {showPicker && (
        <ReviewModeSheet
          sessionCount={sessionItems.length}
          totalDue={rawDueToday.length}
          onSelectFlashcard={startFlashcardMode}
          onSelectContext={startContextMode}
          onSelectVisual={startVisualMode}
          onClose={closeAllReview}
        />
      )}
      {contextLoading && (
        <ContextReviewLoading
          wordCount={sessionItems.length}
          onClose={closeAllReview}
        />
      )}
      {flashcardPhase && (
        <FlashcardReviewSession
          state={flashcardPhase}
          items={sessionItems}
          currentIdx={cardIdx}
          results={results}
          language={language}
          savingResults={savingResults}
          onStart={beginFlashcardSession}
          onAnswer={handleFlashcardAnswer}
          onFinish={finishFlashcardReview}
          onClose={closeAllReview}
        />
      )}
      {visualPhase && (
        <VisualReviewSession
          state={visualPhase}
          sessionItems={sessionItems}
          currentIdx={cardIdx}
          answered={answered}
          lastCorrect={lastCorrect}
          results={results}
          savingResults={savingResults}
          onStart={beginVisualSession}
          onAnswer={handleVisualAnswer}
          onContinue={handleVisualContinue}
          onFinish={finishVisualReview}
          onClose={closeAllReview}
        />
      )}
      {contextPhase && (
        <ContextReviewSession
          state={contextPhase}
          items={reviewItems}
          sessionItems={sessionItems}
          currentIdx={cardIdx}
          answered={answered}
          lastCorrect={lastCorrect}
          results={results}
          language={language}
          wordImageMap={wordImageMap}
          savingResults={savingResults}
          onAnswer={handleContextAnswer}
          onContinue={handleContextContinue}
          onFinish={finishContextReview}
          onClose={closeAllReview}
        />
      )}
    </>
  );
}
