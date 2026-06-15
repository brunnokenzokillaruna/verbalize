import { ChevronDown, ChevronUp } from 'lucide-react';
import { AudioPlayerButton } from '@/components/lesson/AudioPlayerButton';
import { TENSE_ORDER, TENSE_LABELS, TENSE_ACCENT } from '@/app/(app)/verbs/data';
import type { VerbDocument, SupportedLanguage } from '@/types';
import { extractVerbOnlyForm, getConjugationAudioText } from '@/utils/conjugationHelper';

interface VerbTenseListProps {
  verb: VerbDocument;
  openTenses: Set<string>;
  toggleTense: (tense: string) => void;
  language: SupportedLanguage;
}

export function VerbTenseList({
  verb,
  openTenses,
  toggleTense,
  language,
}: VerbTenseListProps) {
  const availableTenses = TENSE_ORDER.filter(
    (t) => verb.conjugations?.[t as keyof typeof verb.conjugations],
  );

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-widest text-text-muted">
          Conjugações
        </p>
        <p className="text-[10px] font-semibold text-text-muted">
          {availableTenses.length} tempo{availableTenses.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div
        className="rounded-2xl border border-border overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        {availableTenses.map((tense, tenseIndex) => {
          const forms = verb.conjugations[tense as keyof typeof verb.conjugations];
          const isOpen = openTenses.has(tense);
          const accent = TENSE_ACCENT[tense] ?? 'var(--color-primary)';
          const formCount = forms ? Object.keys(forms).length : 0;

          return (
            <div
              key={tense}
              style={{
                borderTop: tenseIndex > 0 ? '1px solid var(--color-border)' : undefined,
              }}
            >
              <button
                type="button"
                onClick={() => toggleTense(tense)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 px-4 py-3.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary active:bg-surface-raised cursor-pointer"
                style={{
                  backgroundColor: isOpen ? `${accent}08` : undefined,
                }}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: accent }}
                />
                <span
                  className="flex-1 text-left text-sm font-bold text-text-primary"
                >
                  {TENSE_LABELS[tense] ?? tense}
                </span>
                <span className="text-[10px] font-semibold text-text-muted tabular-nums">
                  {formCount}
                </span>
                {isOpen ? (
                  <ChevronUp size={16} className="text-text-muted shrink-0" />
                ) : (
                  <ChevronDown size={16} className="text-text-muted shrink-0" />
                )}
              </button>

              {isOpen && forms && (
                <div
                  className="animate-slide-up border-t border-border"
                  style={{
                    borderLeft: `3px solid ${accent}`,
                    backgroundColor: 'var(--color-bg)',
                  }}
                >
                  {Object.entries(forms).map(([pronoun, form], i) => (
                    <div
                      key={pronoun}
                      className="grid grid-cols-[3.25rem_1fr_auto] items-center gap-x-3 px-4 py-3"
                      style={{
                        borderTop: i > 0 ? '1px solid var(--color-border)' : undefined,
                      }}
                    >
                      <span className="text-xs font-bold text-text-muted text-right pr-1">
                        {pronoun}
                      </span>
                      <span className="font-display text-[15px] font-bold text-text-primary leading-snug">
                        {extractVerbOnlyForm(pronoun, form, language)}
                      </span>
                      <AudioPlayerButton
                        text={getConjugationAudioText(pronoun, form, language)}
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
    </section>
  );
}
