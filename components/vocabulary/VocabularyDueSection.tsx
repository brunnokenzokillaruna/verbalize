'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { VocabCard } from '@/components/vocabulary/VocabCard';
import { VocabListRow } from '@/components/vocabulary/VocabListRow';
import { VocabularyFocusCard } from '@/components/vocabulary/VocabularyFocusCard';
import type { UserVocabularyDocument, SupportedLanguage } from '@/types';

const PREVIEW_COUNT = 3;

type VocabularyDueSectionProps = {
  dueToday: UserVocabularyDocument[];
  layoutMode: 'grid' | 'list';
  language: SupportedLanguage;
  enrichingWords: Set<string>;
  onEnrich: (word: string) => void;
  onImageLoaded: (word: string, imageUrl: string) => void;
};

export function VocabularyDueSection({
  dueToday,
  layoutMode,
  language,
  enrichingWords,
  onEnrich,
  onImageLoaded,
}: VocabularyDueSectionProps) {
  const [expanded, setExpanded] = useState(false);

  if (dueToday.length === 0) return null;

  const focusWord = dueToday[0];
  const remainingDueToday = dueToday.slice(1);
  const hasMore = remainingDueToday.length > PREVIEW_COUNT;
  const visibleRemaining = expanded
    ? remainingDueToday
    : remainingDueToday.slice(0, PREVIEW_COUNT);
  const hiddenCount = remainingDueToday.length - PREVIEW_COUNT;

  return (
    <section className="flex flex-col gap-4 animate-slide-up-spring">
      <div className="flex items-center gap-2">
        <span
          className="flex h-2.5 w-2.5 rounded-full animate-pulse"
          style={{ backgroundColor: 'var(--color-error)' }}
        />
        <p
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: 'var(--color-error)' }}
        >
          Para revisar hoje
        </p>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-extrabold"
          style={{
            backgroundColor: 'var(--color-error-bg)',
            color: 'var(--color-error)',
          }}
        >
          {dueToday.length}
        </span>
      </div>

      {layoutMode === 'grid' ? (
        <div className="flex flex-col gap-4">
          {focusWord && (
            <VocabularyFocusCard
              item={focusWord}
              language={language}
              enriching={enrichingWords.has(focusWord.word)}
              onEnrich={onEnrich}
            />
          )}

          {visibleRemaining.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {visibleRemaining.map((item, idx) => (
                <VocabCard
                  key={item.word}
                  item={item}
                  language={language}
                  urgent
                  animDelay={(idx + 1) * 45}
                  onImageLoaded={onImageLoaded}
                  onEnrich={onEnrich}
                  enriching={enrichingWords.has(item.word)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {dueToday.map((item) => (
            <VocabListRow
              key={item.word}
              item={item}
              language={language}
              urgent
              onEnrich={onEnrich}
              enriching={enrichingWords.has(item.word)}
            />
          ))}
        </div>
      )}

      {layoutMode === 'grid' && hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] cursor-pointer border border-border text-text-secondary hover:text-text-primary hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          style={{ backgroundColor: 'var(--color-surface)' }}
        >
          {expanded ? (
            <>
              <ChevronUp size={16} />
              Mostrar menos
            </>
          ) : (
            <>
              <ChevronDown size={16} />
              Ver mais {hiddenCount} palavra{hiddenCount !== 1 ? 's' : ''}
            </>
          )}
        </button>
      )}
    </section>
  );
}
