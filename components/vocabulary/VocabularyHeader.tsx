import { LanguageFlag } from '@/components/LanguageFlag';
import type { SupportedLanguage } from '@/types';

type VocabularyHeaderProps = {
  language: SupportedLanguage;
  langLabel: string;
};

export function VocabularyHeader({ language, langLabel }: VocabularyHeaderProps) {
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
        <div className="flex items-center gap-2 mb-0.5">
          <LanguageFlag language={language} size="lg" />
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {langLabel}
          </span>
        </div>
        <h1
          className="font-display text-2xl font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Meu Vocabulário
        </h1>
      </div>
    </header>
  );
}
