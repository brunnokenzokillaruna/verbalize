'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getUserVocabulary, updateVocabImage } from '@/services/firestore';
import { wordsMatchCanonically } from '@/lib/vocabCanonical';
import type { UserVocabularyDocument, SupportedLanguage } from '@/types';

import { LANG_LABEL } from '@/components/vocabulary/constants';
import { VocabularyHeader } from '@/components/vocabulary/VocabularyHeader';
import { VocabularyTabNav, type VocabularyTab } from '@/components/vocabulary/VocabularyTabNav';
import { VocabularyReviewHub } from '@/components/vocabulary/VocabularyReviewHub';
import { VocabularyNoResults } from '@/components/vocabulary/VocabularyNoResults';
import { VocabularyLibrarySection } from '@/components/vocabulary/VocabularyLibrarySection';
import { VocabularyLoadingState } from '@/components/vocabulary/VocabularyLoadingState';
import { VocabularyEmptyState } from '@/components/vocabulary/VocabularyEmptyState';
import { FlashcardReviewSession } from '@/components/vocabulary/FlashcardReviewSession';
import { ContextReviewSession } from '@/components/vocabulary/ContextReviewSession';
import { ContextReviewLoading } from '@/components/vocabulary/ContextReviewLoading';
import { VisualReviewSession } from '@/components/vocabulary/VisualReviewSession';

import { useVocabEnrich } from '@/hooks/useVocabEnrich';
import { useVocabReview } from '@/hooks/useVocabReview';
import {
  computeVocabCounts,
  filterVocabulary,
  isReviewedToday,
  type SrsFilter,
} from '@/utils/vocabPageHelpers';

function VocabularyReviewComplete({ onBrowseLibrary }: { onBrowseLibrary: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-8 flex flex-col items-center text-center gap-4 animate-slide-up-spring">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ backgroundColor: 'var(--color-success-bg)' }}
      >
        <CheckCircle2 size={28} style={{ color: 'var(--color-success)' }} />
      </div>
      <div>
        <p className="font-display text-lg font-bold text-text-primary">Tudo em dia!</p>
        <p className="mt-1 text-sm text-text-muted max-w-xs">
          Nenhuma palavra pendente de revisão hoje. Explore sua biblioteca ou volte amanhã.
        </p>
      </div>
      <button
        type="button"
        onClick={onBrowseLibrary}
        className="rounded-xl px-5 py-2.5 text-sm font-bold transition-all active:scale-95 cursor-pointer text-white"
        style={{
          backgroundColor: 'var(--color-primary)',
          boxShadow: '0 3px 0 var(--color-primary-dark)',
        }}
      >
        Abrir biblioteca
      </button>
    </div>
  );
}

export default function VocabularyPage() {
  const { user, profile } = useAuthStore();
  const [items, setItems] = useState<UserVocabularyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [srsFilter, setSrsFilter] = useState<SrsFilter>('all');
  const [activeTab, setActiveTab] = useState<VocabularyTab>('review');
  const [tabInitialized, setTabInitialized] = useState(false);
  const [initialDueCount, setInitialDueCount] = useState<number | null>(null);

  const language = (profile?.currentTargetLanguage ?? 'fr') as SupportedLanguage;
  const lang = LANG_LABEL[language];

  const loadVocabulary = useCallback(async (opts?: { silent?: boolean }) => {
    if (!user) return;
    const silent = opts?.silent === true;
    if (!silent) setLoading(true);
    try {
      const vocab = await getUserVocabulary(user.uid, language);
      setItems(vocab);
    } catch (err) {
      console.error('[VocabularyPage] loadVocabulary failed:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user, language]);

  const refreshVocabulary = useCallback(
    () => loadVocabulary({ silent: true }),
    [loadVocabulary],
  );

  const handleImageLoaded = useCallback((word: string, imageUrl: string) => {
    setItems((prev) => prev.map((item) => (wordsMatchCanonically(item.word, word) ? { ...item, imageUrl } : item)));
    if (user) {
      updateVocabImage(user.uid, word, language, imageUrl).catch(console.error);
    }
  }, [user, language]);

  const { enrichingWords, handleEnrichItem } = useVocabEnrich(user, items, language, setItems);

  const {
    isReviewActive,
    closeAllReview,
    rawDueToday,
    sessionPreview,
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
    visualImagePool,
    reshuffleSession,
    startReview,
    beginFlashcardSession,
    handleFlashcardAnswer,
    finishFlashcardReview,
    beginVisualSession,
    skipVisualItem,
    handleVisualAnswer,
    handleVisualContinue,
    finishVisualReview,
    handleContextAnswer,
    handleContextContinue,
    finishContextReview,
  } = useVocabReview(user, profile, items, language, refreshVocabulary);

  useEffect(() => {
    void loadVocabulary();
  }, [loadVocabulary]);

  const reviewedTodayCount = items.filter((item) => isReviewedToday(item)).length;

  useEffect(() => {
    if (!loading && !tabInitialized) {
      setActiveTab(rawDueToday.length > 0 ? 'review' : 'library');
      setTabInitialized(true);
    }
  }, [loading, tabInitialized, rawDueToday.length]);

  useEffect(() => {
    if (!loading && initialDueCount === null) {
      setInitialDueCount(rawDueToday.length);
    }
  }, [loading, initialDueCount, rawDueToday.length]);

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
  const noMatches = filteredItems.length === 0;
  const hasMoreDue = rawDueToday.length > sessionItems.length;
  const dueBaseline = initialDueCount ?? rawDueToday.length;

  return (
    <>
      <div className="min-h-dvh pb-24 md:pb-10 animate-fade-in" style={{ backgroundColor: 'var(--color-bg)' }}>
        <VocabularyHeader language={language} langLabel={lang.label} />

        <main className="mx-auto max-w-lg md:max-w-2xl lg:max-w-4xl px-5 pt-5 flex flex-col gap-5">
          <VocabularyTabNav
            activeTab={activeTab}
            dueCount={rawDueToday.length}
            totalCount={items.length}
            onTabChange={setActiveTab}
          />

          {activeTab === 'review' && (
            <div className="flex flex-col gap-5">
              {rawDueToday.length > 0 ? (
                <VocabularyReviewHub
                  dueCount={rawDueToday.length}
                  reviewedTodayCount={reviewedTodayCount}
                  sessionPreview={sessionPreview}
                  contextLoading={contextLoading}
                  onStartReview={startReview}
                  onReshuffle={reshuffleSession}
                />
              ) : (
                <VocabularyReviewComplete onBrowseLibrary={() => setActiveTab('library')} />
              )}
            </div>
          )}

          {activeTab === 'library' && (
            <div className="flex flex-col gap-5 animate-slide-up-spring">
              {noMatches ? (
                <VocabularyNoResults
                  searchQuery={searchQuery}
                  onClear={() => {
                    setSearchQuery('');
                    setSrsFilter('all');
                  }}
                />
              ) : (
                <VocabularyLibrarySection
                  items={filteredItems}
                  language={language}
                  searchQuery={searchQuery}
                  srsFilter={srsFilter}
                  layoutMode={layoutMode}
                  newCount={counts.newCount}
                  learningCount={counts.learningCount}
                  masteredCount={counts.masteredCount}
                  totalCount={counts.totalCount}
                  enrichingWords={enrichingWords}
                  onSearchChange={setSearchQuery}
                  onSrsFilterChange={setSrsFilter}
                  onLayoutChange={setLayoutMode}
                  onEnrich={handleEnrichItem}
                  onImageLoaded={handleImageLoaded}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {contextLoading && (
        <ContextReviewLoading
          wordCount={sessionPreview.length}
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
          hasMoreDue={hasMoreDue}
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
          imagePool={visualImagePool}
          currentIdx={cardIdx}
          answered={answered}
          lastCorrect={lastCorrect}
          results={results}
          language={language}
          savingResults={savingResults}
          hasMoreDue={hasMoreDue}
          onStart={beginVisualSession}
          onAnswer={handleVisualAnswer}
          onContinue={handleVisualContinue}
          onSkipUnavailable={skipVisualItem}
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
          hasMoreDue={hasMoreDue}
          onAnswer={handleContextAnswer}
          onContinue={handleContextContinue}
          onFinish={finishContextReview}
          onClose={closeAllReview}
        />
      )}
    </>
  );
}
