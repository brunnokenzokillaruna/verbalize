'use client';

import { isNativeFrenchPhrase } from '@/lib/pedagogy/nativePhrases';
import type { SupportedLanguage } from '@/types';

type NativePhraseBadgeProps = {
  phrase: string;
  language: SupportedLanguage;
  className?: string;
};

/** Tiny on-demand cue in vocab review — not a separate study mode. */
export function NativePhraseBadge({ phrase, language, className = '' }: NativePhraseBadgeProps) {
  if (language !== 'fr' || !isNativeFrenchPhrase(phrase)) return null;

  return (
    <span
      className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${className}`}
      style={{
        color: 'var(--color-primary)',
        backgroundColor: 'var(--color-primary-light)',
      }}
      title="Frase da fala cotidiana — usada por nativos"
    >
      fala
    </span>
  );
}
