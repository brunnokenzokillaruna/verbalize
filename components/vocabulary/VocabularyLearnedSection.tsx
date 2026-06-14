import { Sparkles } from 'lucide-react';
import { VocabCard } from '@/components/vocabulary/VocabCard';
import { VocabListRow } from '@/components/vocabulary/VocabListRow';
import type { UserVocabularyDocument, SupportedLanguage } from '@/types';

type VocabularyLearnedSectionProps = {
  learned: UserVocabularyDocument[];
  layoutMode: 'grid' | 'list';
  language: SupportedLanguage;
  enrichingWords: Set<string>;
  onEnrich: (word: string) => void;
  onImageLoaded: (word: string, imageUrl: string) => void;
};

export function VocabularyLearnedSection({
  learned,
  layoutMode,
  language,
  enrichingWords,
  onEnrich,
  onImageLoaded,
}: VocabularyLearnedSectionProps) {
  if (learned.length === 0) return null;

  return (
    <section className="animate-slide-up-spring delay-75">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={13} style={{ color: 'var(--color-text-muted)' }} />
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
          Aprendido — {learned.length}
        </p>
      </div>

      {layoutMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {learned.map((item, idx) => (
            <VocabCard
              key={item.word}
              item={item}
              language={language}
              animDelay={idx * 35}
              onImageLoaded={onImageLoaded}
              onEnrich={onEnrich}
              enriching={enrichingWords.has(item.word)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {learned.map((item) => (
            <VocabListRow
              key={item.word}
              item={item}
              language={language}
              onEnrich={onEnrich}
              enriching={enrichingWords.has(item.word)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
