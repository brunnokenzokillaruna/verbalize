import { LanguageFlag } from '@/components/LanguageFlag';
import { MistakeContextBody } from './MistakeContextBody';
import { MISTAKE_THEME } from './mistakeTheme';
import type { LessonMistakeDocument } from '@/types';

type MistakeContextCardProps = {
  mistake: LessonMistakeDocument;
  compact?: boolean;
};

export function MistakeContextCard({ mistake, compact = false }: MistakeContextCardProps) {
  return (
    <div
      className={`rounded-2xl border-2 overflow-hidden ${compact ? '' : ''}`}
      style={{
        borderColor: MISTAKE_THEME.accent,
        backgroundColor: 'var(--color-surface)',
      }}
    >
      <div
        className="px-4 py-2.5 flex items-center justify-between gap-2"
        style={{ backgroundColor: MISTAKE_THEME.accentLight }}
      >
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-error">
          O que aconteceu
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <LanguageFlag language={mistake.language} size="sm" />
          <span className="text-[10px] font-bold text-text-muted">Nível {mistake.level}</span>
        </div>
      </div>

      <div className={compact ? 'p-4' : 'p-5'}>
        <p className={`font-display font-bold text-text-primary ${compact ? 'text-base' : 'text-lg'}`}>
          {mistake.grammarFocus}
        </p>
        <div className="mt-3">
          <MistakeContextBody mistakeContext={mistake.mistakeContext} compact={compact} />
        </div>
      </div>
    </div>
  );
}
