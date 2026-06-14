import { BookOpen, Clock, Trophy } from 'lucide-react';
import { StatChip } from '@/components/vocabulary/StatChip';

type VocabularyHeaderProps = {
  langFlag: string;
  langLabel: string;
  totalWords: number;
  dueCount: number;
  masteredCount: number;
};

export function VocabularyHeader({
  langFlag,
  langLabel,
  totalWords,
  dueCount,
  masteredCount,
}: VocabularyHeaderProps) {
  return (
    <header
      className="sticky top-0 z-10 px-5 pt-6 pb-4"
      style={{
        backgroundColor: 'var(--color-bg)',
        borderBottom: '1px solid var(--color-border)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className="mx-auto max-w-lg md:max-w-2xl lg:max-w-4xl">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-lg">{langFlag}</span>
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {langLabel}
              </span>
            </div>
            <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Meu Vocabulário
            </h1>
          </div>
        </div>

        <div className="flex gap-3 mt-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <StatChip
            icon={<BookOpen size={13} />}
            label={`${totalWords} palavra${totalWords !== 1 ? 's' : ''}`}
            color="var(--color-primary)"
            bg="var(--color-primary-light)"
          />
          {dueCount > 0 && (
            <StatChip
              icon={<Clock size={13} />}
              label={`${dueCount} para revisar`}
              color="var(--color-error)"
              bg="var(--color-error-bg)"
            />
          )}
          {masteredCount > 0 && (
            <StatChip
              icon={<Trophy size={13} />}
              label={`${masteredCount} dominada${masteredCount !== 1 ? 's' : ''}`}
              color="var(--color-success)"
              bg="var(--color-success-bg)"
            />
          )}
        </div>
      </div>
    </header>
  );
}
