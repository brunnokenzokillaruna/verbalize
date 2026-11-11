'use client';

import { ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import { AudioPlayerButton } from '@/components/lesson/AudioPlayerButton';
import { TENSE_ORDER, TENSE_LABELS, TENSE_ACCENT } from '@/app/(app)/verbs/data';
import { getTenseUsage } from '@/lib/verbs/tenseUsage';
import type { VerbDocument, SupportedLanguage, VerbTenseGuide } from '@/types';
import type { VerbTenseKey } from '@/lib/verbs/tenseKeys';
import { extractVerbOnlyForm, getConjugationAudioText } from '@/utils/conjugationHelper';

interface VerbTenseListProps {
  verb: VerbDocument;
  selectedTense: string;
  onSelectTense: (tense: string) => void;
  language: SupportedLanguage;
}

function resolveGuide(
  verb: VerbDocument,
  tense: VerbTenseKey,
  language: SupportedLanguage,
): VerbTenseGuide | null {
  const stored = verb.tenseGuides?.[tense];
  const whenToUse = stored?.whenToUse?.trim() || getTenseUsage(tense, language);
  const example = stored?.example;
  if (example?.target?.trim() && example?.portuguese?.trim()) {
    return { whenToUse, example };
  }
  return { whenToUse, example: { target: '', portuguese: '' } };
}

export function VerbTenseList({
  verb,
  selectedTense,
  onSelectTense,
  language,
}: VerbTenseListProps) {
  const availableTenses = TENSE_ORDER.filter(
    (t) => verb.conjugations?.[t as keyof typeof verb.conjugations],
  );

  if (availableTenses.length === 0) return null;

  const activeTense = availableTenses.includes(selectedTense)
    ? selectedTense
    : availableTenses[0];
  const activeIndex = availableTenses.indexOf(activeTense);
  const accent = TENSE_ACCENT[activeTense] ?? 'var(--color-primary)';
  const forms = verb.conjugations[activeTense as keyof typeof verb.conjugations];
  const guide = resolveGuide(verb, activeTense as VerbTenseKey, language);

  function go(delta: number) {
    const next = availableTenses[activeIndex + delta];
    if (next) onSelectTense(next);
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-widest text-text-muted">
          Conjugações
        </p>
        <p className="text-[10px] font-semibold text-text-muted tabular-nums">
          {activeIndex + 1} / {availableTenses.length}
        </p>
      </div>

      {/* Tense picker — one row of chips, scroll on mobile */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide">
        {availableTenses.map((tense) => {
          const isActive = tense === activeTense;
          const chipAccent = TENSE_ACCENT[tense] ?? 'var(--color-primary)';
          return (
            <button
              key={tense}
              type="button"
              onClick={() => onSelectTense(tense)}
              aria-pressed={isActive}
              className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
              style={
                isActive
                  ? {
                      backgroundColor: `${chipAccent}18`,
                      borderColor: chipAccent,
                      color: 'var(--color-text-primary)',
                    }
                  : {
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-muted)',
                    }
              }
            >
              {TENSE_LABELS[tense] ?? tense}
            </button>
          );
        })}
      </div>

      <div
        className="rounded-2xl border border-border overflow-hidden animate-slide-up"
        key={activeTense}
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        {/* Header + nav */}
        <div
          className="flex items-center gap-2 px-3 py-3 border-b border-border"
          style={{ backgroundColor: `${accent}0c` }}
        >
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={activeIndex <= 0}
            aria-label="Tempo anterior"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-text-muted disabled:opacity-30 cursor-pointer disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex-1 min-w-0 text-center">
            <div className="flex items-center justify-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: accent }}
              />
              <h3 className="font-display text-lg font-bold text-text-primary truncate">
                {TENSE_LABELS[activeTense] ?? activeTense}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => go(1)}
            disabled={activeIndex >= availableTenses.length - 1}
            aria-label="Próximo tempo"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-text-muted disabled:opacity-30 cursor-pointer disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* When to use */}
        {guide?.whenToUse && (
          <div
            className="flex gap-3 px-4 py-3.5 border-b border-border"
            style={{ borderLeft: `3px solid ${accent}` }}
          >
            <Lightbulb
              size={16}
              className="shrink-0 mt-0.5"
              style={{ color: accent }}
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">
                Quando usar
              </p>
              <p className="text-sm leading-relaxed text-text-secondary">
                {guide.whenToUse}
              </p>
            </div>
          </div>
        )}

        {/* Forms */}
        {forms && (
          <div style={{ backgroundColor: 'var(--color-bg)' }}>
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

        {/* Example for this tense */}
        {guide?.example?.target ? (
          <div
            className="border-t border-border px-4 py-4"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">
              Exemplo
            </p>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold leading-snug text-text-primary">
                  {guide.example.target}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary border-t border-border pt-2">
                  {guide.example.portuguese}
                </p>
              </div>
              <div className="shrink-0 pt-0.5">
                <AudioPlayerButton
                  text={guide.example.target}
                  language={language}
                  size="sm"
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
