import { AudioPlayerButton } from '@/components/lesson/AudioPlayerButton';
import { SrsBar, SRS_BAR_COLOR, SRS_LABELS, formatNextReview } from '@/components/vocabulary/SrsBar';
import { VocabEnrichButton } from '@/components/vocabulary/VocabEnrichButton';
import { isMissingImage, isMissingTranslation } from '@/utils/vocabHelpers';
import type { UserVocabularyDocument, SupportedLanguage } from '@/types';

type VocabListRowProps = {
  item: UserVocabularyDocument;
  language: SupportedLanguage;
  urgent?: boolean;
  onEnrich?: (word: string) => void;
  enriching?: boolean;
};

export function VocabListRow({
  item,
  language,
  urgent = false,
  onEnrich,
  enriching = false,
}: VocabListRowProps) {
  const level = Math.min(Math.max(item.srsLevel ?? 0, 0), 5);
  const missingTranslation = isMissingTranslation(item);
  const missingImage = isMissingImage(item);
  const showEnrich = (missingTranslation || missingImage) && onEnrich;
  const reviewText = formatNextReview(item.nextReview as Parameters<typeof formatNextReview>[0]);
  const barColor = SRS_BAR_COLOR[level];

  return (
    <div
      className="flex items-center justify-between p-3.5 px-4 rounded-xl border transition-all duration-150 gap-4"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: urgent ? 'var(--color-error)' : 'var(--color-border)',
        boxShadow: urgent ? '0 0 0 2px var(--color-error-bg)' : undefined,
      }}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <AudioPlayerButton text={item.word} language={language} size="sm" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-display text-base font-bold text-text-primary tracking-tight truncate">
              {item.word}
            </span>
            {urgent && (
              <span className="flex h-1.5 w-1.5 rounded-full bg-error shrink-0 animate-pulse" />
            )}
          </div>
          <p
            className="text-xs truncate mt-0.5"
            style={{
              color: missingTranslation ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
              fontStyle: missingTranslation ? 'italic' : 'normal',
            }}
          >
            {missingTranslation ? '—' : item.translation}
          </p>
        </div>
      </div>

      <div className="hidden sm:flex flex-col gap-1 w-32 shrink-0">
        <div className="flex items-center justify-between text-[10px] font-bold">
          <span style={{ color: barColor }}>{SRS_LABELS[level]}</span>
          <span className="text-text-muted">Nível {level}/5</span>
        </div>
        <SrsBar level={level} />
      </div>

      <span
        className="sm:hidden text-[10px] font-bold rounded-full px-2 py-0.5"
        style={{ backgroundColor: `${barColor}15`, color: barColor }}
      >
        {SRS_LABELS[level]}
      </span>

      <div className="flex items-center gap-2 shrink-0">
        {showEnrich && (
          <VocabEnrichButton
            onClick={() => onEnrich!(item.word)}
            loading={enriching}
            missingTranslation={missingTranslation}
            missingImage={missingImage}
            variant="inline"
          />
        )}
        <div className="text-right min-w-[72px]">
          {reviewText ? (
            <p
              className="text-[11px] font-bold"
              style={{ color: urgent ? 'var(--color-error)' : 'var(--color-text-muted)' }}
            >
              {reviewText}
            </p>
          ) : (
            <p className="text-[11px] font-semibold text-text-muted">Pronto</p>
          )}
        </div>
      </div>
    </div>
  );
}
