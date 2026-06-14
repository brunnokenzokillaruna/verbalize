import Image from 'next/image';
import { BookOpen, Clock } from 'lucide-react';
import { AudioPlayerButton } from '@/components/lesson/AudioPlayerButton';
import { SrsBar, SRS_LABELS } from '@/components/vocabulary/SrsBar';
import { VocabEnrichButton } from '@/components/vocabulary/VocabEnrichButton';
import { isMissingImage, isMissingTranslation } from '@/utils/vocabHelpers';
import type { UserVocabularyDocument, SupportedLanguage } from '@/types';

type VocabularyFocusCardProps = {
  item: UserVocabularyDocument;
  language: SupportedLanguage;
  enriching: boolean;
  onEnrich: (word: string) => void;
};

export function VocabularyFocusCard({
  item,
  language,
  enriching,
  onEnrich,
}: VocabularyFocusCardProps) {
  const level = Math.min(item.srsLevel ?? 0, 5);
  const missingTranslation = isMissingTranslation(item);
  const missingImage = isMissingImage(item);

  return (
    <div
      className="col-span-2 md:col-span-3 lg:col-span-4 rounded-2xl overflow-hidden border-2 border-primary-light p-6 flex flex-col md:flex-row items-center gap-6 animate-slide-up-spring relative"
      style={{
        background: 'linear-gradient(to right, var(--color-surface), var(--color-surface-raised))',
        boxShadow: '0 8px 24px rgba(29, 94, 212, 0.05)',
      }}
    >
      <div className="absolute top-0 right-0 h-32 w-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div
        className="relative w-full md:w-48 shrink-0 overflow-hidden rounded-xl border border-border shadow-sm"
        style={{ aspectRatio: '4/3', backgroundColor: 'var(--color-surface-raised)' }}
      >
        {item.imageUrl ? (
          <>
            <Image
              src={item.imageUrl}
              alt={item.word}
              fill
              className="object-cover transition-transform duration-300 hover:scale-105"
              sizes="(max-width: 768px) 100vw, 200px"
            />
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)',
              }}
            />
          </>
        ) : (
          <div
            className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 select-none"
            style={{
              background: `linear-gradient(90deg, transparent 31px, rgba(220, 38, 38, 0.15) 31px, rgba(220, 38, 38, 0.15) 32px, transparent 32px), 
                               repeating-linear-gradient(var(--color-surface) 0px, var(--color-surface) 23px, var(--color-border) 23px, var(--color-border) 24px)`,
              backgroundSize: '100% 100%, 100% 24px',
            }}
          >
            <span className="text-primary animate-float">
              <BookOpen size={36} style={{ color: 'var(--color-vocab)' }} />
            </span>
            {missingImage && (
              <VocabEnrichButton
                onClick={() => onEnrich(item.word)}
                loading={enriching}
                missingTranslation={missingTranslation}
                missingImage={missingImage}
              />
            )}
          </div>
        )}

        <span className="absolute top-3 left-3 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full rounded-full bg-error opacity-75 animate-ping" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-error" />
        </span>

        <span
          className="absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow-sm"
          style={{
            backgroundColor: item.imageUrl ? 'rgba(0,0,0,0.6)' : 'var(--color-surface)',
            color: item.imageUrl ? '#fff' : 'var(--color-text-primary)',
            backdropFilter: item.imageUrl ? 'blur(4px)' : undefined,
          }}
        >
          {SRS_LABELS[level]}
        </span>
      </div>

      <div className="flex-1 w-full flex flex-col md:items-start text-center md:text-left gap-3">
        <div>
          <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-text-primary">
              {item.word}
            </h2>
            <AudioPlayerButton text={item.word} language={language} size="md" />
          </div>
          <div className="flex items-center justify-center md:justify-start gap-2 mt-1 flex-wrap">
            <p
              className="text-lg font-semibold"
              style={{
                color: missingTranslation ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
                fontStyle: missingTranslation ? 'italic' : 'normal',
              }}
            >
              {missingTranslation ? '—' : item.translation}
            </p>
            {(missingTranslation || missingImage) && (
              <VocabEnrichButton
                onClick={() => onEnrich(item.word)}
                loading={enriching}
                missingTranslation={missingTranslation}
                missingImage={missingImage}
                variant="inline"
              />
            )}
          </div>
        </div>

        <div className="w-full max-w-sm mt-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-text-muted mb-1.5">
            <span>Progresso de Memorização</span>
            <span>Estágio {level} de 5</span>
          </div>
          <SrsBar level={level} />
        </div>

        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-1.5 text-xs text-text-muted font-medium">
          <span className="flex items-center gap-1 font-bold text-error">
            <Clock size={12} />
            Revisão Pendente
          </span>
          <span>•</span>
          <span>Estágio: {SRS_LABELS[level]}</span>
        </div>
      </div>
    </div>
  );
}
