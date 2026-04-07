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
    <div className="flex flex-col gap-5 animate-slide-up-spring">
      <div className="flex items-center gap-2">
        <span className="text-base">📖</span>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
          Vocabulário da Lição
        </p>
      </div>
      {isLoading && newVocabulary.length === 0 && (
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <Loader2 size={16} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Carregando imagens…</span>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...new Set(newVocabulary)].map((word, idx) => {
          const img = vocabImages[word];
          const translation = vocabTranslations[word] ?? word;
          return (
            <div
              key={word}
              className="animate-slide-up"
              style={{ animationDelay: `${idx * 80}ms`, animationFillMode: 'both' }}
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
