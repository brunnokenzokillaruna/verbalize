import { ArrowLeft } from 'lucide-react';
import { LanguageFlag } from '@/components/LanguageFlag';
import { AudioPlayerButton } from '@/components/lesson/AudioPlayerButton';
import type { SupportedLanguage } from '@/types';

type VerbResultHeroProps = {
  infinitive: string;
  translation: string;
  language: SupportedLanguage;
  langLabel: string;
  onClear: () => void;
};

export function VerbResultHero({
  infinitive,
  translation,
  language,
  langLabel,
  onClear,
}: VerbResultHeroProps) {
  return (
    <header className="flex flex-col gap-4 animate-slide-up-spring">
      <button
        type="button"
        onClick={onClear}
        aria-label="Voltar à biblioteca"
        className="duo-level-chip self-start inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-text-secondary cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <ArrowLeft size={14} strokeWidth={2.25} aria-hidden />
        Biblioteca
      </button>

      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <LanguageFlag language={language} size="sm" />
            <span className="text-xs font-semibold text-text-muted">
              {langLabel}
            </span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold leading-[1.05] tracking-tight text-text-primary">
            {infinitive}
          </h2>
          <p className="mt-2 text-base text-text-secondary">{translation}</p>
        </div>

        <AudioPlayerButton text={infinitive} language={language} size="md" />
      </div>
    </header>
  );
}
