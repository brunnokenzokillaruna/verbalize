import { Sparkles } from 'lucide-react';
import { AudioPlayerButton } from '@/components/lesson/AudioPlayerButton';
import type { SupportedLanguage } from '@/types';

type Example = {
  target: string;
  portuguese: string;
};

type VerbExamplesSectionProps = {
  examples: Example[];
  language: SupportedLanguage;
};

export function VerbExamplesSection({ examples, language }: VerbExamplesSectionProps) {
  if (examples.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Sparkles size={13} className="text-verb shrink-0" />
        <p className="text-xs font-bold uppercase tracking-widest text-text-muted">
          Exemplos em contexto
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {examples.slice(0, 3).map((ex, i) => (
          <article
            key={i}
            className="rounded-xl border border-border border-l-[3px] bg-surface animate-slide-up"
            style={{
              borderLeftColor: 'var(--color-verb)',
              animationDelay: `${i * 60}ms`,
              animationFillMode: 'both',
            }}
          >
            <div className="px-4 py-4 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold leading-snug text-text-primary">
                  {ex.target}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary border-t border-border pt-2">
                  {ex.portuguese}
                </p>
              </div>
              <div className="shrink-0 pt-0.5">
                <AudioPlayerButton text={ex.target} language={language} size="sm" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
