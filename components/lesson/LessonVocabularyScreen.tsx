import React from 'react';
import { Loader2 } from 'lucide-react';
import { VisualVocabCard } from './VisualVocabCard';

import type { SupportedLanguage } from '@/types';

interface LessonVocabularyScreenProps {
  isLoading: boolean;
  newVocabulary: string[];
  vocabImages: Record<string, { imageUrl?: string; imageAlt?: string } | null>;
  vocabTranslations: Record<string, string>;
  language: SupportedLanguage;
}

export function LessonVocabularyScreen({
  isLoading,
  newVocabulary,
  vocabImages,
  vocabTranslations,
  language,
}: LessonVocabularyScreenProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Header section with refined typography and icon */}
      <div className="flex flex-col gap-1.5 animate-slide-up">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-base shadow-inner ring-1 ring-white/10 backdrop-blur-md dark:bg-white/5">
            📖
          </div>
          <div className="flex flex-col">
            <h2 className="font-display text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Vocabulário Novo
            </h2>
            <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-[0.2em]">
              Essenciais para esta lição
            </p>
          </div>
        </div>
      </div>

      {isLoading && newVocabulary.length === 0 && (
        <div
          className="flex items-center gap-3 rounded-2xl px-5 py-4 shadow-sm ring-1 ring-[var(--color-border)] animate-pulse"
          style={{ backgroundColor: 'var(--color-surface)' }}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary-light)]">
            <Loader2 size={16} className="animate-spin text-[var(--color-primary)]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-[var(--color-text-primary)]">Manifestando imagens…</span>
          </div>
        </div>
      )}

      {/* Vocabulary Card Grid - Balanced 2-column Grid */}
      <div className="grid grid-cols-2 gap-4 pb-4">
        {[...new Set(newVocabulary)].map((word, idx) => {
          const img = vocabImages[word];
          const translation = vocabTranslations[word] ?? word;
          return (
            <div
              key={word}
              className="animate-slide-up-spring"
              style={{ 
                animationDelay: `${idx * 100}ms`, 
                animationFillMode: 'both' 
              }}
            >
              <VisualVocabCard
                word={word}
                translation={translation}
                language={language}
                imageUrl={img?.imageUrl}
                imageAlt={img?.imageAlt}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
