import { ChevronDown, ChevronUp } from 'lucide-react';
import { AudioPlayerButton } from '@/components/lesson/AudioPlayerButton';
import { TENSE_ORDER, TENSE_LABELS, TENSE_ACCENT } from './data';
import type { VerbDocument, SupportedLanguage } from '@/types';

interface TenseListProps {
  verb: VerbDocument;
  openTenses: Set<string>;
  toggleTense: (tense: string) => void;
  language: SupportedLanguage;
}

export function VerbTenseList({ verb, openTenses, toggleTense, language }: TenseListProps) {
  return (
    <div className="flex flex-col gap-3">
      <p
        className="text-xs font-bold uppercase tracking-widest"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Conjugações
      </p>
      {TENSE_ORDER.filter((t) => verb.conjugations?.[t as keyof typeof verb.conjugations])
        .map((tense) => {
          const forms = verb.conjugations[tense as keyof typeof verb.conjugations];
          const isOpen = openTenses.has(tense);
          const accent = TENSE_ACCENT[tense] ?? 'var(--color-primary)';

          return (
            <div
              key={tense}
              className="overflow-hidden rounded-2xl transition-shadow duration-200"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1.5px solid',
                borderColor: isOpen ? `${accent}40` : 'var(--color-border)',
                boxShadow: isOpen ? `0 4px 16px ${accent}18` : 'none',
              }}
            >
              {/* Tense toggle button */}
              <button
                type="button"
                onClick={() => toggleTense(tense)}
                className="flex w-full items-center gap-3 px-4 py-3.5 transition-opacity hover:opacity-80"
              >
                {/* Colored accent dot */}
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full transition-transform duration-200"
                  style={{
                    backgroundColor: accent,
                    transform: isOpen ? 'scale(1.2)' : 'scale(1)',
                  }}
                />
                <span
                  className="flex-1 text-left text-sm font-bold"
                  style={{ color: isOpen ? accent : 'var(--color-text-primary)' }}
                >
                  {TENSE_LABELS[tense] ?? tense}
                </span>
                {isOpen ? (
                  <ChevronUp size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                ) : (
                  <ChevronDown size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                )}
              </button>

              {/* Conjugation rows */}
              {isOpen && forms && (
                <div
                  className="animate-slide-up"
                  style={{ borderTop: '1px solid var(--color-border)' }}
                >
                  {Object.entries(forms).map(([pronoun, form], i) => (
                    <div
                      key={pronoun}
                      className="flex items-center gap-3 px-4 py-2.5"
                      style={{
                        borderTop: i > 0 ? '1px solid var(--color-border)' : 'none',
                      }}
                    >
                      <span
                        className="w-20 shrink-0 text-xs font-semibold"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        {pronoun}
                      </span>
                      <span
                        className="flex-1 font-display text-base font-semibold"
                        style={{ color: accent }}
                      >
                        {form}
                      </span>
                      <AudioPlayerButton
                        text={`${pronoun} ${form}`}
                        language={language}
                        size="sm"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
