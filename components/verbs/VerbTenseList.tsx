'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AudioPlayerButton } from '@/components/lesson/AudioPlayerButton';
import { TENSE_ORDER, TENSE_LABELS } from '@/app/(app)/verbs/data';
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

const FR_SINGULAR = new Set(['je', 'tu', 'il', 'elle', 'on']);
const EN_SINGULAR = new Set(['I', 'you', 'he', 'she', 'it']);

function resolveGuide(
  verb: VerbDocument,
  tense: VerbTenseKey,
  language: SupportedLanguage,
): VerbTenseGuide {
  const stored = verb.tenseGuides?.[tense];
  return {
    whenToUse: stored?.whenToUse?.trim() || getTenseUsage(tense, language),
    example: {
      target: stored?.example?.target?.trim() ?? '',
      portuguese: stored?.example?.portuguese?.trim() ?? '',
    },
  };
}

function splitForms(
  forms: Record<string, string>,
  language: SupportedLanguage,
): { singular: [string, string][]; plural: [string, string][] } {
  const singular: [string, string][] = [];
  const plural: [string, string][] = [];
  const singularSet = language === 'fr' ? FR_SINGULAR : EN_SINGULAR;

  for (const [pronoun, form] of Object.entries(forms)) {
    const key = language === 'fr' ? pronoun.toLowerCase() : pronoun;
    if (singularSet.has(key) || (language === 'en' && pronoun === 'I')) {
      singular.push([pronoun, form]);
    } else {
      plural.push([pronoun, form]);
    }
  }

  return { singular, plural };
}

function FormRow({
  pronoun,
  form,
  language,
}: {
  pronoun: string;
  form: string;
  language: SupportedLanguage;
}) {
  return (
    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-x-3 px-1 py-2.5 sm:px-2">
      <span className="text-sm font-medium text-text-muted tabular-nums">
        {pronoun}
      </span>
      <span className="font-display text-lg font-semibold leading-snug text-text-primary">
        {extractVerbOnlyForm(pronoun, form, language)}
      </span>
      <AudioPlayerButton
        text={getConjugationAudioText(pronoun, form, language)}
        language={language}
        size="sm"
      />
    </div>
  );
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
  const forms = verb.conjugations[activeTense as keyof typeof verb.conjugations];
  const guide = resolveGuide(verb, activeTense as VerbTenseKey, language);
  const nextTense = availableTenses[activeIndex + 1];
  const prevTense = availableTenses[activeIndex - 1];
  const groups = forms ? splitForms(forms, language) : null;

  function go(delta: number) {
    const next = availableTenses[activeIndex + delta];
    if (next) onSelectTense(next);
  }

  return (
    <section className="flex flex-col gap-5" aria-label="Conjugações">
      {/* Tense navigation */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={!prevTense}
            aria-label="Tempo anterior"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary disabled:opacity-25 cursor-pointer disabled:cursor-default active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="min-w-0 flex-1 text-center">
            <p className="font-display text-2xl font-bold tracking-tight text-text-primary truncate">
              {TENSE_LABELS[activeTense] ?? activeTense}
            </p>
            <p className="mt-0.5 text-xs font-medium text-text-muted tabular-nums">
              {activeIndex + 1} de {availableTenses.length}
            </p>
          </div>

          <button
            type="button"
            onClick={() => go(1)}
            disabled={!nextTense}
            aria-label="Próximo tempo"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary disabled:opacity-25 cursor-pointer disabled:cursor-default active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Jump chips — single accent (verb), not a rainbow */}
        <div
          role="tablist"
          aria-label="Tempos verbais"
          className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 scrollbar-hide"
        >
          {availableTenses.map((tense) => {
            const isActive = tense === activeTense;
            return (
              <button
                key={tense}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelectTense(tense)}
                className={`duo-level-chip shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verb ${
                  isActive
                    ? 'border border-transparent'
                    : 'bg-surface text-text-muted border border-border hover:text-text-secondary'
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: 'var(--color-verb)',
                        color: 'var(--color-text-inverse)',
                      }
                    : undefined
                }
              >
                {TENSE_LABELS[tense] ?? tense}
              </button>
            );
          })}
        </div>
      </div>

      <div key={activeTense} className="flex flex-col gap-4 animate-slide-up">
        {(guide.example.target || guide.whenToUse) && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {guide.example.target ? (
              <article className="flex h-full flex-col rounded-2xl border border-border bg-surface px-4 py-4 sm:px-5">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">
                  Exemplo
                </p>
                <div className="flex flex-1 items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg font-semibold leading-snug text-text-primary">
                      {guide.example.target}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                      {guide.example.portuguese}
                    </p>
                  </div>
                  <AudioPlayerButton
                    text={guide.example.target}
                    language={language}
                    size="sm"
                  />
                </div>
              </article>
            ) : null}

            {guide.whenToUse ? (
              <article
                className="flex h-full flex-col rounded-2xl border border-border px-4 py-4 sm:px-5"
                style={{
                  backgroundColor:
                    'color-mix(in srgb, var(--color-verb-bg) 55%, var(--color-surface))',
                }}
              >
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-verb">
                  Quando usar
                </p>
                <p className="flex-1 text-sm leading-relaxed text-text-secondary">
                  {guide.whenToUse}
                </p>
              </article>
            ) : null}
          </div>
        )}

        {/* Forms */}
        {groups && (
          <div
            className="rounded-2xl border border-border bg-surface px-3 py-2 sm:px-4"
            role="table"
            aria-label={`Formas no ${TENSE_LABELS[activeTense] ?? activeTense}`}
          >
            {groups.singular.length > 0 && (
              <div role="rowgroup">
                <p className="px-1 pt-2 pb-1 text-xs font-bold uppercase tracking-wider text-text-muted sm:px-2">
                  Singular
                </p>
                {groups.singular.map(([pronoun, form]) => (
                  <FormRow
                    key={pronoun}
                    pronoun={pronoun}
                    form={form}
                    language={language}
                  />
                ))}
              </div>
            )}

            {groups.plural.length > 0 && (
              <div
                role="rowgroup"
                className={groups.singular.length > 0 ? 'mt-1 border-t border-border pt-1' : undefined}
              >
                <p className="px-1 pt-2 pb-1 text-xs font-bold uppercase tracking-wider text-text-muted sm:px-2">
                  Plural
                </p>
                {groups.plural.map(([pronoun, form]) => (
                  <FormRow
                    key={pronoun}
                    pronoun={pronoun}
                    form={form}
                    language={language}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Continue CTA */}
        {nextTense ? (
          <button
            type="button"
            onClick={() => onSelectTense(nextTense)}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold cursor-pointer transition-transform active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verb focus-visible:ring-offset-2"
            style={{
              backgroundColor: 'var(--color-verb)',
              color: 'var(--color-text-inverse)',
              boxShadow: '0 3px 0 color-mix(in srgb, var(--color-verb) 65%, #000)',
            }}
          >
            Próximo: {TENSE_LABELS[nextTense] ?? nextTense}
            <ChevronRight size={18} aria-hidden />
          </button>
        ) : (
          <p className="py-2 text-center text-sm font-medium text-text-muted">
            Você viu todos os tempos deste verbo
          </p>
        )}
      </div>
    </section>
  );
}
