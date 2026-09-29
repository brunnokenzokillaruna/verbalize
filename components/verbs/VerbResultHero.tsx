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
    <div
      className="rounded-2xl border overflow-hidden animate-slide-up-spring"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'rgba(124, 58, 237, 0.25)',
        boxShadow: '0 4px 0 var(--color-verb-bg)',
      }}
    >
      <div
        className="h-1 w-full"
        style={{
          background: 'linear-gradient(90deg, var(--color-verb) 0%, rgba(124, 58, 237, 0.35) 100%)',
        }}
      />

      <div className="p-5 flex flex-col gap-4">
        <button
          type="button"
          onClick={onClear}
          aria-label="Voltar à biblioteca"
          className="duo-level-chip self-start flex items-center gap-1 rounded-full border border-primary/25 bg-primary-light px-3 py-1.5 text-xs font-bold whitespace-nowrap text-primary dark:text-text-primary cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft size={13} strokeWidth={2.25} aria-hidden />
          Voltar
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <LanguageFlag language={language} size="sm" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">
                {langLabel} · Infinitivo
              </span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold leading-tight text-text-primary tracking-tight">
              {infinitive}
            </h2>
            <p className="mt-1.5 text-base text-text-secondary italic">{translation}</p>
          </div>

          <div className="shrink-0 flex flex-col items-center gap-1.5 pt-1">
            <AudioPlayerButton text={infinitive} language={language} size="md" />
            <span className="text-[10px] font-semibold text-text-muted">
              Ouvir
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
