'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  VANDERTRAMP_ACRONYM,
  VANDERTRAMP_VERBS,
  getVandertrampVerb,
  isVandertrampVerb,
  normalizeInfinitive,
} from '@/lib/pedagogy/vandertramp';
import type { SupportedLanguage } from '@/types';

type VerbAuxiliaryHintProps = {
  infinitive: string;
  language: SupportedLanguage;
};

/**
 * On-demand reference when the learner opens a Vandertramp verb in Verb Explorer.
 * Not a daily task — only appears for verbs that take être.
 */
export function VerbAuxiliaryHint({ infinitive, language }: VerbAuxiliaryHintProps) {
  const [expanded, setExpanded] = useState(false);

  if (language !== 'fr' || !isVandertrampVerb(infinitive)) return null;

  const current = getVandertrampVerb(infinitive);
  const currentKey = normalizeInfinitive(infinitive);

  return (
    <div
      className="rounded-2xl border px-4 py-3.5 animate-slide-up-spring"
      style={{
        borderColor: 'rgba(124, 58, 237, 0.22)',
        backgroundColor: 'color-mix(in srgb, var(--color-verb-bg) 65%, transparent)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex flex-col gap-1">
          <span
            className="text-[10px] font-extrabold uppercase tracking-widest"
            style={{ color: 'var(--color-verb)' }}
          >
            Auxiliar no passado
          </span>
          <p className="text-sm font-semibold text-text-primary leading-snug">
            Usa <span className="font-extrabold">être</span> no passé composé
            {current ? (
              <>
                {' '}
                <span className="text-text-muted font-medium">
                  ({current.letter} · {current.meaningPt})
                </span>
              </>
            ) : null}
          </p>
          <p className="text-xs text-text-muted leading-relaxed">
            Mnemônico: <span className="font-bold text-text-secondary">{VANDERTRAMP_ACRONYM}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="shrink-0 inline-flex items-center gap-1 rounded-xl border border-border bg-surface px-2.5 py-2 text-[11px] font-bold text-text-secondary min-h-[44px] cursor-pointer hover:border-verb/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verb"
        >
          {expanded ? 'Fechar' : 'Lista'}
          {expanded ? <ChevronUp size={14} aria-hidden /> : <ChevronDown size={14} aria-hidden />}
        </button>
      </div>

      {expanded && (
        <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5 border-t border-border/50 pt-3">
          {VANDERTRAMP_VERBS.map((verb) => {
            const highlight = normalizeInfinitive(verb.infinitive) === currentKey;
            return (
              <li
                key={`${verb.letter}-${verb.infinitive}`}
                className={`flex items-baseline gap-2 rounded-lg px-2 py-1.5 text-sm ${
                  highlight ? 'bg-verb/10 font-bold text-text-primary' : 'text-text-secondary'
                }`}
              >
                <span
                  className="w-4 shrink-0 text-[11px] font-extrabold"
                  style={{ color: 'var(--color-verb)' }}
                >
                  {verb.letter}
                </span>
                <span className="truncate">
                  {verb.infinitive}
                  <span className="ml-1.5 text-xs font-normal text-text-muted">
                    {verb.meaningPt}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
