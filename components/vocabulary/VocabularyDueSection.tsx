import { VocabCard } from '@/components/vocabulary/VocabCard';
import { VocabListRow } from '@/components/vocabulary/VocabListRow';
import { VocabularyFocusCard } from '@/components/vocabulary/VocabularyFocusCard';
import type { UserVocabularyDocument, SupportedLanguage } from '@/types';

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
  if (dueToday.length === 0) return null;

  const focusWord = dueToday[0];
  const remainingDueToday = dueToday.slice(1);

  return (
    <section className="animate-slide-up-spring">
      <div className="flex items-center gap-2 mb-4">
        <span
          className="flex h-2.5 w-2.5 rounded-full animate-pulse"
          style={{ backgroundColor: 'var(--color-error)' }}
        />
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-error)' }}>
          Para revisar hoje — {dueToday.length}
        </p>
      </div>

      {layoutMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {focusWord && (
            <VocabularyFocusCard
              item={focusWord}
              language={language}
              enriching={enrichingWords.has(focusWord.word)}
              onEnrich={onEnrich}
            />
          )}
          {remainingDueToday.map((item, idx) => (
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
      ) : (
        <div className="flex flex-col gap-3">
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
    </section>
  );
}
